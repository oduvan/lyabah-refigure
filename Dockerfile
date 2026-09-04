# ── Placeholder app ──────────────────────────────────────────────────────────
# Serves "ok" on / and "healthy" on /health so you can verify the whole deploy
# pipeline (ship → build on server → Traefik → TLS) end-to-end BEFORE writing the
# real app. REPLACE everything below with your service's actual build.
FROM nginx:alpine
RUN printf 'server {\n  listen 8080;\n  location / { return 200 "ok\\n"; }\n  location /health { return 200 "healthy\\n"; }\n}\n' \
      > /etc/nginx/conf.d/default.conf
EXPOSE 8080
