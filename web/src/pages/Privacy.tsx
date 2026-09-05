import { Link } from 'react-router-dom'
import { Rich } from '../components/Rich'
import { useI18n } from '../i18n'
import { useDocumentHead } from '../lib/head'

function formatDate(iso: string, locale: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export default function Privacy() {
  const { t, locale, basePath, path } = useI18n()
  useDocumentHead({
    locale,
    htmlLang: t.meta.htmlLang,
    title: t.meta.privacy.title,
    description: t.meta.privacy.description,
    basePath,
  })

  const p = t.privacy

  return (
    <div className="px-6">
      <div className="mx-auto max-w-[1040px]">
        {/* Narrower than the container so the prose keeps a readable measure,
            while the left edge still lines up with the header and footer. */}
        <article className="max-w-[720px] py-14 sm:py-20">
          <h1 className="text-[30px] font-bold tracking-[-0.02em] text-ink text-balance sm:text-[38px]">
            {p.title}
          </h1>
          <p className="mt-3 text-[13px] text-faint">
            {p.updated}:{' '}
            <time dateTime={p.updatedIso}>{formatDate(p.updatedIso, t.meta.locale)}</time>
          </p>

          <p className="mt-8 text-[17px] leading-[1.7] text-body text-pretty">{p.intro}</p>

          {p.sections.map((section) => (
            <section key={section.heading} className="mt-10">
              <h2 className="text-[21px] font-semibold tracking-[-0.01em] text-ink">
                {section.heading}
              </h2>

              {section.paragraphs.map((para) => (
                <p key={para} className="mt-4 text-base leading-[1.7] text-body text-pretty">
                  <Rich text={para} />
                </p>
              ))}

              {section.list.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2">
                  {section.list.map((item) => (
                    <li
                      key={item}
                      className="relative pl-5 text-base leading-[1.7] text-body text-pretty before:absolute before:top-[0.7em] before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent-soft"
                    >
                      <Rich text={item} />
                    </li>
                  ))}
                </ul>
              )}

              {section.after.map((para) => (
                <p key={para} className="mt-4 text-base leading-[1.7] text-body text-pretty">
                  <Rich text={para} />
                </p>
              ))}
            </section>
          ))}

          <Link
            to={path('/')}
            className="mt-12 inline-block text-sm text-accent transition-colors hover:underline"
          >
            {p.backHome}
          </Link>
        </article>
      </div>
    </div>
  )
}
