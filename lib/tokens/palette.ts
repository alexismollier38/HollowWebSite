/**
 * Source unique de vérité pour la couleur.
 *
 * Les valeurs proviennent de la direction artistique fournie par le client
 * (docs/DESIGN.md). Elles sont reprises telles quelles, en OKLCH là où l'original
 * l'utilise : les convertir en hexadécimal aurait introduit un écart invisible dans
 * un document et bien visible à l'écran.
 *
 * Elles sont dupliquées dans `app/styles/theme.css` sous forme de variables Tailwind.
 * La duplication est surveillée par `palette.test.ts`, qui relit le CSS et échoue si
 * une valeur diverge — on ne peut donc pas modifier l'un sans l'autre.
 */

/** Le fond et le noir des voiles. */
export const fonds = {
  /** Fond de page. Noir légèrement violacé, jamais #000. */
  encre: '#0a0809',
  /** Le noir des dégradés de lisibilité posés sur l'illustration. */
  voile: '#060507',
} as const

/** Les valeurs d'encre, du texte courant au libellé discret. */
export const textes = {
  /** Texte principal. */
  parchemin: 'oklch(0.93 0.012 85)',
  /** Survol d'un lien : on éclaircit, on ne colore pas. */
  parcheminVif: 'oklch(0.98 0.01 85)',
  /** Liens de la barre haute. */
  estompeClair: 'oklch(0.86 0.012 85)',
  /** Mentions légales, libellés secondaires. */
  estompe: 'oklch(0.6 0.01 80)',
} as const

/**
 * Le rouge. C'est la seule couleur du site, et elle vient du logo : le trèfle du
 * mot-symbole, l'orage, les braises. Trois valeurs, trois emplois.
 */
export const braises = {
  /** Accent : bordure au survol, éclair, anneau de focus. */
  braise: 'oklch(0.62 0.2 25)',
  /** Particules montantes. */
  braiseVif: 'oklch(0.68 0.2 27)',
  /** Séparateurs et sélection de texte. */
  braiseSombre: 'oklch(0.55 0.2 25)',
} as const

/**
 * Teintes de royaume, en réserve pour le lot 3.
 *
 * ⚠️ Elles ont été définies avant que la direction artistique ne bascule sur un hero
 * rouge. Le vert Clover et le violet Spade se battront avec lui. Arbitrage à rendre
 * quand les royaumes arriveront — voir docs/DESIGN.md.
 */
export const royaumes = {
  clover: {trait: '#5E8C4A', texte: '#8FB86A'},
  diamond: {trait: '#5C93B4', texte: '#8FBBD4'},
  spade: {trait: '#7A58AF', texte: '#AC8CE0'},
  heart: {trait: '#A85B78', texte: '#D68BA5'},
} as const

export type SlugRoyaume = keyof typeof royaumes

export const SLUGS_ROYAUMES = Object.keys(royaumes) as readonly SlugRoyaume[]

/** Toutes les couleurs à plat, pour les tests et la documentation. */
export const palette = {
  ...fonds,
  ...textes,
  ...braises,
  ...Object.fromEntries(
    Object.entries(royaumes).flatMap(([slug, teintes]) => [
      [`${slug}-trait`, teintes.trait],
      [`${slug}-texte`, teintes.texte],
    ]),
  ),
} as Record<string, string>
