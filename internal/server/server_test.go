package server

import (
	"compress/gzip"
	"encoding/json"
	"io"
	"io/fs"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/oduvan/lyabah-refigure/internal/config"
	"github.com/oduvan/lyabah-refigure/internal/releases"
)

const indexHTML = `<!doctype html><html><head>` +
	`<script>console.log("boot")</script>` +
	`<script type="module" src="/assets/app.js"></script>` +
	`</head><body><div id="root"></div></body></html>`

func testAssets() fs.FS {
	return fstest.MapFS{
		"index.html":           {Data: []byte(indexHTML)},
		"assets/app.js":        {Data: []byte("console.log(1)")},
		"assets/app.css":       {Data: []byte("body{color:red}")},
		"favicon.svg":          {Data: []byte(`<svg xmlns="http://www.w3.org/2000/svg"/>`)},
		"robots.txt":           {Data: []byte("User-agent: *\n")},
		"apple-touch-icon.png": {Data: []byte("\x89PNG\r\n\x1a\n")},
	}
}

func newTestServer(t *testing.T, mutate func(*config.Config)) http.Handler {
	t.Helper()
	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("config.Load: %v", err)
	}
	// No repository means the provider never reaches the network: these tests
	// exercise the HTTP surface, and internal/releases covers the GitHub side
	// against a stub. Without this the suite would depend on api.github.com.
	cfg.ReleasesRepo = ""
	if mutate != nil {
		mutate(&cfg)
	}
	log := slog.New(slog.DiscardHandler)
	return New(cfg, log, testAssets(), true).Handler()
}

func get(t *testing.T, h http.Handler, target string, headers map[string]string) *http.Response {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec.Result()
}

func TestHealth(t *testing.T) {
	res := get(t, newTestServer(t, nil), "/health", nil)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	body, _ := io.ReadAll(res.Body)
	if strings.TrimSpace(string(body)) != "healthy" {
		t.Errorf("body = %q, want %q", body, "healthy")
	}
	if got := res.Header.Get("Cache-Control"); got != "no-store" {
		t.Errorf("Cache-Control = %q, want no-store", got)
	}
}

func TestReleasesJSON(t *testing.T) {
	res := get(t, newTestServer(t, nil), "/api/v1/releases", nil)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	if ct := res.Header.Get("Content-Type"); !strings.HasPrefix(ct, "application/json") {
		t.Errorf("Content-Type = %q", ct)
	}

	var payload releases.Release
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		t.Fatalf("decoding the payload: %v", err)
	}
	if payload.Version == "" {
		t.Error("version is empty")
	}
	want := map[releases.Platform]bool{releases.Mac: false, releases.Windows: false, releases.Linux: false}
	for _, d := range payload.Downloads {
		if _, ok := want[d.Platform]; !ok {
			t.Errorf("unexpected platform %q", d.Platform)
			continue
		}
		want[d.Platform] = true
		if !strings.HasPrefix(d.URL, "https://") {
			t.Errorf("%s: url = %q, want an https URL", d.Platform, d.URL)
		}
	}
	for platform, seen := range want {
		if !seen {
			t.Errorf("no download for %q", platform)
		}
	}
}

// The SPA renders four routes; anything else must answer 404 so crawlers do
// not index an endless supply of "pages".
func TestSPARoutesAndNotFound(t *testing.T) {
	h := newTestServer(t, nil)
	for _, path := range []string{"/", "/privacy", "/uk", "/uk/privacy"} {
		res := get(t, h, path, nil)
		if res.StatusCode != http.StatusOK {
			t.Errorf("GET %s: status = %d, want 200", path, res.StatusCode)
		}
		body, _ := io.ReadAll(res.Body)
		if !strings.Contains(string(body), `id="root"`) {
			t.Errorf("GET %s: did not serve index.html", path)
		}
		if got := res.Header.Get("Cache-Control"); got != documentCache {
			t.Errorf("GET %s: Cache-Control = %q, want %q", path, got, documentCache)
		}
	}

	for _, path := range []string{"/nope", "/uk/nope", "/privacy/extra"} {
		res := get(t, h, path, nil)
		if res.StatusCode != http.StatusNotFound {
			t.Errorf("GET %s: status = %d, want 404", path, res.StatusCode)
		}
		body, _ := io.ReadAll(res.Body)
		if !strings.Contains(string(body), `id="root"`) {
			t.Errorf("GET %s: 404 should still serve the app shell", path)
		}
	}
}

func TestStaticCacheHeaders(t *testing.T) {
	h := newTestServer(t, nil)
	cases := []struct{ path, cache string }{
		{"/assets/app.js", immutableCache},
		{"/assets/app.css", immutableCache},
		{"/favicon.svg", staticCache},
		{"/robots.txt", staticCache},
	}
	for _, c := range cases {
		res := get(t, h, c.path, nil)
		if res.StatusCode != http.StatusOK {
			t.Errorf("GET %s: status = %d, want 200", c.path, res.StatusCode)
			continue
		}
		if got := res.Header.Get("Cache-Control"); got != c.cache {
			t.Errorf("GET %s: Cache-Control = %q, want %q", c.path, got, c.cache)
		}
	}
}

