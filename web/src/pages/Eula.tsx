import { LegalDocument } from '../components/LegalDocument'
import { useI18n } from '../i18n'

export default function Eula() {
  const { t } = useI18n()
  return <LegalDocument doc={t.eula} meta={t.meta.eula} basePath="/eula" />
}
