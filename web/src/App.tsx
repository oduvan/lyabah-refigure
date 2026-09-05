import { useEffect, useRef } from 'react'
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import {
  DEFAULT_LOCALE,
  I18nProvider,
  localizedPath,
  preferredLocale,
  storedLocale,
  useI18n,
} from './i18n'
import { ThemeProvider } from './lib/theme'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import Privacy from './pages/Privacy'

/**
 * First visit only: a URL with no language prefix means the visitor has not
 * said which language they want, so follow the browser's preference. A
 * prefixed URL (/uk/...) is an explicit request and is never redirected, and
 * neither is a visitor who has chosen a language before.
 */
function LocaleRedirect() {
  const { locale, basePath } = useI18n()
  const navigate = useNavigate()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    if (locale !== DEFAULT_LOCALE) return
    if (storedLocale()) return
    const preferred = preferredLocale()
    if (preferred !== locale) {
      navigate(localizedPath(preferred, basePath), { replace: true })
    }
  }, [locale, basePath, navigate])

  return null
}

/** New pages start at the top; in-page anchors are left alone. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function Shell() {
  const { t } = useI18n()
  return (
    <>
      <LocaleRedirect />
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-on-accent"
      >
        {t.nav.skipToContent}
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/uk" element={<Landing />} />
          <Route path="/uk/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <I18nProvider>
          <Shell />
        </I18nProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
