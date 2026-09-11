package config

import (
	"testing"

	"github.com/oduvan/lyabah-refigure/internal/releases"
)

func TestLoadDefaults(t *testing.T) {
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.Addr != defaultAddr {
		t.Errorf("Addr = %q, want %q", cfg.Addr, defaultAddr)
	}
	if cfg.ReleaseFallback.Version != defaultVersion {
		t.Errorf("Version = %q, want %q", cfg.ReleaseFallback.Version, defaultVersion)
	}
	if len(cfg.ReleaseFallback.Downloads) != len(defaultDownloads) {
		t.Fatalf("got %d downloads, want %d", len(cfg.ReleaseFallback.Downloads), len(defaultDownloads))
	}
}

func TestPortOverride(t *testing.T) {
	t.Setenv("PORT", "9090")
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.Addr != ":9090" {
		t.Errorf("Addr = %q, want :9090", cfg.Addr)
	}
}

func TestInvalidPortIsAnError(t *testing.T) {
	for _, port := range []string{"nope", "0", "70000", "-1"} {
		t.Run(port, func(t *testing.T) {
			t.Setenv("PORT", port)
			if _, err := Load(); err == nil {
				t.Errorf("PORT=%s was accepted", port)
			}
		})
	}
}

// A new release is shipped by changing environment variables, not the binary.
func TestReleaseOverrides(t *testing.T) {
	t.Setenv("REFIGURE_VERSION", "2.1.0")
	t.Setenv("REFIGURE_MAC_URL", "https://example.com/Refigure-2.1.0.dmg")
	t.Setenv("REFIGURE_MAC_SIZE", "101 MB")
	// An explicitly empty size must win over the default, not fall back to it.
	t.Setenv("REFIGURE_LINUX_SIZE", "")
	// An empty URL, though, would render a dead button, so it falls back.
	t.Setenv("REFIGURE_WINDOWS_URL", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.ReleaseFallback.Version != "2.1.0" {
		t.Errorf("Version = %q, want 2.1.0", cfg.ReleaseFallback.Version)
	}
	byPlatform := map[releases.Platform]releases.Download{}
	for _, d := range cfg.ReleaseFallback.Downloads {
		byPlatform[d.Platform] = d
	}
	if got := byPlatform["mac"]; got.URL != "https://example.com/Refigure-2.1.0.dmg" || got.Size != "101 MB" {
		t.Errorf("mac = %+v", got)
	}
	if got := byPlatform["linux"].Size; got != "" {
		t.Errorf("linux size = %q, want empty", got)
	}
	if got := byPlatform["windows"].URL; got != defaultDownloads[1].URL {
		t.Errorf("windows url = %q, want the default", got)
	}
	if got := byPlatform["mac"].URL; got == "" {
		t.Error("mac url is empty")
	}
}
