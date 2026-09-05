import { useI18n } from '../../i18n'
import { Arrow, Bar, Section, SectionTitle } from './primitives'

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[150px] items-center justify-center gap-2.5 rounded-lg border border-line bg-surface p-4 shadow-card">
      {children}
    </div>
  )
}

export function Loop() {
  const { t } = useI18n()
  const [create, ship, update] = t.loop.steps

  return (
    <Section>
      <div className="flex flex-col gap-11">
        <SectionTitle>{t.loop.title}</SectionTitle>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1 — create */}
          <div className="flex flex-col gap-3.5">
            <Frame>
              <div className="relative flex w-[150px] flex-col gap-2 rounded-[5px] border border-line bg-bg p-3">
                <Bar w="70%" h={6} />
                <Bar w="90%" h={6} soft />
                <Bar w="50%" h={6} soft />
                <div className="absolute top-1.5 right-1.5 h-[30px] w-16 rounded-[3px] border-[1.5px] border-dashed border-accent" />
                <Arrow
                  width={36}
                  height={26}
                  viewBox="0 0 36 26"
                  strokeWidth={2}
                  line={{ x1: 4, y1: 24, x2: 28, y2: 8 }}
                  head="34,4 24,4 30,14"
                  style={{ left: 8, bottom: 4 }}
                />
              </div>
            </Frame>
            <p className="text-sm leading-[1.6] text-muted">
              <span className="text-[15px] font-semibold text-ink">{create.label}</span>{' '}
              {create.body}
            </p>
          </div>

          {/* 2 — ship */}
          <div className="flex flex-col gap-3.5">
            <Frame>
              <div className="flex w-[110px] flex-col gap-[7px] rounded-[5px] border border-line bg-bg p-2.5 opacity-55">
                <Bar w="70%" h={6} />
                <span className="block h-3.5 w-2/5 rounded-[3px] bg-skeleton" />
                <Bar w="85%" h={6} soft />
              </div>
              <span className="text-base text-faint" aria-hidden="true">
                →
              </span>
              <div className="flex w-[110px] flex-col gap-[7px] rounded-[5px] border border-line bg-bg p-2.5">
                <div className="flex justify-between">
                  <Bar w="45%" h={6} />
                  <span className="block h-3 w-[30%] rounded-[3px] bg-accent" />
                </div>
                <Bar w="85%" h={6} soft />
                <Bar w="60%" h={6} soft />
              </div>
            </Frame>
            <p className="text-sm leading-[1.6] text-muted">
              <span className="text-[15px] font-semibold text-ink">{ship.label}</span>{' '}
              {ship.body}
            </p>
          </div>

          {/* 3 — update */}
          <div className="flex flex-col gap-3.5">
            <Frame>
              <div className="relative flex w-[150px] flex-col gap-2 rounded-[5px] border border-line bg-bg p-3">
                <div className="flex justify-between">
                  <Bar w="50%" h={6} />
                  <span className="block h-3 w-[26%] rounded-[3px] bg-accent" />
                </div>
                <Bar w="90%" h={6} soft />
                <Bar w="50%" h={6} soft />
                <div className="absolute top-1 right-1 h-[22px] w-[52px] rounded-[3px] border-[1.5px] border-dashed border-accent ring-2 ring-accent/15" />
                <span className="absolute -top-3.5 -right-1.5 font-mono text-[9px] whitespace-nowrap text-accent">
                  {t.loop.nudged}
                </span>
              </div>
            </Frame>
            <p className="text-sm leading-[1.6] text-muted">
              <span className="text-[15px] font-semibold text-ink">{update.label}</span>{' '}
              {update.body}
            </p>
          </div>
        </div>

        <p className="text-lg font-semibold tracking-[-0.01em] text-ink text-balance sm:text-[21px]">
          {t.loop.kicker}
        </p>
      </div>
    </Section>
  )
}
