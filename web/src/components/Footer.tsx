import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { REPO_URL } from '../lib/links'

export function Footer() {
  const { t, path } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-line px-6 py-7">
      <div className="mx-auto flex max-w-[1040px] flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-faint">
        <span className="text-ink">Refigure</span>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="transition-colors hover:text-ink"
        >
          {t.footer.github}
        </a>
        <Link to={path('/privacy')} className="transition-colors hover:text-ink">
          {t.footer.privacy}
        </Link>
        <span className="ml-auto tabular-nums">© {year}</span>
      </div>
    </footer>
  )
}
