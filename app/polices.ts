import localFont from 'next/font/local'

/**
 * Les deux familles de la direction artistique, auto-hébergées.
 *
 * Clash Display et Satoshi viennent de Fontshare (Indian Type Foundry), sous ITF Free
 * Font License : usage commercial et auto-hébergement autorisés, redistribution des
 * fichiers interdite. Les .woff2 ne sont donc **pas** versionnés — `pnpm fonts` les
 * récupère depuis la source officielle, et ils sont ensuite servis depuis notre
 * domaine. Aucun appel à un tiers au chargement, et la CSP reste en `font-src 'self'`.
 *
 * Trois fichiers, 66 Ko au total. Le mot-symbole étant une image, aucune graisse
 * d'affichage n'est nécessaire pour le titre.
 */

/** Display. Une seule ligne l'utilise — la baseline — mais elle en porte le ton. */
export const display = localFont({
  src: [{path: '../assets/fonts/ClashDisplay-400.woff2', weight: '400', style: 'normal'}],
  variable: '--police-display',
  display: 'swap',
  preload: true,
  fallback: ['Manrope', 'system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

/** Corps : libellés, actions, mentions. La graisse 500 porte les capitales espacées. */
export const corps = localFont({
  src: [
    {path: '../assets/fonts/Satoshi-400.woff2', weight: '400', style: 'normal'},
    {path: '../assets/fonts/Satoshi-500.woff2', weight: '500', style: 'normal'},
  ],
  variable: '--police-corps',
  display: 'swap',
  preload: true,
  fallback: ['Manrope', 'system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

/** À poser sur `<html>`. */
export const variablesDePolices = `${display.variable} ${corps.variable}`
