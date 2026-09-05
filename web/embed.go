// Package web exposes the built single-page application to the Go server.
//
// The files come from `npm run build` (Vite writes them to web/dist) and are
// compiled into the binary, so the deployed image is a single artefact with no
// runtime dependency on the source tree.
package web

import (
	"embed"
	"io/fs"
)

// `all:` so the pattern still matches on a fresh clone, where dist/ holds only
// the tracked .gitkeep placeholder.
//
//go:embed all:dist
var embedded embed.FS

// Assets returns the built site rooted at dist/. Built returns false when the
// binary was compiled without running the frontend build, which lets the server
// say so plainly instead of serving a wall of 404s.
func Assets() (fs.FS, bool) {
	dist, err := fs.Sub(embedded, "dist")
	if err != nil {
		return nil, false
	}
	if _, err := fs.Stat(dist, "index.html"); err != nil {
		return dist, false
	}
	return dist, true
}
