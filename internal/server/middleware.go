package server

import (
	"compress/gzip"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"
)

// recorder captures the status code so the access log can report it, and lets
// the gzip middleware decide on compression once the content type is known.
type recorder struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (r *recorder) WriteHeader(status int) {
	if r.status == 0 {
		r.status = status
		r.ResponseWriter.WriteHeader(status)
	}
}

func (r *recorder) Write(b []byte) (int, error) {
	if r.status == 0 {
		r.WriteHeader(http.StatusOK)
	}
	n, err := r.ResponseWriter.Write(b)
	r.bytes += n
	return n, err
}

func withLogging(log *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &recorder{ResponseWriter: w}
		next.ServeHTTP(rec, r)
		if rec.status == 0 {
			rec.status = http.StatusOK
		}
		level := slog.LevelInfo
		if rec.status >= 500 {
			level = slog.LevelError
		}
		// /health is polled every ten seconds by the container healthcheck;
		// logging it would drown everything else.
		if r.URL.Path == healthPath && rec.status < 400 {
			level = slog.LevelDebug
		}
		log.LogAttrs(r.Context(), level, "request",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", rec.status),
			slog.Int("bytes", rec.bytes),
			slog.Duration("took", time.Since(start).Round(time.Microsecond)),
		)
	})
}

func withSecurityHeaders(csp string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			h.Set("Content-Security-Policy", csp)
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			h.Set("X-Frame-Options", "DENY")
			h.Set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), interest-cohort=()")
			h.Set("Cross-Origin-Opener-Policy", "same-origin")
			// Traefik terminates TLS in front of us; only claim HSTS when the
			// request actually arrived over https.
			if r.Header.Get("X-Forwarded-Proto") == "https" || r.TLS != nil {
				h.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
			}
			next.ServeHTTP(w, r)
		})
	}
}

// compressible reports whether a body of this content type is worth gzipping.
// Fonts, images and archives are already compressed.
func compressible(contentType string) bool {
	ct := contentType
	if i := strings.IndexByte(ct, ';'); i >= 0 {
		ct = ct[:i]
	}
	ct = strings.ToLower(strings.TrimSpace(ct))
	if strings.HasPrefix(ct, "text/") {
		return true
	}
	switch ct {
	case "application/javascript", "text/javascript", "application/json",
		"application/manifest+json", "application/xml", "application/xhtml+xml",
		"image/svg+xml", "application/wasm":
		return true
	}
	return false
}

var gzipPool = sync.Pool{
	New: func() any {
		w, _ := gzip.NewWriterLevel(io.Discard, gzip.BestSpeed)
		return w
	},
}

// gzipWriter defers the decision to compress until the handler has set a
// content type, so it never wastes cycles on woff2 or png.
type gzipWriter struct {
	http.ResponseWriter
	gz      *gzip.Writer
	decided bool
}

func (g *gzipWriter) WriteHeader(status int) {
	if !g.decided {
		g.decided = true
		h := g.ResponseWriter.Header()
		// 204/304 have no body, and an existing Content-Encoding means the
		// handler is doing its own thing.
		if status != http.StatusNoContent && status != http.StatusNotModified &&
			h.Get("Content-Encoding") == "" && compressible(h.Get("Content-Type")) {
			h.Del("Content-Length")
			h.Set("Content-Encoding", "gzip")
			g.gz = gzipPool.Get().(*gzip.Writer)
			g.gz.Reset(g.ResponseWriter)
		}
	}
	g.ResponseWriter.WriteHeader(status)
}

func (g *gzipWriter) Write(b []byte) (int, error) {
	if !g.decided {
		g.WriteHeader(http.StatusOK)
	}
	if g.gz != nil {
		return g.gz.Write(b)
	}
	return g.ResponseWriter.Write(b)
}

func (g *gzipWriter) close() {
	if g.gz != nil {
		_ = g.gz.Close()
		gzipPool.Put(g.gz)
		g.gz = nil
	}
}

func withGzip(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}
		// Vary matters even when we end up not compressing: caches must not
		// hand a gzipped body to a client that did not ask for one.
		w.Header().Add("Vary", "Accept-Encoding")
		gw := &gzipWriter{ResponseWriter: w}
		defer gw.close()
		next.ServeHTTP(gw, r)
	})
}
