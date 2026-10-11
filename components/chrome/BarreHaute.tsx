import {env} from '@/lib/env'

/**
 * Barre haute du hero : un seul lien, aligné à droite, posé sur l'illustration.
 *
 * Rien d'autre n'y figure — c'est la maquette. Le site reste bilingue et `/en` est
 * servie normalement, mais aucune bascule de langue n'est affichée.
 */
export function BarreHaute() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 flex animate-[apparition_0.9s_cubic-bezier(0.2,0.7,0.2,1)_0.15s_both] items-center justify-end gap-6 px-[clamp(28px,4.4vw,64px)] py-[clamp(22px,3.4vh,34px)]">
      <a
        href={env.NEXT_PUBLIC_URL_DISCORD}
        rel="noreferrer noopener"
        target="_blank"
        className="label border-b border-parchemin/20 px-[2px] py-[9px] text-estompe-clair transition-colors hover:border-braise focus-visible:border-braise"
      >
        Discord
      </a>
    </header>
  )
}
