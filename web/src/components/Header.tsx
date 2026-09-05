import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { GitHubIcon, Logo } from './icons'
import { LocaleToggle } from './LocaleToggle'
import { ThemeToggle } from './ThemeToggle'
import { REPO_URL } from '../lib/links'

export function Header() {
  const { t, path } = useI18n()

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 px-6 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1040px] items-center gap-4">
        <Link
          to={path('/')}
          className="flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight text-ink"
          aria-label={t.nav.home}
        >
          <Logo className="h-6 w-6" />
          <span>Refigure</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            title={t.footer.github}
            aria-label={t.footer.github}
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-faint transition-colors hover:text-ink sm:flex"
          >
            <GitHubIcon />
          </a>
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
