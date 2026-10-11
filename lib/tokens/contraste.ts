/**
 * Calcul de contraste WCAG 2.1.
 *
 * Sert au test qui garde la palette honnête : si une couleur descend sous le seuil AA
 * pour l'usage qu'on lui a donné, le build échoue. On ne se fie jamais à l'œil ni à
 * une valeur annoncée dans un document.
 *
 * Deux notations sont acceptées, parce que la palette utilise les deux : l'hexadécimal
 * pour les fonds, et OKLCH pour tout ce qui vient de la direction artistique fournie
 * par le client — la convertir en hexadécimal aurait fait perdre les valeurs exactes.
 */

/** Composantes rouge, vert, bleu en **linéaire** (0–1), avant encodage gamma. */
export type LineaireRvb = readonly [number, number, number]

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/i

/** `#RRGGBB` ou `#RGB` vers du RVB linéaire. */
function hexVersLineaire(hex: string): LineaireRvb {
  const brut = hex.replace('#', '').trim()

  const etendu =
    brut.length === 3
      ? brut
          .split('')
          .map((caractere) => caractere + caractere)
          .join('')
      : brut

  if (!/^[0-9a-fA-F]{6}$/.test(etendu)) {
    throw new Error(`Couleur hexadécimale invalide : « ${hex} »`)
  }

  const nombre = Number.parseInt(etendu, 16)

  const canaux = [(nombre >> 16) & 0xff, (nombre >> 8) & 0xff, nombre & 0xff] as const

  return canaux.map((canal) => {
    const proportion = canal / 255
    return proportion <= 0.04045
      ? proportion / 12.92
      : ((proportion + 0.055) / 1.055) ** 2.4
  }) as unknown as LineaireRvb
}

/**
 * `oklch(L C H)` vers du RVB linéaire.
 *
 * OKLCH -> OKLab -> cônes LMS -> RVB linéaire. On s'arrête là : la luminance WCAG se
 * calcule justement sur le linéaire, donc réencoder en gamma puis le défaire serait
 * un aller-retour inutile et une source d'erreur d'arrondi.
 */
function oklchVersLineaire(couleur: string): LineaireRvb {
  const trouve = OKLCH.exec(couleur.trim())

  if (trouve === null) {
    throw new Error(`Couleur OKLCH invalide : « ${couleur} »`)
  }

  const clarte = Number(trouve[1])
  const chroma = Number(trouve[2])
  const teinteRad = (Number(trouve[3]) * Math.PI) / 180

  const a = chroma * Math.cos(teinteRad)
  const b = chroma * Math.sin(teinteRad)

  const l = (clarte + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (clarte - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (clarte - 0.0894841775 * a - 1.291485548 * b) ** 3

  const rvb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ] as const

  // Une couleur OKLCH peut sortir du gamut sRGB ; l'écran l'écrête, nous aussi.
  return rvb.map((canal) => Math.min(1, Math.max(0, canal))) as unknown as LineaireRvb
}

/** Accepte `#RRGGBB`, `#RGB` ou `oklch(L C H)`. */
export function versLineaire(couleur: string): LineaireRvb {
  return couleur.trim().toLowerCase().startsWith('oklch(')
    ? oklchVersLineaire(couleur)
    : hexVersLineaire(couleur)
}

/** Luminance relative, formule WCAG 2.1. */
export function luminance(couleur: string): number {
  const [r, v, b] = versLineaire(couleur)
  return 0.2126 * r + 0.7152 * v + 0.0722 * b
}

/** Rapport de contraste entre deux couleurs, de 1 (identiques) à 21 (noir sur blanc). */
export function contraste(premierPlan: string, arrierePlan: string): number {
  const a = luminance(premierPlan)
  const b = luminance(arrierePlan)
  const [clair, sombre] = a > b ? [a, b] : [b, a]

  return (clair + 0.05) / (sombre + 0.05)
}

/** Seuils WCAG AA. `grand` = 24px, ou 18.66px en gras. */
export const SEUILS_AA = {
  texteNormal: 4.5,
  texteGrand: 3,
  composantGraphique: 3,
} as const
