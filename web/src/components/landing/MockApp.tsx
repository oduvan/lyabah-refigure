import { useI18n } from '../../i18n'
import { Arrow, Bar, Callout } from './primitives'

/**
 * The "Acme — Settings" window the whole page uses as its example screenshot,
 * rendered from theme tokens so it reads as a light or a dark app to match.
 *
 * The annotations are positioned against the row they annotate rather than
 * against the window, so they keep pointing at the right thing when the
 * content reflows — which is, after all, the product's whole argument.
 */
export function AnnotatedScreenshot() {
  const { t } = useI18n()

  return (
    <div className="relative w-full max-w-[720px] rounded-md border border-line-strong bg-surface text-xs shadow-soft">
      <div className="flex h-[34px] items-center gap-2.5 border-b border-line-soft px-3.5">
        <span className="h-2.5 w-2.5 rounded-[3px] bg-skeleton" aria-hidden="true" />
        <span className="font-semibold text-body">{t.mock.windowTitle}</span>
      </div>

      <div className="flex min-h-[190px] sm:min-h-[240px]">
        {/* Decorative chrome; the narrow layout needs the width for the content. */}
        <nav className="hidden w-[150px] shrink-0 flex-col border-r border-line-soft py-3 sm:flex">
          <span className="px-3.5 py-[7px] text-faint">{t.mock.nav.general}</span>
          <span className="bg-mute px-3.5 py-[7px] font-medium text-ink">
            {t.mock.nav.integrations}
          </span>
          <span className="px-3.5 py-[7px] text-faint">{t.mock.nav.team}</span>
          <span className="px-3.5 py-[7px] text-faint">{t.mock.nav.billing}</span>
        </nav>

        <div className="flex flex-1 flex-col gap-3.5 px-4 py-5 sm:px-6">
          <span className="text-sm font-semibold text-ink">{t.mock.apiAccess}</span>
          <span className="max-w-[340px] text-faint">{t.mock.apiBlurb}</span>

          <div className="relative">
            {/* The cut: one named rectangle, exported as one image. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-[30px] -right-4 -bottom-[26px] -left-4 rounded border-[1.5px] border-dashed border-accent bg-accent-wash sm:-right-6 sm:-left-6"
            >
              <span className="absolute -top-[11px] left-2 rounded bg-accent px-2 py-px font-mono text-[10px] font-semibold text-on-accent">
                connect-token
              </span>
            </div>

            <div className="relative flex items-center gap-2">
              <span className="flex h-[30px] max-w-[280px] flex-1 items-center rounded-md border border-line-strong px-2.5 text-ghost">
                {t.mock.tokenPlaceholder}
              </span>
              <span className="inline-flex h-[30px] items-center rounded-md bg-chip px-3.5 font-medium text-on-chip">
                {t.mock.connect}
              </span>
            </div>

            <Arrow
              width={120}
              height={70}
              viewBox="0 0 120 70"
              strokeWidth={3}
              line={{ x1: 110, y1: 62, x2: 26, y2: 14 }}
              head="14,7 34,10 26,26"
              style={{ right: 52, top: 2 }}
            />
            <Callout style={{ right: 0, top: '100%', marginTop: 26 }}>
              {t.mock.annotationPaste}
            </Callout>
            <span
              aria-hidden="true"
              style={{ right: 46, top: '100%', marginTop: 18 }}
              className="absolute h-[7px] w-[7px] rounded-full border-[1.5px] border-accent bg-surface"
            />
          </div>

          <span className="text-ghost">{t.mock.tokenNote}</span>
        </div>
      </div>
    </div>
  )
}

/** A compact version of the same screen, used beside the YAML sample. */
export function CompactScreenshot() {
  const { t } = useI18n()

  return (
    <div className="relative w-full max-w-[380px] rounded-md border border-line-strong bg-surface p-4 text-[11px]">
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold text-body">{t.mock.apiAccess}</span>
        <Bar w="70%" h={7} soft />

        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-2.5 -top-2 -bottom-2.5 rounded border-[1.5px] border-dashed border-accent bg-accent-wash"
          >
            <span className="absolute -top-[10px] left-2 rounded bg-accent px-2 py-px font-mono text-[10px] font-semibold text-on-accent">
              connect-token
            </span>
          </div>

          <div className="relative flex items-center gap-2">
            <span className="flex h-[26px] flex-1 items-center rounded-md border border-line-strong px-2 text-ghost">
              {t.mock.tokenPlaceholderShort}
            </span>
            <span className="inline-flex h-[26px] items-center rounded-md bg-chip px-2.5 text-on-chip">
              {t.mock.connect}
            </span>
          </div>

          <Arrow
            width={70}
            height={44}
            viewBox="0 0 70 44"
            line={{ x1: 64, y1: 40, x2: 20, y2: 10 }}
            head="11,4 27,5 20,19"
            style={{ right: 8, top: 6 }}
          />
        </div>
      </div>
    </div>
  )
}
