import { writeFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * `//go:embed all:dist` in web/embed.go needs dist/ to hold at least one file,
 * including on a fresh clone where nothing has been built yet — hence the
 * tracked dist/.gitkeep. `emptyOutDir` deletes it on every build, so put it
 * back afterwards and `go build ./...` keeps working without a frontend build.
 */
function keepDistPlaceholder(): Plugin {
  return {
    name: 'refigure:keep-dist-placeholder',
    closeBundle() {
      writeFileSync(new URL('dist/.gitkeep', import.meta.url), '')
    },
  }
}

// The Go server embeds `dist/` and serves it, so the dev server proxies the API
// to a locally running `go run ./cmd/server` instead of mocking it.
export default defineConfig({
  plugins: [react(), tailwindcss(), keepDistPlaceholder()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Long-lived hashed assets; the Go server sets immutable cache headers on them.
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8080',
    },
  },
})
