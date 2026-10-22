import {env} from '@/lib/env'

/**
 * Barre haute du hero : un seul lien, aligné à droite, posé sur l'illustration.
 *
 * Rien d'autre n'y figure — c'est la maquette. Le site reste bilingue et `/en` est
 * servie normalement, mais aucune bascule de langue n'est affichée.
 */
export function BarreHaute() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-end gap-6 px-[clamp(28px,4.4vw,64px)] py-[clamp(22px,3.4vh,34px)]">
      <a
        href={env.NEXT_PUBLIC_URL_DISCORD}
        rel="noreferrer noopener"
        target="_blank"
        aria-label="Discord Hollow"
        className="group flex items-center gap-2 border-b border-parchemin/20 px-[2px] py-[7px] text-estompe-clair transition-colors hover:border-parchemin focus-visible:border-parchemin"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5 fill-current transition-colors group-hover:text-parchemin"
        >
          <path d="M19.54 5.32A16.7 16.7 0 0 0 15.43 4l-.5 1.02a15.4 15.4 0 0 0-5.86 0L8.57 4a16.75 16.75 0 0 0-4.11 1.32C1.85 9.25 1.15 13.08 1.5 16.86a16.9 16.9 0 0 0 5.05 2.57l1.22-1.67c-.67-.25-1.3-.56-1.9-.92l.47-.36c3.66 1.7 7.63 1.7 11.25 0l.48.36c-.6.36-1.24.67-1.91.92l1.22 1.67a16.9 16.9 0 0 0 5.05-2.57c.41-4.38-.7-8.17-2.89-11.54ZM8.52 14.45c-1.08 0-1.97-.99-1.97-2.2s.87-2.2 1.97-2.2 1.98.99 1.98 2.2-.89 2.2-1.98 2.2Zm6.96 0c-1.08 0-1.97-.99-1.97-2.2s.87-2.2 1.97-2.2 1.98.99 1.98 2.2-.89 2.2-1.98 2.2Z" />
        </svg>
        <span className="label text-[0.62rem] tracking-[0.18em]">Hollow</span>
      </a>
    </header>
  )
}
