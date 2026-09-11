package releases

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"sync/atomic"
	"testing"
	"time"
)

func byPlatform(r Release) map[Platform]Download {
	out := map[Platform]Download{}
	for _, d := range r.Downloads {
		out[d.Platform] = d
	}
	return out
}

// The fixture is the real v1.0.0 release, so this pins the behaviour against
// what electron-builder actually publishes.
func loadFixture(t *testing.T) ghRelease {
	t.Helper()
	raw, err := os.ReadFile("testdata/latest_release.json")
	if err != nil {
		t.Fatalf("reading the fixture: %v", err)
	}
	var gh ghRelease
	if err := json.Unmarshal(raw, &gh); err != nil {
		t.Fatalf("decoding the fixture: %v", err)
	}
	return gh
}

func TestPicksTheInstallerAVisitorWants(t *testing.T) {
	got := fromGitHub(loadFixture(t))

	if got.Version != "1.0.0" {
		t.Errorf("version = %q, want 1.0.0 (the leading v stripped)", got.Version)
	}

	want := map[Platform]struct{ url, size string }{
		Mac: {
			"https://github.com/oduvan/lyabah-refigure/releases/download/v1.0.0/Refigure-1.0.0-universal.dmg",
			"179 MB",
		},
		Windows: {
			"https://github.com/oduvan/lyabah-refigure/releases/download/v1.0.0/Refigure-Setup-1.0.0.exe",
			"84 MB",
		},
		Linux: {
			"https://github.com/oduvan/lyabah-refigure/releases/download/v1.0.0/Refigure-1.0.0.AppImage",
			"111 MB",
		},
	}
	downloads := byPlatform(got)
	for platform, w := range want {
		d, ok := downloads[platform]
		if !ok {
			t.Errorf("no download for %s", platform)
			continue
		}
		if d.URL != w.url {
			t.Errorf("%s: url = %q, want %q", platform, d.URL, w.url)
		}
		if d.Size != w.size {
			t.Errorf("%s: size = %q, want %q", platform, d.Size, w.size)
		}
	}

	if len(got.Downloads) != 3 {
		t.Errorf("got %d downloads, want 3", len(got.Downloads))
	}
	// Display order is mac, windows, linux regardless of asset order.
	for i, p := range []Platform{Mac, Windows, Linux} {
		if got.Downloads[i].Platform != p {
			t.Errorf("downloads[%d] = %s, want %s", i, got.Downloads[i].Platform, p)
		}
	}
}

// The updater files sit beside the installers and must never be offered.
func TestNeverOffersUpdaterMetadata(t *testing.T) {
	got := fromGitHub(loadFixture(t))
	for _, d := range got.Downloads {
		for _, bad := range []string{".blockmap", ".yml", "latest"} {
			if contains(d.URL, bad) {
				t.Errorf("%s points at metadata: %s", d.Platform, d.URL)
			}
		}
	}
	// The mac .zip exists only for the auto-updater; the .dmg must win.
	if mac := byPlatform(got)[Mac]; contains(mac.URL, ".zip") {
		t.Errorf("mac offered the updater zip: %s", mac.URL)
	}
	// arm64 must not win over the x64 AppImage.
	if linux := byPlatform(got)[Linux]; contains(linux.URL, "arm64") {
		t.Errorf("linux offered the arm64 build: %s", linux.URL)
	}
}

func contains(haystack, needle string) bool {
	return len(needle) > 0 && len(haystack) >= len(needle) &&
		(func() bool {
			for i := 0; i+len(needle) <= len(haystack); i++ {
				if haystack[i:i+len(needle)] == needle {
					return true
				}
			}
			return false
		})()
}

func TestFormatSizeMatchesGitHubsDisplay(t *testing.T) {
	cases := []struct {
		bytes int64
		want  string
	}{
		{187676765, "179 MB"},
		{87868084, "84 MB"},
		{116058952, "111 MB"},
		{80899952, "77 MB"},
		{999, "999 B"},
		{5 * 1024, "5.0 KB"},
		{3 * 1024 * 1024 * 1024, "3.0 GB"},
	}
	for _, c := range cases {
		if got := formatSize(c.bytes); got != c.want {
			t.Errorf("formatSize(%d) = %q, want %q", c.bytes, got, c.want)
		}
	}
}

