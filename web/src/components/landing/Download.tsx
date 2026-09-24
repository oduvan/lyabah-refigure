import { useI18n } from '../../i18n'
import { downloadFor, isStoreLink, type Platform, useRelease } from '../../lib/releases'
import { STORE_URL } from '../../lib/links'
import { Section } from './primitives'

export function Download() {
  const { t } = useI18n()
  const release = useRelease()

  const windowsURL = downloadFor(release, 'windows').url
  // Windows gets both: the installer from the release, and the Store listing.
  // They are genuinely different products to a visitor — the Store copy updates
  // itself and is vetted by Microsoft, the installer needs no Store account and
  // is the only option on a machine without one. Unless the release itself has
  // been pointed at the Store, in which case one card already says so and a
  // second would be the same link twice.
  const windowsIsStore = isStoreLink(windowsURL)

  const cards: {
    key: string
    href: string
    label: string
    detail: string
    primary: boolean
  }[] = []

  const card = (platform: Platform, label: string, meta: string, primary = false) => {
    const dl = downloadFor(release, platform)
    return {
      key: platform,
      href: dl.url,
      label,
      detail: [release.version, dl.size, meta].filter(Boolean).join(' \u00b7 '),
      primary,
    }
  }

  cards.push(card('mac', t.download.mac, t.download.macMeta, true))
  cards.push(
    card(
      'windows',
      windowsIsStore ? t.download.windows : t.download.windowsDirect,
      t.download.windowsMeta,
    ),
  )
  if (!windowsIsStore) {
    // No version and no size: the Store page is not a release asset, it always
    // serves whatever Microsoft has certified.
    cards.push({
      key: 'store',
      href: STORE_URL,
      label: t.download.windows,
      detail: t.download.storeMeta,
      primary: false,
    })
  }
  cards.push(card('linux', t.download.linux, t.download.linuxMeta))

  return (
    <Section id="download" raised className="py-16 sm:py-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-[28px] font-bold tracking-[-0.01em] text-ink text-balance sm:text-[34px]">
          {t.download.title}
        </h2>
        <p className="max-w-[560px] text-base text-muted text-pretty">{t.download.body}</p>

        <div className="mt-7 flex flex-wrap justify-center gap-3.5">
          {cards.map(({ key, href, label, detail, primary }) => {
            return (
              <a
                key={key}
                href={href}
                className={
                  'flex min-w-[230px] flex-col items-center gap-1 rounded-lg px-6 py-3.5 text-[15px] font-semibold shadow-card transition-colors ' +
                  (primary
                    ? 'bg-accent text-on-accent hover:bg-accent-hover'
                    : 'border border-line bg-surface text-ink hover:border-ghost')
                }
              >
                <span>{label}</span>
                <span
                  className={
                    'text-xs font-normal ' + (primary ? 'opacity-75' : 'text-faint')
                  }
                >
                  {detail}
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
