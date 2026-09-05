import { useI18n } from '../../i18n'
import { Rich } from '../Rich'
import { CompactScreenshot } from './MockApp'
import { Section, SectionBody, SectionTitle } from './primitives'

function Key({ children }: { children: string }) {
  return <span className="text-accent">{children}</span>
}

export function DataNotPixels() {
  const { t } = useI18n()

  return (
    <Section>
      <div className="flex flex-col gap-10">
        <div className="flex max-w-[560px] flex-col gap-4">
          <SectionTitle>{t.data.title}</SectionTitle>
          <SectionBody>
            <Rich text={t.data.body} />
          </SectionBody>
        </div>

        <div className="grid overflow-hidden rounded-lg border border-line shadow-card md:grid-cols-2">
          <div className="flex items-center justify-center bg-sunken p-5 sm:p-7">
            <CompactScreenshot />
          </div>

          {/* The project file itself, not a terminal — light in the light theme. */}
          <div className="min-w-0 overflow-x-auto border-t border-line bg-surface px-6 py-6 font-mono text-[12.5px] leading-[1.75] text-ink md:border-t-0 md:border-l">
            <div className="mb-2 text-faint"># settings.yaml</div>
            <div>
              <Key>screen:</Key> settings
            </div>
            <div>
              <Key>image:</Key> settings@2x.png
            </div>
            <div>
              <Key>cuts:</Key>
            </div>
            <div className="pl-4">
              - <Key>name:</Key> connect-token
            </div>
            <div className="pl-8">
              <Key>rect:</Key> [312, 148, 560, 220]
            </div>
            <div>
              <Key>figures:</Key>
            </div>
            <div className="pl-4">
              - <Key>type:</Key> arrow
            </div>
            <div className="pl-8">
              <Key>from:</Key> [640, 402]
            </div>
            <div className="pl-8">
              <Key>to:</Key> [518, 296]
            </div>
            <div className="pl-8">
              <Key>color:</Key> "#E5484D"
            </div>
            <div className="pl-4">
              - <Key>type:</Key> text
            </div>
            <div className="pl-8">
              <Key>text:</Key> {t.mock.annotationPaste}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
