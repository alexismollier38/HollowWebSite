import {useLocale, useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'

/**
 * Le bandeau du bas : les deux liens de la maquette, centrés, séparés d'un point rouge.
 */
export function MentionsBas() {
  const t = useTranslations('pied')
  // La locale est passée explicitement à chaque `Link` : son composant client appelle
  // `useLocale()` sans condition, et le prérendu échoue sans le contexte.
  const locale = useLocale()

  return (
    <footer className="fixed inset-x-0 bottom-[clamp(18px,2.8vh,28px)] z-10 flex animate-[apparition_0.9s_cubic-bezier(0.2,0.7,0.2,1)_0.75s_both] flex-wrap items-center justify-center gap-x-[22px] gap-y-1 px-6">
      <Link
        href="/conditions-utilisation"
        locale={locale}
        className="mention text-estompe transition-colors hover:text-parchemin focus-visible:text-parchemin"
      >
        {t('conditions')}
      </Link>

      <span aria-hidden="true" className="text-[12px] leading-none text-braise-sombre">
        ·
      </span>

      <Link
        href="/confidentialite"
        locale={locale}
        className="mention text-estompe transition-colors hover:text-parchemin focus-visible:text-parchemin"
      >
        {t('confidentialite')}
      </Link>
    </footer>
  )
}
