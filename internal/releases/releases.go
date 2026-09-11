// Package releases turns a GitHub release into the download data the landing
// page shows.
//
// The buttons used to come from environment variables, which meant every
// desktop release needed an .env edit on the server. Now the site reads the
// repository's latest GitHub release directly: publishing a release is the only
// step. The result is cached, and a failed refresh keeps serving the last good
// answer rather than blanking the buttons.
package releases

import (
	"fmt"
	"sort"
	"strings"
)

// Platform is one of the three download buttons.
type Platform string

const (
	Mac     Platform = "mac"
	Windows Platform = "windows"
	Linux   Platform = "linux"
)

// Platforms is the display order the landing page uses.
var Platforms = []Platform{Mac, Windows, Linux}

// Download is one platform's artefact.
type Download struct {
	Platform Platform `json:"platform"`
	URL      string   `json:"url"`
	// Size is human-readable, e.g. "179 MB". Empty when unknown, or for a
	// store listing that has no file behind it.
	Size string `json:"size"`
}

// Release is the payload of GET /api/v1/releases.
type Release struct {
	Version   string     `json:"version"`
	Downloads []Download `json:"downloads"`
}

// ── Choosing one asset per platform ─────────────────────────────────────────

// electron-builder publishes updater metadata beside the installers; none of it
// is something a visitor should download.
func isMetadata(name string) bool {
	lower := strings.ToLower(name)
	return strings.HasSuffix(lower, ".blockmap") ||
		strings.HasSuffix(lower, ".yml") ||
		strings.HasSuffix(lower, ".yaml") ||
		strings.HasSuffix(lower, ".sha256") ||
		strings.HasSuffix(lower, ".sig") ||
		strings.HasSuffix(lower, ".asc")
}

// candidate scores an asset for a platform. A higher rank wins; rank 0 means
// the asset is not a download for that platform at all.
//
// The ranking prefers the installer a visitor arriving from the landing page
// wants: a .dmg over the .zip that exists for the auto-updater, an .AppImage
// (runs anywhere) over a .deb, and x64/universal over arm64, since the buttons
// are not architecture-aware.
func rank(platform Platform, name string) int {
	lower := strings.ToLower(name)
	arm := strings.Contains(lower, "arm64") || strings.Contains(lower, "aarch64")

	switch platform {
	case Mac:
		switch {
		case strings.HasSuffix(lower, ".dmg"):
			if strings.Contains(lower, "universal") {
				return 30
			}
			return 20
		case strings.HasSuffix(lower, ".pkg"):
			return 15
		case strings.HasSuffix(lower, "-mac.zip"), strings.HasSuffix(lower, "-darwin.zip"):
			return 5 // present for the updater; a poor thing to hand a human
		}
	case Windows:
		switch {
		case strings.HasSuffix(lower, ".exe"):
			return 30
		case strings.HasSuffix(lower, ".msi"):
			return 25
		case strings.HasSuffix(lower, ".appx"), strings.HasSuffix(lower, ".msix"):
			return 20
		}
	case Linux:
		base := 0
		switch {
		case strings.HasSuffix(lower, ".appimage"):
			base = 30
		case strings.HasSuffix(lower, ".deb"):
			base = 20
		case strings.HasSuffix(lower, ".rpm"):
			base = 15
		case strings.HasSuffix(lower, ".tar.gz"):
			base = 10
		}
		if base > 0 && arm {
			base -= 5 // same format, but the wrong architecture for most visitors
		}
		return base
	}
	return 0
}

type ghAsset struct {
	Name string `json:"name"`
	Size int64  `json:"size"`
	URL  string `json:"browser_download_url"`
}

type ghRelease struct {
	TagName    string    `json:"tag_name"`
	Draft      bool      `json:"draft"`
	Prerelease bool      `json:"prerelease"`
	Assets     []ghAsset `json:"assets"`
}

// formatSize renders bytes the way GitHub's own release page does.
func formatSize(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit && exp < 3; n /= unit {
		div *= unit
		exp++
	}
	value := float64(b) / float64(div)
	suffix := [...]string{"KB", "MB", "GB", "TB"}[exp]
	if value < 10 {
		return fmt.Sprintf("%.1f %s", value, suffix)
	}
	return fmt.Sprintf("%.0f %s", value, suffix)
}

// fromGitHub picks the best asset per platform. Platforms with no matching
// asset are left out, so the caller can fall back for those alone.
func fromGitHub(r ghRelease) Release {
	out := Release{Version: strings.TrimPrefix(r.TagName, "v")}

	for _, platform := range Platforms {
		best, bestRank := ghAsset{}, 0
		for _, a := range r.Assets {
			if isMetadata(a.Name) || a.URL == "" {
				continue
			}
			if got := rank(platform, a.Name); got > bestRank {
				best, bestRank = a, got
			}
		}
		if bestRank == 0 {
			continue
		}
		out.Downloads = append(out.Downloads, Download{
			Platform: platform,
			URL:      best.URL,
			Size:     formatSize(best.Size),
		})
	}

	sortByPlatform(out.Downloads)
	return out
}

func indexOf(p Platform) int {
	for i, candidate := range Platforms {
		if candidate == p {
			return i
		}
	}
	return len(Platforms)
}

// merge fills anything the release did not supply from fallback, so a platform
// with no asset in the release still renders.
func merge(primary, fallback Release) Release {
	out := Release{Version: primary.Version}
	if out.Version == "" {
		out.Version = fallback.Version
	}
	have := map[Platform]bool{}
	for _, d := range primary.Downloads {
		have[d.Platform] = true
	}
	out.Downloads = append(out.Downloads, primary.Downloads...)
	for _, d := range fallback.Downloads {
		if !have[d.Platform] {
			out.Downloads = append(out.Downloads, d)
		}
	}
	sortByPlatform(out.Downloads)
	return out
}

// Override replaces part of what a release said about one platform. It exists
// for a download that is not a GitHub asset at all — a Microsoft Store listing
// being the case in point: the release publishes a .exe, but the site may be
// told to send Windows visitors to the Store instead.
type Override struct {
	Platform Platform
	// URL, when set, replaces the release's link for this platform.
	URL string
	// Size replaces the release's size. SizeSet distinguishes "leave it alone"
	// from "deliberately blank", which is what a store listing wants — there is
	// no file behind it to state the size of.
	Size    string
	SizeSet bool
}

// applyOverrides runs last, so what an operator configured beats what the
// release happens to contain.
func applyOverrides(r Release, version string, overrides []Override) Release {
	if version != "" {
		r.Version = version
	}
	if len(overrides) == 0 {
		return r
	}

	downloads := make([]Download, len(r.Downloads))
	copy(downloads, r.Downloads)

	for _, o := range overrides {
		at := -1
		for i := range downloads {
			if downloads[i].Platform == o.Platform {
				at = i
				break
			}
		}
		if at == -1 {
			// A platform the release says nothing about — a store-only
			// platform, for instance.
			if o.URL != "" {
				downloads = append(downloads, Download{Platform: o.Platform, URL: o.URL, Size: o.Size})
			}
			continue
		}
		if o.URL != "" {
			downloads[at].URL = o.URL
		}
		if o.SizeSet {
			downloads[at].Size = o.Size
		}
	}

	sortByPlatform(downloads)
	return Release{Version: r.Version, Downloads: downloads}
}

func sortByPlatform(downloads []Download) {
	sort.Slice(downloads, func(i, j int) bool {
		return indexOf(downloads[i].Platform) < indexOf(downloads[j].Platform)
	})
}