func TestGzipOnlyForCompressibleTypes(t *testing.T) {
	h := newTestServer(t, nil)

	res := get(t, h, "/", map[string]string{"Accept-Encoding": "gzip"})
	if got := res.Header.Get("Content-Encoding"); got != "gzip" {
		t.Fatalf("html Content-Encoding = %q, want gzip", got)
	}
	zr, err := gzip.NewReader(res.Body)
	if err != nil {
		t.Fatalf("the body is not valid gzip: %v", err)
	}
	body, err := io.ReadAll(zr)
	if err != nil {
		t.Fatalf("reading the gzip body: %v", err)
	}
	if !strings.Contains(string(body), `id="root"`) {
		t.Error("the decompressed body is not index.html")
	}

	png := get(t, h, "/apple-touch-icon.png", map[string]string{"Accept-Encoding": "gzip"})
	if got := png.Header.Get("Content-Encoding"); got != "" {
		t.Errorf("png Content-Encoding = %q, want none", got)
	}

	plain := get(t, h, "/", nil)
	if got := plain.Header.Get("Content-Encoding"); got != "" {
		t.Errorf("Content-Encoding = %q for a client that did not ask for gzip", got)
	}
}

// The inline theme script in index.html must be covered by a hash so the policy
// never needs 'unsafe-inline'.
func TestCSPHashesTheInlineScript(t *testing.T) {
	res := get(t, newTestServer(t, nil), "/", nil)
	csp := res.Header.Get("Content-Security-Policy")
	if csp == "" {
		t.Fatal("no Content-Security-Policy header")
	}
	if strings.Contains(csp, "'unsafe-inline'") && !strings.Contains(csp, "style-src-attr 'unsafe-inline'") {
		t.Errorf("unexpected 'unsafe-inline': %s", csp)
	}
	hashes := inlineScriptHashes([]byte(indexHTML))
	if len(hashes) != 1 {
		t.Fatalf("hashed %d inline scripts, want 1", len(hashes))
	}
	if !strings.Contains(csp, hashes[0]) {
		t.Errorf("CSP %q is missing the script hash %s", csp, hashes[0])
	}
	if !strings.Contains(csp, "frame-ancestors 'none'") {
		t.Errorf("CSP is missing frame-ancestors: %s", csp)
	}
}

func TestSecurityHeaders(t *testing.T) {
	res := get(t, newTestServer(t, nil), "/", nil)
	for header, want := range map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"Referrer-Policy":        "strict-origin-when-cross-origin",
	} {
		if got := res.Header.Get(header); got != want {
			t.Errorf("%s = %q, want %q", header, got, want)
		}
	}
	if got := res.Header.Get("Strict-Transport-Security"); got != "" {
		t.Errorf("HSTS set on a plain-http request: %q", got)
	}

	https := get(t, newTestServer(t, nil), "/", map[string]string{"X-Forwarded-Proto": "https"})
	if got := https.Header.Get("Strict-Transport-Security"); got == "" {
		t.Error("HSTS missing on an https request")
	}
}

func TestCanonicalHostRedirect(t *testing.T) {
	h := newTestServer(t, func(c *config.Config) { c.CanonicalHost = "refigure.lyabah.com" })

	req := httptest.NewRequest(http.MethodGet, "http://www.refigure.lyabah.com/privacy", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusMovedPermanently {
		t.Fatalf("status = %d, want 301", rec.Code)
	}
	if got := rec.Header().Get("Location"); got != "https://refigure.lyabah.com/privacy" {
		t.Errorf("Location = %q", got)
	}

	// The healthcheck talks to the container by IP and must not be redirected.
	health := httptest.NewRequest(http.MethodGet, "http://127.0.0.1:8080/health", nil)
	hrec := httptest.NewRecorder()
	h.ServeHTTP(hrec, health)
	if hrec.Code != http.StatusOK {
		t.Errorf("health status = %d, want 200", hrec.Code)
	}
}

func TestMethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	rec := httptest.NewRecorder()
	newTestServer(t, nil).ServeHTTP(rec, req)
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want 405", rec.Code)
	}
}

func TestUnbuiltFrontendIsObvious(t *testing.T) {
	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("config.Load: %v", err)
	}
	cfg.ReleasesRepo = "" // keep the suite off the network, as above
	h := New(cfg, slog.New(slog.DiscardHandler), fstest.MapFS{}, false).Handler()

	res := get(t, h, "/", nil)
	if res.StatusCode != http.StatusServiceUnavailable {
		t.Errorf("status = %d, want 503", res.StatusCode)
	}
	// The API keeps working, which is what makes the failure diagnosable.
	if api := get(t, h, "/api/v1/releases", nil); api.StatusCode != http.StatusOK {
		t.Errorf("releases status = %d, want 200", api.StatusCode)
	}
}
