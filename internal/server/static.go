package server

import (
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"
	"io/fs"
	"net/http"
	"path"
	"regexp"
	"strings"
)

// spaRoutes are the paths the single-page app renders. Anything else that is
// not a file on disk is a genuine 404: the client still draws its "page not
// found" screen, but the status code tells crawlers the truth.
var spaRoutes = map[string]bool{
	"/":           true,
	"/privacy":    true,
	"/uk":         true,
	"/uk/privacy": true,
}

const (
	// Vite fingerprints everything under /assets/, so those may be cached for
	// as long as the browser likes.
	immutableCache = "public, max-age=31536000, immutable"
	// Icons, robots.txt and the manifest keep their names across deploys.
	staticCache = "public, max-age=3600"
	// index.html names the current asset bundle and must never be stale.
	documentCache = "no-cache"
)

type staticHandler struct {
	assets fs.FS
	files  http.Handler
	index  []byte
}

func newStaticHandler(assets fs.FS) (*staticHandler, error) {
	index, err := fs.ReadFile(assets, "index.html")
	if err != nil {
		return nil, err
	}
	return &staticHandler{
		assets: assets,
		files:  http.FileServerFS(assets),
		index:  index,
	}, nil
}

func (h *staticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	upath := path.Clean("/" + r.URL.Path)

	// A real file wins: /assets/index-abc123.js, /favicon.svg, /robots.txt …
	if name := strings.TrimPrefix(upath, "/"); name != "" && name != "index.html" {
		if info, err := fs.Stat(h.assets, name); err == nil && !info.IsDir() {
			if strings.HasPrefix(upath, "/assets/") {
				w.Header().Set("Cache-Control", immutableCache)
			} else {
				w.Header().Set("Cache-Control", staticCache)
			}
			h.files.ServeHTTP(w, r)
			return
		} else if err != nil && !errors.Is(err, fs.ErrNotExist) {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
	}

	status := http.StatusOK
	if !spaRoutes[upath] {
		status = http.StatusNotFound
	}
	h.serveIndex(w, r, status)
}

func (h *staticHandler) serveIndex(w http.ResponseWriter, r *http.Request, status int) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", documentCache)
	w.WriteHeader(status)
	if r.Method == http.MethodHead {
		return
	}
	_, _ = w.Write(h.index)
}

var inlineScript = regexp.MustCompile(`(?s)<script(?:\s[^>]*)?>(.*?)</script>`)

// inlineScriptHashes returns CSP source expressions for every inline <script>
// in index.html. Hashing what is actually shipped means the policy can stay at
// script-src 'self' — no 'unsafe-inline', and nothing to keep in sync by hand.
func inlineScriptHashes(index []byte) []string {
	var out []string
	for _, m := range inlineScript.FindAllSubmatch(index, -1) {
		body := m[1]
		if len(strings.TrimSpace(string(body))) == 0 {
			continue // <script src="…"></script>
		}
		sum := sha256.Sum256(body)
		out = append(out, "'sha256-"+base64.StdEncoding.EncodeToString(sum[:])+"'")
	}
	return out
}

func contentSecurityPolicy(index []byte) string {
	script := append([]string{"'self'"}, inlineScriptHashes(index)...)
	directives := []string{
		"default-src 'self'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"object-src 'none'",
		"img-src 'self' data:",
		"font-src 'self'",
		"style-src 'self'",
		// React writes inline style attributes for the annotation overlays;
		// this covers attributes only, not <style> elements.
		"style-src-attr 'unsafe-inline'",
		"script-src " + strings.Join(script, " "),
		"connect-src 'self'",
		"manifest-src 'self'",
	}
	return strings.Join(directives, "; ")
}

// unbuiltHandler stands in when the binary was compiled without the frontend
// build, so the failure is obvious rather than a pile of 404s.
func unbuiltHandler(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusServiceUnavailable)
	_, _ = io.WriteString(w, "the web build is missing: run `npm --prefix web ci && npm --prefix web run build`\n")
}
