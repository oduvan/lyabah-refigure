import { useI18n } from '../../i18n'
import { downloadFor, isStoreLink, usePlatform, useRelease } from '../../lib/releases'
import { STORE_URL } from '../../lib/links'
import { AnnotatedScreenshot } from './MockApp'
import { Section } from './primitives'

export function Hero() {
  const { t } = useI18n()
  const release = useRelease()
  const platform = usePlatform()
  const download = downloadFor(release, platform)

  const label = {
    mac: t.download.mac,
    windows: isStoreLink(download.url) ? t.download.windows : t.download.windowsDirect,
    linux: t.download.linux,
  }[platform]
  const meta = [release.version, download.size].filter(Boolean).join(' · ')
  // A Windows visitor is the only one with a real choice to make here, and the
  // hero button can only be one thing. Offer the other route inline rather than
  // making them find it further down the page.
  const showStore = platform === 'windows' && !isStoreLink(download.url)

  return (
    <Section first className="pt-14 pb-16 sm:pt-24 sm:pb-20">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-[34px] leading-[1.1] font-bold tracking-[-0.02em] text-ink text-balance sm:text-[44px] md:text-[52px]">
          {t.hero.title}
        </h1>
        <p className="mt-5 max-w-[640px] text-[17px] leading-[1.6] text-muted text-pretty sm:text-lg">
          {t.hero.subtitle}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href={download.url}
            className="inline-flex items-baseline gap-2.5 rounded-lg bg-accent px-6 py-3.5 text-base font-semibold text-on-accent shadow-card transition-colors hover:bg-accent-hover"
          >
            <span>{label}</span>
            <span className="text-[13px] font-normal opacity-75">{meta}</span>
          </a>
          {showStore && (
            <a
              href={STORE_URL}
              className="text-[13px] text-subtle underline underline-offset-2 transition-colors hover:text-ink"
            >
              {t.hero.orStore}
            </a>
          )}
          <div className="text-[13px] text-subtle">
            {t.hero.freeNote} · {t.hero.platforms} ·{' '}
            <a
              href="#download"
              className="underline underline-offset-2 transition-colors hover:text-ink"
            >
              {t.hero.otherPlatforms}
            </a>
          </div>
        </div>

        <div className="mt-12 w-full max-w-[960px] overflow-hidden rounded-lg border border-line bg-surface text-left shadow-card sm:mt-14">
          <div className="flex h-10 items-center gap-4 overflow-x-auto border-b border-line px-4">
            <span className="shrink-0 text-[13px] font-semibold text-ink">
              {t.editor.app}
            </span>
            {/* Yields the width to the toolbar on a narrow screen. */}
            <span className="hidden shrink-0 text-xs text-faint sm:inline">
              {t.editor.path}
            </span>
            <div className="ml-auto flex shrink-0 gap-1">
              <span className="rounded-md bg-accent-tint px-2.5 py-1 text-xs font-medium text-accent">
                {t.editor.tools.cut}
              </span>
              {[t.editor.tools.arrow, t.editor.tools.rect, t.editor.tools.text, t.editor.tools.export].map(
                (tool) => (
                  <span key={tool} className="rounded-md px-2.5 py-1 text-xs text-muted">
                    {tool}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="flex justify-center bg-sunken p-4 sm:p-8">
            <AnnotatedScreenshot />
          </div>

          <div className="flex h-[30px] items-center gap-4 overflow-x-auto border-t border-line px-4 font-mono text-[11px] whitespace-nowrap text-faint">
            <span>{t.editor.status}</span>
            <span>{t.editor.file}</span>
            <span className="ml-auto">{t.editor.saved}</span>
          </div>
        </div>
      </div>
    </Section>
  )
}
