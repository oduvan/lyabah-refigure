import { useI18n } from '../../i18n'
import { Section, SectionBody, SectionTitle } from './primitives'
import { Shot } from './Shot'

/** Blur and pixelate: the one figure whose job is to remove information. */
export function Redact() {
  const { t } = useI18n()

  return (
    <Section>
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-14">
        <div className="flex max-w-[440px] flex-col gap-4">
          <SectionTitle>{t.redact.title}</SectionTitle>
          <SectionBody>{t.redact.body}</SectionBody>
          <p className="text-[13px] text-faint">{t.redact.caption}</p>
        </div>
        <Shot name="redact" alt={t.redact.alt} />
      </div>
    </Section>
  )
}