// A platform the release has no asset for keeps whatever was configured by
// hand — that is how a Microsoft Store listing survives.
func TestFallbackFillsMissingPlatforms(t *testing.T) {
	primary := Release{
		Version:   "2.0.0",
		Downloads: []Download{{Platform: Mac, URL: "https://example.com/a.dmg", Size: "10 MB"}},
	}
	fallback := Release{
		Version: "1.0.0",
		Downloads: []Download{
			{Platform: Mac, URL: "https://example.com/old.dmg", Size: "9 MB"},
			{Platform: Windows, URL: "https://apps.microsoft.com/detail/refigure", Size: ""},
		},
	}
	got := byPlatform(merge(primary, fallback))

	if got[Mac].URL != "https://example.com/a.dmg" {
		t.Errorf("the release should win for mac, got %q", got[Mac].URL)
	}
	if got[Windows].URL != "https://apps.microsoft.com/detail/refigure" {
		t.Errorf("the store listing should survive, got %q", got[Windows].URL)
	}
}

func serveFixture(t *testing.T, hits *atomic.Int32, status int) *httptest.Server {
	t.Helper()
	raw, err := os.ReadFile("testdata/latest_release.json")
	if err != nil {
		t.Fatalf("reading the fixture: %v", err)
	}
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		if status != http.StatusOK {
			w.WriteHeader(status)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(raw)
	}))
}

func newTestProvider(t *testing.T, srv *httptest.Server, ttl time.Duration, fallback Release) *Provider {
	t.Helper()
	p := New(Options{Repo: "oduvan/lyabah-refigure", TTL: ttl, Fallback: fallback})
	// Point the provider at the stub instead of api.github.com.
	p.client = &http.Client{Transport: rewriteTo(srv.URL)}
	return p
}

type rewrite string

func rewriteTo(target string) http.RoundTripper { return rewrite(target) }

func (r rewrite) RoundTrip(req *http.Request) (*http.Response, error) {
	clone := req.Clone(req.Context())
	stub, err := http.NewRequest(req.Method, string(r), nil)
	if err != nil {
		return nil, err
	}
	clone.URL.Scheme, clone.URL.Host = stub.URL.Scheme, stub.URL.Host
	return http.DefaultTransport.RoundTrip(clone)
}

// A burst of visitors must not become a burst of GitHub requests.
func TestCachesWithinTTL(t *testing.T) {
	var hits atomic.Int32
	srv := serveFixture(t, &hits, http.StatusOK)
	defer srv.Close()

	p := newTestProvider(t, srv, time.Hour, Release{})
	for i := 0; i < 25; i++ {
		if got := p.Current(context.Background()); got.Version != "1.0.0" {
			t.Fatalf("version = %q on call %d", got.Version, i)
		}
	}
	if n := hits.Load(); n != 1 {
		t.Errorf("hit GitHub %d times, want 1", n)
	}
}

// GitHub being down must never blank the download buttons.
func TestServesFallbackThenStaleOnFailure(t *testing.T) {
	fallback := Release{
		Version:   "0.9.0",
		Downloads: []Download{{Platform: Mac, URL: "https://example.com/fallback.dmg", Size: "1 MB"}},
	}

	var failHits atomic.Int32
	failing := serveFixture(t, &failHits, http.StatusInternalServerError)
	defer failing.Close()

	cold := newTestProvider(t, failing, time.Nanosecond, fallback)
	if got := cold.Current(context.Background()); got.Version != "0.9.0" {
		t.Errorf("with no cache yet, version = %q, want the fallback 0.9.0", got.Version)
	}

	var okHits atomic.Int32
	working := serveFixture(t, &okHits, http.StatusOK)
	defer working.Close()

	warm := newTestProvider(t, working, time.Nanosecond, fallback)
	if got := warm.Current(context.Background()); got.Version != "1.0.0" {
		t.Fatalf("version = %q, want 1.0.0", got.Version)
	}
	// Now break it: the previous good answer must survive.
	warm.client = &http.Client{Transport: rewriteTo(failing.URL)}
	if got := warm.Current(context.Background()); got.Version != "1.0.0" {
		t.Errorf("after a failed refresh, version = %q, want the stale 1.0.0", got.Version)
	}
}

