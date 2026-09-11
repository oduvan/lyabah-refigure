// Package server wires the HTTP surface of refigure.lyabah.com: the embedded
// single-page app, a small JSON API for the download buttons, and the health
// endpoint the container healthcheck polls.
package server

import (
	"context"
	"encoding/json"
	"errors"
	"io/fs"
	"log/slog"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/oduvan/lyabah-refigure/internal/config"
	"github.com/oduvan/lyabah-refigure/internal/releases"
)

const (
	healthPath   = "/health"
	releasesPath = "/api/v1/releases"
)

// Server owns the HTTP handler and its lifecycle.
type Server struct {
	cfg     config.Config
	log     *slog.Logger
	handler http.Handler
}

// New builds a server. assets is the built frontend; pass built=false when the
// binary was compiled without running the web build.
func New(cfg config.Config, log *slog.Logger, assets fs.FS, built bool) *Server {
	mux := http.NewServeMux()
	mux.HandleFunc("GET "+healthPath, handleHealth)
	mux.HandleFunc("GET "+releasesPath, handleReleases(releaseProvider(cfg, log)))

	csp := contentSecurityPolicy(nil)
	if built {
		static, err := newStaticHandler(assets)
		if err != nil {
			log.Error("reading the embedded site failed", "error", err)
			mux.HandleFunc("/", unbuiltHandler)
		} else {
			csp = contentSecurityPolicy(static.index)
			mux.Handle("/", static)
		}
	} else {
		log.Warn("serving without a frontend build; run `npm --prefix web run build`")
		mux.HandleFunc("/", unbuiltHandler)
	}

	var handler http.Handler = mux
	handler = withGzip(handler)
	handler = withSecurityHeaders(csp)(handler)
	if cfg.CanonicalHost != "" {
		handler = withCanonicalHost(cfg.CanonicalHost, handler)
	}
	handler = withLogging(log, handler)

	return &Server{cfg: cfg, log: log, handler: handler}
}

// Handler exposes the composed handler, which is what the tests exercise.
func (s *Server) Handler() http.Handler { return s.handler }

// Run listens until ctx is cancelled, then drains in-flight requests.
func (s *Server) Run(ctx context.Context) error {
	srv := &http.Server{
		Addr:              s.cfg.Addr,
		Handler:           s.handler,
		ReadHeaderTimeout: s.cfg.ReadHeaderTimeout,
		WriteTimeout:      s.cfg.WriteTimeout,
		IdleTimeout:       s.cfg.IdleTimeout,
		ErrorLog:          slog.NewLogLogger(s.log.Handler(), slog.LevelWarn),
	}

	ln, err := net.Listen("tcp", s.cfg.Addr)
	if err != nil {
		return err
	}
	s.log.Info("listening", "addr", ln.Addr().String())

	errc := make(chan error, 1)
	go func() {
		if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errc <- err
			return
		}
		errc <- nil
	}()

	select {
	case err := <-errc:
		return err
	case <-ctx.Done():
		s.log.Info("shutting down")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), s.cfg.ShutdownTimeout)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			return err
		}
		return <-errc
	}
}

func handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("healthy\n"))
}

func releaseProvider(cfg config.Config, log *slog.Logger) *releases.Provider {
	return releases.New(releases.Options{
		Repo:      cfg.ReleasesRepo,
		TTL:       cfg.ReleasesTTL,
		Token:     cfg.GitHubToken,
		Fallback:  cfg.ReleaseFallback,
		Overrides: cfg.ReleaseOverrides,
		Version:   cfg.ReleaseVersion,
		Logger:    log,
	})
}

func handleReleases(provider *releases.Provider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Current never fails: a slow or broken GitHub yields the last good
		// answer, or the configured fallback, rather than an error page where
		// the download buttons should be.
		body, err := json.Marshal(provider.Current(r.Context()))
		if err != nil {
			// A plain struct of strings; unreachable in practice.
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		// Short enough that a new release is picked up promptly, long enough
		// that the landing page does not hit the origin on every view.
		w.Header().Set("Cache-Control", "public, max-age=300")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(body)
	}
}

// withCanonicalHost keeps one origin authoritative, so www and the apex do not
// both get indexed. Only enabled when REFIGURE_CANONICAL_HOST is set.
func withCanonicalHost(host string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requested := r.Host
		if h, _, err := net.SplitHostPort(requested); err == nil {
			requested = h
		}
		if requested == "" || strings.EqualFold(requested, host) || r.URL.Path == healthPath {
			next.ServeHTTP(w, r)
			return
		}
		target := *r.URL
		target.Scheme = "https"
		target.Host = host
		http.Redirect(w, r, target.String(), http.StatusMovedPermanently)
	})
}

// NewLogger builds the process logger at the configured level.
func NewLogger(level string) *slog.Logger {
	var lvl slog.Level
	if err := lvl.UnmarshalText([]byte(level)); err != nil {
		lvl = slog.LevelInfo
	}
	return slog.New(slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: lvl}))
}
