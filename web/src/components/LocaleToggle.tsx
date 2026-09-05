import { Link } from 'react-router-dom'
import { rememberLocale, useI18n } from '../i18n'

const SHORT: Record<string, string> = { en: 'EN', uk: 'УКР' }

/**
 * Links rather than buttons: each language has its own URL, so the switch is
 * shareable, indexable and works with open-in-new-tab.
 */
export function LocaleToggle() {
  const { locale, locales, basePath, pathIn, localeName, t } = useI18n()

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5"
      aria-label={t.nav.language}
    >
      {locales.map((option) => {
        const active = option === locale
        return (
          <Link
            key={option}
            to={pathIn(option, basePath)}
            hrefLang={option}
            lang={option}
            aria-current={active ? 'true' : undefined}
            aria-label={localeName(option)}
            title={localeName(option)}
            onClick={() => rememberLocale(option)}
            className={
              'flex h-7 items-center rounded-md px-2 text-xs font-semibold transition-colors ' +
              (active
                ? 'bg-accent-tint text-accent'
                : 'text-faint hover:text-ink')
            }
          >
            {SHORT[option] ?? option.toUpperCase()}
          </Link>
        )
      })}
    </div>
  )
}
