// Package config reads the server's settings from the environment.
//
// Every value has a working default, so the binary runs with no configuration
// at all; the deployment overrides only what changes between releases.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/oduvan/lyabah-refigure/internal/releases"
)

// Config is the fully resolved server configuration.
type Config struct {
	// Addr is the listen address, e.g. ":8080".
	Addr string
	// StaticDir serves the site from disk instead of the embedded copy.
	// Empty means "use the embedded build". Intended for local development.
	StaticDir string
	// CanonicalHost, when set, is the host visitors are redirected to. It keeps
	// one canonical origin when Traefik also routes, say, the www name.
	CanonicalHost string
	// ReleaseFallback is what the download buttons show before GitHub has
	// answered, and whenever it cannot. Values set in the environment also
	// override what the release says, which is the escape hatch for a platform
	// published somewhere other than a GitHub asset (a store listing, say).
	ReleaseFallback releases.Release
	// ReleasesRepo is the "owner/name" whose latest release drives the buttons.
	ReleasesRepo string
	// ReleasesTTL bounds how often GitHub is asked.
	ReleasesTTL time.Duration
	// GitHubToken is optional; it only lifts the unauthenticated rate limit.
	GitHubToken string
	// LogLevel is one of debug, info, warn, error.
	LogLevel string
	// ReadTimeout and friends bound a request's lifetime.
	ReadHeaderTimeout time.Duration
	WriteTimeout      time.Duration
	IdleTimeout       time.Duration
	ShutdownTimeout   time.Duration
}

const (
	defaultAddr    = ":8080"
	defaultVersion = "1.0.0"
	defaultRepo    = "oduvan/lyabah-refigure"
	defaultTTL     = 15 * time.Minute
)

// The v1.0.0 assets, so the buttons are correct even before GitHub answers.
// They are replaced by whatever the latest release actually holds.
var defaultDownloads = []releases.Download{
	{
		Platform: releases.Mac,
		URL:      "https://github.com/oduvan/lyabah-refigure/releases/download/v1.0.0/Refigure-1.0.0-universal.dmg",
		Size:     "179 MB",
	},
	{
		Platform: releases.Windows,
		URL:      "https://github.com/oduvan/lyabah-refigure/releases/download/v1.0.0/Refigure-Setup-1.0.0.exe",
		Size:     "84 MB",
	},
	{
		Platform: releases.Linux,
		URL:      "https://github.com/oduvan/lyabah-refigure/releases/download/v1.0.0/Refigure-1.0.0.AppImage",
		Size:     "111 MB",
	},
}

// Load builds a Config from the process environment.
func Load() (Config, error) {
	cfg := Config{
		Addr:              defaultAddr,
		StaticDir:         strings.TrimSpace(os.Getenv("REFIGURE_STATIC_DIR")),
		CanonicalHost:     strings.TrimSpace(os.Getenv("REFIGURE_CANONICAL_HOST")),
		LogLevel:          envOr("LOG_LEVEL", "info"),
		ReadHeaderTimeout: 10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
		ShutdownTimeout:   10 * time.Second,
	}

	if port := strings.TrimSpace(os.Getenv("PORT")); port != "" {
		n, err := strconv.Atoi(port)
		if err != nil || n < 1 || n > 65535 {
			return Config{}, fmt.Errorf("PORT: %q is not a valid port number", port)
		}
		cfg.Addr = ":" + port
	}
	if addr := strings.TrimSpace(os.Getenv("REFIGURE_ADDR")); addr != "" {
		cfg.Addr = addr
	}

	cfg.ReleaseFallback = loadReleaseFallback()
	cfg.ReleasesRepo = envOr("REFIGURE_RELEASES_REPO", defaultRepo)
	cfg.GitHubToken = strings.TrimSpace(os.Getenv("GITHUB_TOKEN"))
	cfg.ReleasesTTL = defaultTTL
	if raw := strings.TrimSpace(os.Getenv("REFIGURE_RELEASES_TTL")); raw != "" {
		ttl, err := time.ParseDuration(raw)
		if err != nil || ttl <= 0 {
			return Config{}, fmt.Errorf("REFIGURE_RELEASES_TTL: %q is not a positive duration", raw)
		}
		cfg.ReleasesTTL = ttl
	}
	return cfg, nil
}

func loadReleaseFallback() releases.Release {
	rel := releases.Release{
		Version:   envOr("REFIGURE_VERSION", defaultVersion),
		Downloads: make([]releases.Download, 0, len(defaultDownloads)),
	}
	for _, d := range defaultDownloads {
		key := strings.ToUpper(string(d.Platform))
		url := envOr("REFIGURE_"+key+"_URL", d.URL)
		if strings.TrimSpace(url) == "" {
			// A blank URL would render a dead button; an empty size is a
			// legitimate choice (store listings have none), so only the URL
			// falls back here.
			url = d.URL
		}
		rel.Downloads = append(rel.Downloads, releases.Download{
			Platform: d.Platform,
			URL:      url,
			Size:     envOr("REFIGURE_"+key+"_SIZE", d.Size),
		})
	}
	return rel
}

func envOr(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		// An explicitly empty value is meaningful for Size, so only a missing
		// variable falls back.
		return v
	}
	return fallback
}
