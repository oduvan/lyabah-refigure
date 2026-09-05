import { useI18n } from '../../i18n'
import { Arrow, Bar, Section, SectionBody, SectionTitle } from './primitives'

export function Rot() {
  const { t } = useI18n()

  return (
    <Section>
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="flex max-w-[440px] flex-col gap-4">
          <SectionTitle>{t.rot.title}</SectionTitle>
          <SectionBody>{t.rot.body}</SectionBody>
          <p className="text-sm leading-[1.6] text-subtle">{t.rot.aside}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <figure className="m-0 flex flex-col gap-2">
            <div className="relative rounded-lg border border-line bg-surface p-3.5 text-[11px] shadow-card">
              <div className="flex flex-col gap-2.5">
                <Bar w="60%" />
                <Bar w="85%" soft />
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-6 flex-1 rounded-[5px] border border-line-strong" />
                  <span className="inline-flex h-6 items-center rounded-[5px] bg-chip px-3 font-medium text-on-chip">
                    {t.mock.connect}
                  </span>
                </div>
                <Bar w="45%" soft />
              </div>
              <Arrow
                width={80}
                height={52}
                viewBox="0 0 80 52"
                strokeWidth={3}
                line={{ x1: 72, y1: 6, x2: 30, y2: 44 }}
                head="22,52 28,34 42,44"
                style={{ right: 2, top: -14 }}
              />
            </div>
            <figcaption className="text-xs text-faint">{t.rot.captionThen}</figcaption>
          </figure>

          <figure className="m-0 flex flex-col gap-2">
            <div className="rounded-lg border border-line bg-surface p-3.5 text-[11px] shadow-card">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <Bar w="50%" />
                  <span className="inline-flex h-6 items-center rounded-[5px] bg-accent px-3 font-medium text-on-accent">
                    {t.mock.connect}
                  </span>
                </div>
                <Bar w="85%" soft />
                <span className="mt-1.5 block h-6 rounded-[5px] border border-line-strong" />
                <Bar w="45%" soft />
              </div>
            </div>
            <figcaption className="text-xs text-faint">{t.rot.captionNow}</figcaption>
          </figure>
        </div>
      </div>
    </Section>
  )
}
