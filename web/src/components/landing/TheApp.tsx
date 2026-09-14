import { useI18n } from '../../i18n'
import { Section, SectionBody, SectionTitle } from './primitives'
import { Shot } from './Shot'

/** The real window, once, near the top — the rest of the page is illustration. */
export function TheApp() {
  const { t } = useI18n()

  return (
    <Section raised>
      <div className="flex flex-col items-center gap-4 text-center">
        <SectionTitle>{t.app.title}</SectionTitle>
        <SectionBody className="max-w-[620px]">{t.app.body}</SectionBody>
      </div>
      <div className="mt-9">
        <Shot name="editor" alt={t.app.alt} priority />
      </div>
    </Section>
  )
}
