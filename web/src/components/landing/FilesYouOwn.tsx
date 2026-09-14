import { useI18n } from '../../i18n'
import { CodePanel, Comment, Section, SectionBody, SectionTitle } from './primitives'

export function FilesYouOwn() {
  const { t } = useI18n()

  return (
    <Section raised>
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="flex max-w-[440px] flex-col gap-4">
          <SectionTitle>{t.files.title}</SectionTitle>
          <SectionBody>{t.files.body}</SectionBody>
        </div>

        <CodePanel className="min-w-0 rounded-lg px-5 py-5 shadow-card">
          <div className="text-code-dim">$ git diff docs/screenshots/refigure.yaml</div>
          <div className="mt-1.5 text-code-dim">@@ -2,7 +2,7 @@ screen: settings</div>
          <div className="text-code-del">- image: settings@2x.png</div>
          <div className="text-code-add">+ image: settings-v2@2x.png</div>
          <div>&nbsp;&nbsp;cuts:</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;- name: connect-token</div>
          <div className="text-code-del">-&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;rect: [312, 148, 560, 220]</div>
          <div className="text-code-add">+&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;rect: [312, 164, 560, 236]</div>
          <div>&nbsp;&nbsp;figures:</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;- type: arrow</div>
          <div className="mt-1.5">
            <Comment>{t.files.diffCaption}</Comment>
          </div>
        </CodePanel>
      </div>
    </Section>
  )
}
