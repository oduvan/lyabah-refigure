# ── 1. Build the single-page app ─────────────────────────────────────────────
FROM node:22-alpine AS web
WORKDIR /src/web
# Copy the manifests first so `npm ci` is cached until a dependency changes.
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ── 2. Build the Go server, with the site embedded ───────────────────────────
FROM golang:1.24-alpine AS server
WORKDIR /src
COPY go.mod ./
# No third-party modules yet; the COPY stays valid once go.sum appears.
COPY go.su[m] ./
RUN go mod download
COPY cmd/ ./cmd/
COPY internal/ ./internal/
COPY web/embed.go ./web/
COPY --from=web /src/web/dist ./web/dist
# Static binary: the runtime image has no libc.
ENV CGO_ENABLED=0
RUN go build -trimpath -ldflags="-s -w" -o /out/refigure ./cmd/server

# ── 3. Runtime ───────────────────────────────────────────────────────────────
# wget is what the compose healthcheck calls, so busybox rather than scratch.
FROM alpine:3.21
RUN adduser -D -H -u 10001 refigure
COPY --from=server /out/refigure /usr/local/bin/refigure
USER refigure
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
ENTRYPOINT ["/usr/local/bin/refigure"]
