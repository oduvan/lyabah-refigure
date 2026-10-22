package server

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/oduvan/lyabah-refigure/internal/config"
)

const testKey = "test-key-0123456789abcdef"

func withKey(key string) func(*config.Config) {
	return func(cfg *config.Config) { cfg.APIKey = key }
}

func errorBody(t *testing.T, res *http.Response) string {
	t.Helper()
	if ct := res.Header.Get("Content-Type"); !strings.HasPrefix(ct, "application/json") {
		t.Errorf("Content-Type = %q, want application/json", ct)
	}
	var body struct {
		Error string `json:"error"`
	}
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		t.Fatalf("decoding the error body: %v", err)
	}
	if body.Error == "" {
		t.Error(`the body has no "error"`)
	}
	return body.Error
}

func TestPingWithoutKeyIs401(t *testing.T) {
	res := get(t, newTestServer(t, withKey(testKey)), "/api/ping", nil)
	if res.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
	if got := res.Header.Get("WWW-Authenticate"); got != "Bearer" {
		t.Errorf("WWW-Authenticate = %q, want Bearer", got)
	}
	errorBody(t, res)
}

func TestPingWithWrongKeyIs401(t *testing.T) {
	h := newTestServer(t, withKey(testKey))
	for _, auth := range []string{
		"Bearer wrong-key-0123456789",
		"Bearer " + testKey + "x",
		"Basic " + testKey, // the right key, but not as a bearer token
		testKey,
	} {
		res := get(t, h, "/api/ping", map[string]string{"Authorization": auth})
		if res.StatusCode != http.StatusUnauthorized {
			t.Errorf("%q: status = %d, want 401", auth, res.StatusCode)
			continue
		}
		if got := res.Header.Get("WWW-Authenticate"); got != "Bearer" {
			t.Errorf("%q: WWW-Authenticate = %q, want Bearer", auth, got)
		}
		errorBody(t, res)
	}
}

func TestPingWithUnsetKeyIs503(t *testing.T) {
	// Empty, and set but too short: both count as "not set", and neither
	// lets a request through, not even one that sends the same short value.
	for _, key := range []string{"", "short-key"} {
		h := newTestServer(t, withKey(key))
		res := get(t, h, "/api/ping", map[string]string{"Authorization": "Bearer " + key})
		if res.StatusCode != http.StatusServiceUnavailable {
			t.Errorf("key %q: status = %d, want 503", key, res.StatusCode)
			continue
		}
		if got := errorBody(t, res); got != "LYABAH_KEY is not set" {
			t.Errorf("key %q: error = %q, want %q", key, got, "LYABAH_KEY is not set")
		}
	}
}

func TestPingWithRightKey(t *testing.T) {
	h := newTestServer(t, func(cfg *config.Config) {
		cfg.APIKey = testKey
		cfg.ServiceName = "refigure"
	})
	res := get(t, h, "/api/ping", map[string]string{"Authorization": "Bearer " + testKey})
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	raw, _ := io.ReadAll(res.Body)
	var body struct {
		OK      bool   `json:"ok"`
		Service string `json:"service"`
	}
	if err := json.Unmarshal(raw, &body); err != nil {
		t.Fatalf("decoding %q: %v", raw, err)
	}
	if !body.OK || body.Service != "refigure" {
		t.Errorf("body = %s, want {\"ok\":true,\"service\":\"refigure\"}", raw)
	}
}

// The landing site and its public JSON stay open, with or without a key.
func TestPublicRoutesNeedNoKey(t *testing.T) {
	for _, key := range []string{"", testKey} {
		h := newTestServer(t, withKey(key))
		for _, path := range []string{"/", "/uk/privacy", "/health", "/api/v1/releases", "/robots.txt"} {
			if res := get(t, h, path, nil); res.StatusCode != http.StatusOK {
				t.Errorf("key %q, %s: status = %d, want 200", key, path, res.StatusCode)
			}
		}
	}
}
