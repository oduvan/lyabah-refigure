import { Cli } from '../components/landing/Cli'
import { Compare } from '../components/landing/Compare'
import { DataNotPixels } from '../components/landing/DataNotPixels'
import { Download } from '../components/landing/Download'
import { FilesYouOwn } from '../components/landing/FilesYouOwn'
import { Hero } from '../components/landing/Hero'
import { Loop } from '../components/landing/Loop'
import { ManyImages } from '../components/landing/ManyImages'
import { Restyle } from '../components/landing/Restyle'
import { Rot } from '../components/landing/Rot'
import { useI18n } from '../i18n'
import { useDocumentHead } from '../lib/head'

export default function Landing() {
  const { t, locale, basePath } = useI18n()
  useDocumentHead({
    locale,
    htmlLang: t.meta.htmlLang,
    title: t.meta.home.title,
    description: t.meta.home.description,
    basePath,
  })

  return (
    <>
      <Hero />
      <Rot />
      <DataNotPixels />
      <Loop />
      <Compare />
      <ManyImages />
      <Restyle />
      <FilesYouOwn />
      <Cli />
      <Download />
    </>
  )
}
