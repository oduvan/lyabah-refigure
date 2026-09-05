import { useI18n } from '../../i18n'
import { Arrow, Section, SectionBody, SectionTitle } from './primitives'

function Thumb({ tone }: { tone: 'annot' | 'accent' }) {
  return (
    <div className="relative h-[74px] flex-1 rounded-md border border-line bg-surface p-2.5 shadow-card">
      <span className="block h-1.5 w-3/5 rounded-full bg-skeleton-soft" />
      <span className="mt-[7px] block h-1.5 w-2/5 rounded-full bg-mute" />
      <Arrow
        width={44}
        height={30}
        viewBox="0 0 44 30"
        line={{ x1: 6, y1: 26, x2: 32, y2: 8 }}
        head="40,4 28,4 34,16"
        style={{ right: 8, bottom: 6 }}
        className={tone === 'annot' ? 'text-annot' : 'text-accent'}
      />
    </div>
  )
}

export function Restyle() {
  const { t } = useI18n()

  return (
    <Section>
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="flex max-w-[440px] flex-col gap-4">
          <SectionTitle>{t.restyle.title}</SectionTitle>
          <SectionBody>{t.restyle.body}</SectionBody>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            {[0, 1, 2].map((i) => (
              <Thumb key={i} tone="annot" />
            ))}
            <span className="hidden font-mono text-[11px] whitespace-nowrap text-faint sm:inline">
              color: "#E5484D"
            </span>
          </div>
          <div className="flex items-center gap-3">
            {[0, 1, 2].map((i) => (
              <Thumb key={i} tone="accent" />
            ))}
            <span className="hidden font-mono text-[11px] whitespace-nowrap text-accent sm:inline">
              color: "#4F6DF5"
            </span>
          </div>
          <p className="text-xs text-subtle">{t.restyle.caption}</p>
        </div>
      </div>
    </Section>
  )
}
