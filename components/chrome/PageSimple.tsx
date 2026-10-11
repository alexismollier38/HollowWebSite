import {useLocale, useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'

/**
 * Gabarit des pages de texte : mentions légales, confidentialité, page introuvable.
 *
 * Volontairement dépouillé. Le hero porte toute la mise en scène ; ici on ne demande
 * qu'une chose, que ça se lise. Même palette, même typographie, aucune illustration.
 */
export function PageSimple({
  titre,
  children,
}: {
  titre: string
  children: React.ReactNode
}) {
  const t = useTranslations()
  const locale = useLocale()

  return (
    <main
      id="contenu"
      className="mx-auto flex min-h-svh w-full max-w-[46rem] flex-col justify-center gap-8 px-6 py-24"
    >
      <div className="flex flex-col gap-3">
        <p className="label text-estompe">{t('marque.nom')}</p>
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-tight text-parchemin">
          {titre}
        </h1>
      </div>

      <div className="flex flex-col gap-4 text-[0.95rem] leading-relaxed text-estompe-clair">
        {children}
      </div>

      <p>
        <Link
          href="/"
          locale={locale}
          className="label inline-flex min-h-6 items-center border-b border-parchemin/20 pb-1 text-estompe transition-colors hover:border-braise hover:text-parchemin focus-visible:border-braise focus-visible:text-parchemin"
        >
          {t('navigation.retour')}
        </Link>
      </p>
    </main>
  )
}
