import { Link } from 'react-router-dom'
import { Rich } from './Rich'
import { useI18n } from '../i18n'
import { useDocumentHead } from '../lib/head'

/**
 * The shape of a legal page in the dictionaries. Both the privacy policy and
 * the license agreement are the same thing structurally — a dated document of
 * headed sections — so they share one renderer and differ only in their copy.
 */
export type LegalDoc = {
  title: string
  updated: string
  updatedIso: string
  /** Shown next to the date. The license agreement is versioned because the
      app compares the accepted version against its own; the privacy policy is
      not, and omits this. */
  version?: string
  intro: string
  sections: {
    heading: string
    paragraphs: string[]
    list: string[]
    after: string[]
  }[]
  backHome: string
}

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

export function LegalDocument({
  doc,
  meta,
  basePath,
}: {
  doc: LegalDoc
  meta: { title: string; description: string }
  basePath: string
}) {
  const { t, locale, path } = useI18n()
  useDocumentHead({
    locale,
    htmlLang: t.meta.htmlLang,
    title: meta.title,
    description: meta.description,
    basePath,
  })

  return (
    <div className="px-6">
      <div className="mx-auto max-w-[1040px]">
        {/* Narrower than the container so the prose keeps a readable measure,
            while the left edge still lines up with the header and footer. */}
        <article className="max-w-[720px] py-14 sm:py-20">
          <h1 className="text-[30px] font-bold tracking-[-0.02em] text-ink text-balance sm:text-[38px]">
            {doc.title}
          </h1>
          <p className="mt-3 text-[13px] text-faint">
            {doc.version ? <>{doc.version} · </> : null}
            {doc.updated}:{' '}
            <time dateTime={doc.updatedIso}>{formatDate(doc.updatedIso, t.meta.locale)}</time>
          </p>

          <p className="mt-8 text-[17px] leading-[1.7] text-body text-pretty">{doc.intro}</p>

          {doc.sections.map((section) => (
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
            {doc.backHome}
          </Link>
        </article>
      </div>
    </div>
  )
}
