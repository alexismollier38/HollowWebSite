import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {describe, expect, it} from 'vitest'
import {contraste, SEUILS_AA} from './contraste'
import {braises, fonds, palette, royaumes, textes} from './palette'

const css = readFileSync(
  fileURLToPath(new URL('../../app/styles/theme.css', import.meta.url)),
  'utf8',
)

describe('la palette et le CSS ne divergent pas', () => {
  it.each(Object.entries(palette))('%s est déclaré dans theme.css', (nom, valeur) => {
    expect(
      css.toLowerCase().includes(valeur.toLowerCase()),
      `${nom} vaut « ${valeur} » dans palette.ts mais ne se trouve pas dans app/styles/theme.css`,
    ).toBe(true)
  })
})

describe('contrastes de texte (AA, seuil 4,5)', () => {
  const couples: ReadonlyArray<readonly [string, string, string]> = [
    ['parchemin sur encre', textes.parchemin, fonds.encre],
    ['parchemin vif sur encre', textes.parcheminVif, fonds.encre],
    ['estompe clair sur encre', textes.estompeClair, fonds.encre],
    ['estompe sur encre', textes.estompe, fonds.encre],
    // Les voiles descendent jusqu'à ce noir-là : le texte doit y tenir aussi.
    ['parchemin sur voile', textes.parchemin, fonds.voile],
    ['estompe sur voile', textes.estompe, fonds.voile],
  ]

  it.each(couples)('%s', (_nom, premierPlan, arrierePlan) => {
    expect(contraste(premierPlan, arrierePlan)).toBeGreaterThanOrEqual(
      SEUILS_AA.texteNormal,
    )
  })
})

describe('contrastes non textuels (AA, seuil 3)', () => {
  it('la braise est perceptible sur l’encre — c’est l’anneau de focus', () => {
    expect(contraste(braises.braise, fonds.encre)).toBeGreaterThanOrEqual(
      SEUILS_AA.composantGraphique,
    )
  })

  it('la braise vive se voit sur l’encre — ce sont les particules', () => {
    expect(contraste(braises.braiseVif, fonds.encre)).toBeGreaterThanOrEqual(
      SEUILS_AA.composantGraphique,
    )
  })
})

describe('teintes de royaume, en réserve pour le lot 3', () => {
  it.each(Object.entries(royaumes))('%s.texte sur encre', (_slug, teintes) => {
    expect(contraste(teintes.texte, fonds.encre)).toBeGreaterThanOrEqual(
      SEUILS_AA.texteNormal,
    )
  })

  it.each(Object.entries(royaumes))('%s.trait sur encre', (_slug, teintes) => {
    expect(contraste(teintes.trait, fonds.encre)).toBeGreaterThanOrEqual(
      SEUILS_AA.composantGraphique,
    )
  })
})

describe('le calcul de contraste lui-même', () => {
  it('noir sur blanc vaut 21', () => {
    expect(contraste('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
  })

  it('une couleur avec elle-même vaut 1', () => {
    expect(contraste('#AA3D2A', '#AA3D2A')).toBeCloseTo(1, 5)
  })

  it('OKLCH et hexadécimal se rejoignent sur le noir et le blanc', () => {
    expect(contraste('oklch(1 0 0)', 'oklch(0 0 0)')).toBeCloseTo(21, 1)
  })

  it('refuse une couleur invalide plutôt que de renvoyer un nombre faux', () => {
    expect(() => contraste('#ZZZZZZ', '#000000')).toThrow()
    expect(() => contraste('oklch(pas une couleur)', '#000000')).toThrow()
  })
})
