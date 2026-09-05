import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark' | 'system'

/** Kept in sync with the inline boot script in index.html. */
export const THEME_STORAGE_KEY = 'refigure:theme'

const THEMES: Theme[] = ['light', 'dark', 'system']

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as string[]).includes(value)
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(stored)) return stored
  } catch {
    // Private mode, or storage disabled — fall through to the system theme.
  }
  return 'system'
}

function prefersDark(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-color-scheme: dark)').matches
  )
}

function apply(theme: Theme): 'light' | 'dark' {
  const resolved = theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.dataset.theme = theme
  // Pinning color-scheme also pins what prefers-color-scheme reports, so
  // `system` must leave both open or it would stop following the OS.
  root.style.colorScheme = theme === 'system' ? 'light dark' : resolved
  return resolved
}

type ThemeContextValue = {
  theme: Theme
  /** What `theme` currently evaluates to — `system` follows the OS. */
  resolved: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  themes: Theme[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme,
  )

  useEffect(() => {
    setResolved(apply(theme))
  }, [theme])

  // Only `system` tracks the OS; an explicit choice must survive an OS change.
  useEffect(() => {
    if (theme !== 'system' || typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolved(apply('system'))
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Not being able to remember the choice is not a reason to ignore it.
    }
  }, [])

  const value = useMemo(
    () => ({ theme, resolved, setTheme, themes: THEMES }),
    [theme, resolved, setTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
