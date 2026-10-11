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

  return {title: t('confidentialite.titre')}
}

export default async function PageConfidentialite({
  params,
}: {
  params: Promise<{locale: string}>
}) {
  const {locale} = await params
  setRequestLocale(locale)

  return <Contenu />
}

function Contenu() {
  const t = useTranslations('confidentialite')

  return (
    <PageSimple titre={t('titre')}>
      <p>{t('aucun_cookie')}</p>
      <p>{t('aucune_collecte')}</p>
      <p>{t('tiers')}</p>
    </PageSimple>
  )
}
