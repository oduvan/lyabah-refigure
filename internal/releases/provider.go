package releases

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Provider serves the current release, refreshing it from GitHub no more often
// than TTL and never failing a request: if GitHub is slow, rate-limiting or
// down, the last good answer is served, and the configured fallback before
// there has ever been one.
type Provider struct {
	repo      string // "owner/name"
	ttl       time.Duration
	token     string
	fallback  Release
	overrides []Override
	version   string
	client    *http.Client
	log       *slog.Logger

	mu sync.Mutex
	// hasCached tracks whether `cached` holds a good answer, which is not the
	// same question as whether a fetch has been attempted: a refresh that
	// fails must keep serving the last good release, not drop to the fallback.
	hasCached bool
	cached    Release
	fetchedAt time.Time
	lastErr   error
}

// Options configure a Provider. Repo is required; everything else has a
// sensible default.
type Options struct {
	Repo string
	TTL  time.Duration
	// Token is optional and only lifts GitHub's anonymous rate limit.
	Token string
	// Fallback is shown before GitHub has answered, and whenever it cannot.
	Fallback Release
	// Overrides beat whatever the release says. Applied on every read, so a
	// store listing survives a release that also ships an installer.
	Overrides []Override
	// Version, when set, replaces the version the release tag implies.
	Version string
	Client  *http.Client
	Logger  *slog.Logger
}

const (
	defaultTTL     = 15 * time.Minute
	defaultTimeout = 6 * time.Second
	apiBase        = "https://api.github.com"
)

func New(opts Options) *Provider {
	p := &Provider{
		repo:      strings.Trim(opts.Repo, "/"),
		ttl:       opts.TTL,
		token:     opts.Token,
		fallback:  opts.Fallback,
		overrides: opts.Overrides,
		version:   opts.Version,
		client:    opts.Client,
		log:       opts.Logger,
	}
	if p.ttl <= 0 {
		p.ttl = defaultTTL
	}
	if p.client == nil {
		p.client = &http.Client{Timeout: defaultTimeout}
	}
	if p.log == nil {
		p.log = slog.New(slog.DiscardHandler)
	}
	return p
}

// Current returns the release to advertise. It refreshes at most once per TTL
// and holds the lock across the fetch so a burst of traffic produces one
// request to GitHub rather than one per visitor.
func (p *Provider) Current(ctx context.Context) Release {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.hasCached && time.Since(p.fetchedAt) < p.ttl {
		return applyOverrides(p.cached, p.version, p.overrides)
	}

	fetched, err := p.fetch(ctx)
	if err != nil {
		p.lastErr = err
		// Only log a change of state; a persistent outage should not fill the
		// log with one line per TTL.
		p.log.Warn("could not refresh the release from GitHub", "repo", p.repo, "error", err)
		if !p.hasCached {
			return applyOverrides(p.fallback, p.version, p.overrides)
		}
		// Back off for a full TTL rather than hammering a failing API.
		p.fetchedAt = time.Now()
		return applyOverrides(p.cached, p.version, p.overrides)
	}

	p.lastErr = nil
	p.cached = merge(fetched, p.fallback)
	p.hasCached = true
	p.fetchedAt = time.Now()
	return applyOverrides(p.cached, p.version, p.overrides)
}

func (p *Provider) fetch(ctx context.Context) (Release, error) {
	if p.repo == "" {
		return Release{}, fmt.Errorf("no repository configured")
	}
	url := fmt.Sprintf("%s/repos/%s/releases/latest", apiBase, p.repo)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return Release{}, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "refigure.lyabah.com")
	if p.token != "" {
		// Optional: lifts the 60/hour unauthenticated rate limit. The site
		// works without it.
		req.Header.Set("Authorization", "Bearer "+p.token)
	}

	res, err := p.client.Do(req)
	if err != nil {
		return Release{}, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return Release{}, fmt.Errorf("GitHub returned %s", res.Status)
	}

	var gh ghRelease
	if err := json.NewDecoder(res.Body).Decode(&gh); err != nil {
		return Release{}, fmt.Errorf("decoding the release: %w", err)
	}
	if gh.Draft {
		return Release{}, fmt.Errorf("the latest release is a draft")
	}

	out := fromGitHub(gh)
	if out.Version == "" || len(out.Downloads) == 0 {
		return Release{}, fmt.Errorf("the latest release has no downloadable assets")
	}
	return out, nil
}
