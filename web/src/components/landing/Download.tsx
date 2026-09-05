import { useI18n } from '../../i18n'
import { downloadFor, type Platform, useRelease } from '../../lib/releases'
import { Section } from './primitives'

export function Download() {
  const { t } = useI18n()
  const release = useRelease()

  const cards: {
    platform: Platform
    label: string
    meta: string
    primary: boolean
  }[] = [
    { platform: 'mac', label: t.download.mac, meta: t.download.macMeta, primary: true },
    {
      platform: 'windows',
      label: t.download.windows,
      meta: t.download.windowsMeta,
      primary: false,
    },
    {
      platform: 'linux',
      label: t.download.linux,
      meta: t.download.linuxMeta,
      primary: false,
    },
  ]

  return (
    <Section id="download" raised className="py-16 sm:py-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-[28px] font-bold tracking-[-0.01em] text-ink text-balance sm:text-[34px]">
          {t.download.title}
        </h2>
        <p className="max-w-[560px] text-base text-muted text-pretty">{t.download.body}</p>

        <div className="mt-7 flex flex-wrap justify-center gap-3.5">
          {cards.map(({ platform, label, meta, primary }) => {
            const dl = downloadFor(release, platform)
            const detail = [release.version, dl.size, meta].filter(Boolean).join(' · ')
            return (
              <a
                key={platform}
                href={dl.url}
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
