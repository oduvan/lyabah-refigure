import { useI18n } from '../../i18n'
import { Bar, Cut, Section, SectionBody, SectionTitle } from './primitives'

const FILES = ['connect-token.png', 'connect-full.png', 'connect-error.png']

export function ManyImages() {
  const { t } = useI18n()

  return (
    <Section>
      <div className="flex flex-col gap-10">
        <div className="flex max-w-[560px] flex-col gap-4">
          <SectionTitle>{t.many.title}</SectionTitle>
          <SectionBody>{t.many.body}</SectionBody>
        </div>

        <div className="flex flex-wrap items-center gap-8">
          <div className="relative min-w-[300px] max-w-[520px] flex-[2] rounded-md border border-line-strong bg-surface p-[18px] text-[11px] shadow-card">
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-body">
                {t.mock.windowTitleLong}
              </span>
              <div className="flex items-center gap-2">
                <span className="flex h-[26px] max-w-[220px] flex-1 items-center rounded-[5px] border border-line-strong px-2 text-ghost">
                  {t.mock.tokenPlaceholderShort}
                </span>
                <span className="inline-flex h-[26px] items-center rounded-[5px] bg-chip px-2.5 text-on-chip">
                  {t.mock.connect}
                </span>
              </div>
              <Bar w="75%" h={7} soft />
              <div className="flex max-w-[320px] items-center gap-2 rounded-[5px] border border-error-line bg-error-bg px-2.5 py-2 text-error-ink">
                {t.mock.tokenError}
              </div>
            </div>

            <Cut
              style={{ left: 10, top: 48, width: '62%', height: 38 }}
              name="connect-token"
              labelPosition="bottom"
            />
            <Cut
              style={{ inset: 6 }}
              name="connect-full"
              tone="soft"
              labelPosition="top-right"
            />
            <Cut
              style={{ left: 10, bottom: 10, width: '66%', height: 40 }}
              name="connect-error"
              labelPosition="bottom"
            />
          </div>

          {/* Only meaningful while the two halves sit side by side. */}
          <div className="hidden text-[22px] text-ghost lg:block" aria-hidden="true">
            →
          </div>

          <div className="flex min-w-[220px] flex-1 flex-col gap-2.5">
            {FILES.map((file) => (
              <div
                key={file}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5 shadow-card"
              >
                <span
                  className="h-5 w-[26px] rounded-[3px] border border-line bg-sunken"
                  aria-hidden="true"
                />
                <span className="font-mono text-xs text-ink">{file}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
