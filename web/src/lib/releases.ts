import { useEffect, useState } from 'react'

export type Platform = 'mac' | 'windows' | 'linux'

export type Download = {
  platform: Platform
  url: string
  /** Human-readable size, e.g. "94 MB". Empty for store listings. */
  size: string
}

export type Release = {
  version: string
  downloads: Download[]
}

/**
 * Rendered immediately so the hero button never flashes empty; the Go server
 * serves the authoritative copy from /api/v1/releases and it replaces this.
 */
// Asset names carry their version, so this cannot be written as a link to
// "latest" — it has to name a release, and therefore has to be moved when one
// ships. It is what a visitor is offered whenever the API cannot be reached, so
// leaving it behind quietly hands out an old build: it sat at 1.0.0 while 1.2.1
// was current, which is four releases and two features.
export const FALLBACK_RELEASE: Release = {
  version: '1.2.1',
  downloads: [
    {
      platform: 'mac',
      url: 'https://github.com/oduvan/lyabah-refigure/releases/download/v1.2.1/Refigure-1.2.1-universal.dmg',
      size: '180 MB',
    },
    {
      platform: 'windows',
      url: 'https://github.com/oduvan/lyabah-refigure/releases/download/v1.2.1/Refigure-Setup-1.2.1.exe',
      size: '84 MB',
    },
    {
      platform: 'linux',
      url: 'https://github.com/oduvan/lyabah-refigure/releases/download/v1.2.1/Refigure-1.2.1.AppImage',
      size: '111 MB',
    },
  ],
}

/**
 * The Windows button says "Get it from the Microsoft Store" only when it
 * actually points there. The release publishes a direct installer, but the
 * server still lets a store listing be configured, so the label follows the
 * link rather than being assumed.
 */
export function isStoreLink(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('microsoft.com')
  } catch {
    return false
  }
}

const PLATFORMS: Platform[] = ['mac', 'windows', 'linux']

function isRelease(value: unknown): value is Release {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Partial<Release>
  if (typeof r.version !== 'string' || !Array.isArray(r.downloads)) return false
  return r.downloads.every(
    (d) =>
      typeof d === 'object' &&
      d !== null &&
      PLATFORMS.includes((d as Download).platform) &&
      typeof (d as Download).url === 'string' &&
      typeof (d as Download).size === 'string',
  )
}

export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'mac'
  const ua = navigator.userAgent || ''
  if (/Windows|Win32|Win64/i.test(ua)) return 'windows'
  if (/Mac|iPhone|iPad|iPod/i.test(ua)) return 'mac'
  if (/Linux|X11|Android|CrOS/i.test(ua)) return 'linux'
  return 'mac'
}

export function downloadFor(release: Release, platform: Platform): Download {
  return (
    release.downloads.find((d) => d.platform === platform) ??
    FALLBACK_RELEASE.downloads[0]
  )
}

/** Release metadata from the API, with the built-in copy until it arrives. */
export function useRelease(): Release {
  const [release, setRelease] = useState<Release>(FALLBACK_RELEASE)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/v1/releases', {
      signal: ctrl.signal,
      headers: { accept: 'application/json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (isRelease(data)) setRelease(data)
      })
      .catch(() => {
        // Offline or the endpoint is unavailable — the fallback still works.
      })
    return () => ctrl.abort()
  }, [])

  return release
}

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('mac')
  useEffect(() => setPlatform(detectPlatform()), [])
  return platform
}
