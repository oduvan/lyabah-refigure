import { useEffect } from 'react'
import { LOCALES, localizedPath, type Locale } from '../i18n'

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  for (const [key, val] of Object.entries(attrs)) el.setAttribute(key, val)
}

function upsertLink(rel: string, hreflang: string | null, href: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`
  let el = document.head.querySelector<HTMLLinkElement>(selector)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    if (hreflang) el.hreflang = hreflang
    document.head.appendChild(el)
  }
  el.href = href
}

/**
 * Keeps <title>, the description, <html lang> and the canonical/hreflang links
 * in step with the route. The app is client-rendered, so this runs on every
 * navigation rather than being baked into index.html.
 */
export function useDocumentHead(opts: {
  locale: Locale
  htmlLang: string
  title: string
  description: string
  /** Locale-independent path, e.g. "/privacy". */
  basePath: string
}) {
  const { locale, htmlLang, title, description, basePath } = opts

  useEffect(() => {
    document.title = title
    document.documentElement.lang = htmlLang
    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: description,
    })
    upsertMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: title,
    })
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    })
    upsertMeta('meta[property="og:locale"]', {
      property: 'og:locale',
      content: htmlLang,
    })

    const origin = window.location.origin
    upsertLink('canonical', null, `${origin}${localizedPath(locale, basePath)}`)
    for (const alt of LOCALES) {
      upsertLink(
        'alternate',
        alt,
        `${origin}${localizedPath(alt, basePath)}`,
      )
    }
    upsertLink('alternate', 'x-default', `${origin}${localizedPath('en', basePath)}`)
    upsertMeta('meta[property="og:url"]', {
      property: 'og:url',
      content: `${origin}${localizedPath(locale, basePath)}`,
    })
  }, [locale, htmlLang, title, description, basePath])
}
