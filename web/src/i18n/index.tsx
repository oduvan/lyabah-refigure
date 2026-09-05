import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { en, type Dictionary } from './en'
import { uk } from './uk'

export type Locale = 'en' | 'uk'

export const LOCALES: Locale[] = ['en', 'uk']
export const DEFAULT_LOCALE: Locale = 'en'
/** Non-default locales live under a path prefix: /uk, /uk/privacy, … */
export const LOCALE_PREFIX: Record<Locale, string> = { en: '', uk: '/uk' }
export const LOCALE_STORAGE_KEY = 'refigure:locale'

const DICTIONARIES: Record<Locale, Dictionary> = { en, uk }

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as string[]).includes(value)
}

/** Splits a pathname into its locale and the locale-independent remainder. */
export function splitLocale(pathname: string): {
  locale: Locale
  rest: string
} {
  for (const locale of LOCALES) {
    const prefix = LOCALE_PREFIX[locale]
    if (!prefix) continue
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return { locale, rest: pathname.slice(prefix.length) || '/' }
    }
  }
  return { locale: DEFAULT_LOCALE, rest: pathname || '/' }
}

/** Builds the URL for `path` (always written without a prefix) in `locale`. */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  const prefixed = `${LOCALE_PREFIX[locale]}${clean}`
  // "/uk/" reads worse than "/uk" and would not match the route.
  return prefixed.length > 1 && prefixed.endsWith('/')
    ? prefixed.slice(0, -1)
    : prefixed
}

export function storedLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(stored) ? stored : null
  } catch {
    return null
  }
}

export function rememberLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Storage may be unavailable; the URL still carries the choice.
  }
}

/** The best locale for a visitor who has not chosen one yet. */
export function preferredLocale(): Locale {
  const remembered = storedLocale()
  if (remembered) return remembered
  const languages = typeof navigator === 'undefined' ? [] : navigator.languages ?? []
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

type I18nContextValue = {
  locale: Locale
  t: Dictionary
  /** Current path with the locale prefix stripped, e.g. "/privacy". */
  basePath: string
  /** Path for `path` in the active locale. */
  path: (path: string) => string
  /** Path for `path` in another locale. */
  pathIn: (locale: Locale, path: string) => string
  locales: Locale[]
  localeName: (locale: Locale) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  const value = useMemo<I18nContextValue>(() => {
    const { locale, rest } = splitLocale(pathname)
    return {
      locale,
      t: DICTIONARIES[locale],
      basePath: rest,
      path: (p: string) => localizedPath(locale, p),
      pathIn: (target: Locale, p: string) => localizedPath(target, p),
      locales: LOCALES,
      localeName: (target: Locale) => DICTIONARIES[target].meta.name,
    }
  }, [pathname])

  return <I18nContext value={value}>{children}</I18nContext>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

export { en, uk }
export type { Dictionary }
