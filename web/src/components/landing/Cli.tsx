import { useI18n } from '../../i18n'
import { REPO_URL } from '../../lib/links'
import { Rich } from '../Rich'
import { CopyableCommand } from './CopyableCommand'
import { CodePanel, Comment, Section, SectionBody, SectionTitle } from './primitives'

export function Cli() {
  const { t } = useI18n()

  return (
    <Section>
      <div className="flex min-w-0 flex-col gap-9">
        <div className="flex max-w-[600px] flex-col gap-4">
          <SectionTitle>{t.cli.title}</SectionTitle>
          <SectionBody>
            <Rich text={t.cli.body} />
          </SectionBody>
        </div>

        <div className="flex min-w-0 max-w-[820px] flex-col gap-0.5">
          <CopyableCommand
            className="rounded-t-lg"
            comment={t.cli.comments.npx}
            lines={['npx refigure-cli export ./docs/screenshots --out ./site/static/img']}
          />
          <CopyableCommand
            comment={t.cli.comments.brew}
            lines={[
              'brew tap oduvan/refigure https://github.com/oduvan/refigure-cli',
              'brew trust oduvan/refigure',
              'brew install refigure',
            ]}
          />
          <CopyableCommand
            comment={t.cli.comments.curl}
            lines={[
              'curl -sSL https://github.com/oduvan/refigure-cli/releases/download/v1.2.3/refigure_v1.2.3_darwin_arm64.tar.gz | tar -xz',
            ]}
          />
          <CopyableCommand
            className="rounded-b-lg"
            comment={t.cli.comments.go}
            lines={['go install github.com/oduvan/refigure-cli/cmd/refigure@latest']}
          />
          <p className="mt-2.5 text-xs text-subtle">
            <Rich text={t.cli.pinNote} />
          </p>
        </div>

        <div className="flex min-w-0 max-w-[820px] flex-col gap-3">
          <p className="text-sm text-body">{t.cli.shortest}</p>
          <CodePanel className="rounded-lg px-5 py-4 text-[13px]">
            refigure export ./docs/screenshots --out ./site/static/img
          </CodePanel>
          <p className="text-[13px] text-subtle">
            {t.cli.sameBinary}{' '}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent hover:underline"
            >
              {t.cli.repository}
            </a>
          </p>
        </div>

        <div className="grid items-start gap-10 border-t border-line pt-9 md:grid-cols-2 md:gap-12">
          <div className="flex min-w-0 max-w-[480px] flex-col gap-3.5">
            <h3 className="text-[19px] font-semibold text-ink">{t.assistants.title}</h3>
            <p className="text-[15px] leading-[1.65] text-body text-pretty">
              {t.assistants.body}
            </p>
            <CodePanel className="rounded-lg px-4.5 py-3.5 leading-[1.8]">
              <div className="whitespace-pre">
                refigure schema <Comment>{t.assistants.schemaComments.schema}</Comment>
              </div>
              <div className="whitespace-pre">
                refigure schema --example{' '}
                <Comment>{t.assistants.schemaComments.example}</Comment>
              </div>
              <div className="whitespace-pre">
                refigure validate --json{' '}
                <Comment>{t.assistants.schemaComments.validate}</Comment>
              </div>
            </CodePanel>
            <p className="text-[15px] leading-[1.65] text-body text-pretty">
              {t.assistants.readsOnly}
            </p>
          </div>

          <CodePanel className="min-w-0 rounded-lg px-5 py-4.5 leading-[1.75] shadow-card">
            <div className="text-code-dim">$ refigure validate ./docs/screenshots</div>
            <div className="mt-2">settings.yaml</div>
            <div>
              &nbsp;&nbsp;<span className="text-code-warn">{t.assistants.validate.warning}</span>
              &nbsp; {t.assistants.validate.line}{' '}
              <span className="text-code-warn">colour</span>{' '}
              {t.assistants.validate.didYouMean}{' '}
              <span className="text-code-add">color</span>?
            </div>
            <div className="mt-2">
              welcome.yaml&nbsp;&nbsp;
              <span className="text-code-add">{t.assistants.validate.ok}</span>
            </div>
            <div>
              tokens.yaml&nbsp;&nbsp;&nbsp;
              <span className="text-code-add">{t.assistants.validate.ok}</span>
            </div>
            <div className="mt-2 text-code-dim">{t.assistants.validate.summary}</div>
          </CodePanel>
        </div>
      </div>
    </Section>
  )
}
