package server

import (
	"crypto/subtle"
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

// minKeyLength is the shortest LYABAH_KEY the server accepts. A shorter one is
// treated as not set, so a typo or a half-copied secret never opens the API.
const minKeyLength = 12

// requireKey lets a request through only when it carries
// Authorization: Bearer <LYABAH_KEY>.
//
// When the key is not configured, the endpoint answers 503 instead of being
// open: a missing secret must never leave the API unprotected.
func requireKey(key string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if len(key) < minKeyLength {
			writeAuthError(w, http.StatusServiceUnavailable, "LYABAH_KEY is not set")
			return
		}
		got, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		if !ok || subtle.ConstantTimeCompare([]byte(got), []byte(key)) != 1 {
			w.Header().Set("WWW-Authenticate", "Bearer")
			writeAuthError(w, http.StatusUnauthorized, "send Authorization: Bearer <LYABAH_KEY>")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeAuthError(w http.ResponseWriter, status int, message string) {
	body, _ := json.Marshal(map[string]string{"error": message})
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_, _ = w.Write(body)
}

// handlePing answers {"ok": true, "service": "<name>"}. lyabah-service calls
// it to confirm that the key it sends is the one this service expects.
func handlePing(service string) http.HandlerFunc {
	body, _ := json.Marshal(struct {
		OK      bool   `json:"ok"`
		Service string `json:"service"`
	}{true, service})
	return func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, string(body))
	}
}
