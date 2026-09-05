import { useId, useState } from 'react'
import { useI18n } from '../../i18n'
import { Arrow, Bar, Callout, Section, SectionBody, SectionTitle } from './primitives'

/**
 * The slider is real rather than a picture of one: dragging it cross-fades the
 * old screenshot into the new one while the annotations stay put, which is the
 * point the section is making.
 */
export function Compare() {
  const { t } = useI18n()
  const [fade, setFade] = useState(45)
  const sliderId = useId()
  const v = fade / 100

  return (
    <Section raised>
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="flex max-w-[440px] flex-col gap-4">
          <SectionTitle>{t.compare.title}</SectionTitle>
          <SectionBody>{t.compare.body}</SectionBody>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-line bg-sunken p-6">
          <div className="relative min-h-[150px] rounded-md border border-line-strong bg-surface p-4 text-[11px]">
            <div className="flex flex-col gap-2.5">
              <Bar w="55%" h={7} />
              <Bar w="80%" h={7} soft />
              <div className="mt-1 flex items-center gap-2">
                <span className="h-[26px] max-w-[180px] flex-1 rounded-[5px] border border-line-strong" />
                <span
                  style={{ opacity: 1 - v }}
                  className="inline-flex h-[26px] items-center rounded-[5px] bg-chip px-3 font-medium text-on-chip"
                >
                  {t.mock.connect}
                </span>
              </div>
            </div>

            <span
              style={{ opacity: v }}
              className="absolute top-3 right-3.5 inline-flex h-[26px] items-center rounded-[5px] bg-accent px-3 text-[11px] font-medium text-on-accent"
            >
              {t.mock.connect}
            </span>

            <Arrow
              width={90}
              height={56}
              viewBox="0 0 90 56"
              line={{ x1: 8, y1: 50, x2: 66, y2: 14 }}
              head="76,8 60,8 68,22"
              style={{ left: 40, bottom: 6 }}
            />
            <Callout style={{ left: 14, bottom: 8 }} className="px-2 py-[3px] text-[10px]">
              {t.mock.annotationClick}
            </Callout>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-faint">{t.compare.old}</span>
            <input
              id={sliderId}
              type="range"
              min={0}
              max={100}
              value={fade}
              aria-label={t.compare.sliderLabel}
              onChange={(e) => setFade(Number(e.target.value))}
              className="h-4 flex-1 cursor-pointer accent-accent"
            />
            <span className="font-mono text-[11px] text-faint">{t.compare.new}</span>
          </div>

          <p className="text-center text-xs text-subtle">{t.compare.caption}</p>
        </div>
      </div>
    </Section>
  )
}
