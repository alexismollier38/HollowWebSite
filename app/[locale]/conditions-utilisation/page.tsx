import type {Metadata} from 'next'
import {useTranslations} from 'next-intl'
import {getTranslations, setRequestLocale} from 'next-intl/server'
import {PageSimple} from '@/components/chrome/PageSimple'
import {routing} from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>
}): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale})

  return {title: t('conditions.titre')}
}

export default async function PageConditions({
  params,
}: {
  params: Promise<{locale: string}>
}) {
  const {locale} = await params
  setRequestLocale(locale)

  return <Contenu />
}

function Contenu() {
  const t = useTranslations('conditions')

  return (
    <PageSimple titre={t('titre')}>
      <p>{t('en_preparation')}</p>
      <p>{t('serveur')}</p>
      <p>{t('marques')}</p>
    </PageSimple>
  )
}