func TestRejectsAReleaseWithNothingToDownload(t *testing.T) {
	empty := ghRelease{TagName: "v3.0.0", Assets: []ghAsset{
		{Name: "latest.yml", Size: 10, URL: "https://example.com/latest.yml"},
	}}
	if got := fromGitHub(empty); len(got.Downloads) != 0 {
		t.Errorf("metadata-only release produced %d downloads", len(got.Downloads))
	}
}

// The case this was built for: the release ships a direct Windows installer,
// but Windows visitors should be sent to the Microsoft Store instead. Before
// the override was applied after the fetch, the release simply won and the
// configured store link was silently ignored.
func TestOverrideBeatsTheRelease(t *testing.T) {
	release := fromGitHub(loadFixture(t))
	store := "https://apps.microsoft.com/detail/refigure"

	got := byPlatform(applyOverrides(release, "", []Override{
		{Platform: Windows, URL: store, Size: "", SizeSet: true},
	}))

	if got[Windows].URL != store {
		t.Errorf("windows url = %q, want the store listing %q", got[Windows].URL, store)
	}
	if got[Windows].Size != "" {
		t.Errorf("windows size = %q, want empty — a store listing has no file", got[Windows].Size)
	}
	// The platforms not overridden must still come from the release.
	if !contains(got[Mac].URL, "Refigure-1.0.0-universal.dmg") {
		t.Errorf("mac should still come from the release, got %q", got[Mac].URL)
	}
	if got[Linux].Size != "111 MB" {
		t.Errorf("linux size = %q, want the release's 111 MB", got[Linux].Size)
	}
}

// A size override alone must not wipe the URL, and vice versa.
func TestPartialOverrides(t *testing.T) {
	release := fromGitHub(loadFixture(t))

	sizeOnly := byPlatform(applyOverrides(release, "", []Override{
		{Platform: Mac, SizeSet: true, Size: "about 180 MB"},
	}))
	if sizeOnly[Mac].Size != "about 180 MB" {
		t.Errorf("size = %q, want the override", sizeOnly[Mac].Size)
	}
	if !contains(sizeOnly[Mac].URL, "Refigure-1.0.0-universal.dmg") {
		t.Errorf("a size override cleared the url: %q", sizeOnly[Mac].URL)
	}

	urlOnly := byPlatform(applyOverrides(release, "", []Override{
		{Platform: Mac, URL: "https://example.com/custom.dmg"},
	}))
	if urlOnly[Mac].URL != "https://example.com/custom.dmg" {
		t.Errorf("url = %q, want the override", urlOnly[Mac].URL)
	}
	if urlOnly[Mac].Size != "179 MB" {
		t.Errorf("a url override cleared the size: %q", urlOnly[Mac].Size)
	}
}

func TestVersionOverride(t *testing.T) {
	release := fromGitHub(loadFixture(t))
	if got := applyOverrides(release, "2.0.0-beta", nil); got.Version != "2.0.0-beta" {
		t.Errorf("version = %q, want the override", got.Version)
	}
	if got := applyOverrides(release, "", nil); got.Version != "1.0.0" {
		t.Errorf("with no override, version = %q, want the release's 1.0.0", got.Version)
	}
}

// An override survives every path Current can take, including a GitHub outage.
func TestOverrideSurvivesAFailedFetch(t *testing.T) {
	store := "https://apps.microsoft.com/detail/refigure"
	overrides := []Override{{Platform: Windows, URL: store, SizeSet: true}}

	var hits atomic.Int32
	failing := serveFixture(t, &hits, http.StatusInternalServerError)
	defer failing.Close()

	fallback := Release{
		Version:   "1.0.0",
		Downloads: []Download{{Platform: Windows, URL: "https://example.com/setup.exe", Size: "84 MB"}},
	}
	p := New(Options{Repo: "oduvan/lyabah-refigure", TTL: time.Hour, Fallback: fallback, Overrides: overrides})
	p.client = &http.Client{Transport: rewriteTo(failing.URL)}

	if got := byPlatform(p.Current(context.Background()))[Windows]; got.URL != store {
		t.Errorf("with GitHub down, windows url = %q, want the store listing", got.URL)
	}
}
