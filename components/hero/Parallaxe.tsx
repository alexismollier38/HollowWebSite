'use client'

import {useEffect, useRef} from 'react'

/**
 * Parallaxe à la souris sur le hero.
 *
 * Le composant ne fait qu'une chose : poser deux variables CSS normalisées entre -0,5
 * et 0,5 sur la section. Les plans — l'illustration et le bloc de texte — s'en servent
 * par `calc()` pour se déplacer en sens inverse. Aucun style n'est calculé en
 * JavaScript, aucune boucle d'animation n'est ouverte.
 *
 * Ses enfants sont transmis en propriété : ils restent rendus côté serveur.
 */
export function Parallaxe({
  children,
  ...proprietes
}: React.ComponentPropsWithoutRef<'section'>) {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const cible = section.current

    if (cible === null) {
      return
    }

    // Le mouvement est un agrément : qui demande moins d'animation n'en veut pas.
    const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (mouvementReduit.matches) {
      return
    }

    // Un écran tactile n'a pas de curseur à suivre, et l'écoute coûterait pour rien.
    if (!window.matchMedia('(pointer: fine)').matches) {
      return
    }

    const surDeplacement = (evenement: PointerEvent) => {
      cible.style.setProperty(
        '--parallaxe-x',
        (evenement.clientX / window.innerWidth - 0.5).toFixed(3),
      )
      cible.style.setProperty(
        '--parallaxe-y',
        (evenement.clientY / window.innerHeight - 0.5).toFixed(3),
      )
    }

    window.addEventListener('pointermove', surDeplacement, {passive: true})

    return () => {
      window.removeEventListener('pointermove', surDeplacement)
    }
  }, [])

  return (
    <section ref={section} {...proprietes}>
      {children}
    </section>
  )
}
