import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useDocumentHead } from '../lib/head'

export default function NotFound() {
  const { t, locale, path } = useI18n()
  useDocumentHead({
    locale,
    htmlLang: t.meta.htmlLang,
    title: t.meta.notFound.title,
    description: t.meta.notFound.description,
    // A 404 has no meaningful translated counterpart; point both at the home page.
    basePath: '/',
  })

  return (
    <div className="px-6">
      <div className="mx-auto flex max-w-[1040px] flex-col items-start py-24 sm:py-32">
        <p className="font-mono text-sm text-faint">404</p>
        <h1 className="mt-3 text-[30px] font-bold tracking-[-0.02em] text-ink sm:text-[38px]">
          {t.notFound.title}
        </h1>
        <p className="mt-4 text-base leading-[1.7] text-body">{t.notFound.body}</p>
        <Link
          to={path('/')}
          className="mt-8 text-sm text-accent transition-colors hover:underline"
        >
          {t.notFound.backHome}
        </Link>
      </div>
    </div>
  )
}
