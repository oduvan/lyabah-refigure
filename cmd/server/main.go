// Command server runs refigure.lyabah.com: the Go binary that serves the
// embedded React site and its small JSON API.
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/oduvan/lyabah-refigure/internal/config"
	"github.com/oduvan/lyabah-refigure/internal/server"
	"github.com/oduvan/lyabah-refigure/web"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("refigure: %v", err)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	logger := server.NewLogger(cfg.LogLevel)
	assets, built := web.Assets()
	if cfg.StaticDir != "" {
		// Local development: serve `npm run dev`'s output, or a build under
		// web/dist, without recompiling the binary on every frontend change.
		assets = os.DirFS(cfg.StaticDir)
		built = true
		logger.Info("serving the site from disk", "dir", cfg.StaticDir)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	return server.New(cfg, logger, assets, built).Run(ctx)
}
