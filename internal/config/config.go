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
	// Release describes the downloads advertised on the landing page.
	Release Release
	// LogLevel is one of debug, info, warn, error.
	LogLevel string
	// ReadTimeout and friends bound a request's lifetime.
	ReadHeaderTimeout time.Duration
	WriteTimeout      time.Duration
	IdleTimeout       time.Duration
	ShutdownTimeout   time.Duration
}

// Download is one platform's artefact.
type Download struct {
	Platform string `json:"platform"`
	URL      string `json:"url"`
	// Size is shown next to the button, e.g. "94 MB". Empty for store links.
	Size string `json:"size"`
}

// Release is the payload of GET /api/v1/releases.
type Release struct {
	Version   string     `json:"version"`
	Downloads []Download `json:"downloads"`
}

const (
	defaultAddr    = ":8080"
	defaultVersion = "1.0.0"
)

// Defaults match what the landing page falls back to when the API is
// unreachable, so the two never disagree by accident.
var defaultDownloads = []Download{
	{
		Platform: "mac",
		URL:      "https://github.com/oduvan/refigure/releases/download/v1.0.0/Refigure-1.0.0-universal.dmg",
		Size:     "94 MB",
	},
	{
		Platform: "windows",
		URL:      "https://apps.microsoft.com/detail/refigure",
		Size:     "",
	},
	{
		Platform: "linux",
		URL:      "https://github.com/oduvan/refigure/releases/download/v1.0.0/Refigure-1.0.0-x86_64.AppImage",
		Size:     "108 MB",
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

	cfg.Release = loadRelease()
	return cfg, nil
}

func loadRelease() Release {
	rel := Release{
		Version:   envOr("REFIGURE_VERSION", defaultVersion),
		Downloads: make([]Download, 0, len(defaultDownloads)),
	}
	for _, d := range defaultDownloads {
		key := strings.ToUpper(d.Platform)
		url := envOr("REFIGURE_"+key+"_URL", d.URL)
		if strings.TrimSpace(url) == "" {
			// A blank URL would render a dead button; an empty size is a
			// legitimate choice (store listings have none), so only the URL
			// falls back here.
			url = d.URL
		}
		rel.Downloads = append(rel.Downloads, Download{
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
