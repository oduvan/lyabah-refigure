import { useI18n } from '../i18n'
import { useTheme, type Theme } from '../lib/theme'
import { MonitorIcon, MoonIcon, SunIcon } from './icons'

const ICONS: Record<Theme, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
}

export function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme()
  const { t } = useI18n()

  const labels: Record<Theme, string> = {
    light: t.nav.themeLight,
    dark: t.nav.themeDark,
    system: t.nav.themeSystem,
  }

  return (
    <div
      role="radiogroup"
      aria-label={t.nav.theme}
      className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5"
    >
      {themes.map((option) => {
        const Icon = ICONS[option]
        const active = theme === option
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={labels[option]}
            title={labels[option]}
            onClick={() => setTheme(option)}
            className={
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors ' +
              (active
                ? 'bg-accent-tint text-accent'
                : 'text-faint hover:text-ink')
            }
          >
            <Icon />
          </button>
        )
      })}
    </div>
  )
}
