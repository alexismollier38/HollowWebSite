import {useTranslations} from 'next-intl'
import {PageSimple} from '@/components/chrome/PageSimple'

/**
 * Page introuvable. Elle donne une action, pas une excuse : `PageSimple` place déjà
 * le retour à l'accueil sous le texte.
 */
export default function Introuvable() {
  const t = useTranslations('introuvable')

  return (
    <PageSimple titre={t('titre')}>
      <p>{t('explication')}</p>
    </PageSimple>
  )
}
