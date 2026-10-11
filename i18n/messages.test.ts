import {describe, expect, it} from 'vitest'
import en from '../messages/en.json'
import fr from '../messages/fr.json'
import {routing} from './routing'

/** Aplatit un arbre de messages en chemins pointés : `pied.disclaimer`, etc. */
function clefs(objet: unknown, prefixe = ''): string[] {
  if (typeof objet !== 'object' || objet === null) {
    return [prefixe]
  }

  return Object.entries(objet).flatMap(([clef, valeur]) =>
    clefs(valeur, prefixe === '' ? clef : `${prefixe}.${clef}`),
  )
}

const clefsFr = clefs(fr).sort()
const clefsEn = clefs(en).sort()

describe('parité des traductions', () => {
  it('les deux langues déclarées ont un fichier', () => {
    expect(routing.locales).toEqual(['fr', 'en'])
  })

  it('aucune clé française ne manque en anglais', () => {
    expect(clefsFr.filter((clef) => !clefsEn.includes(clef))).toEqual([])
  })

  it('aucune clé anglaise ne traîne sans équivalent français', () => {
    expect(clefsEn.filter((clef) => !clefsFr.includes(clef))).toEqual([])
  })

  it('aucune valeur vide', () => {
    const vides = Object.entries({fr, en}).flatMap(([langue, arbre]) =>
      clefs(arbre)
        .filter((clef) => {
          const valeur = clef
            .split('.')
            .reduce<unknown>(
              (noeud, part) => (noeud as Record<string, unknown> | undefined)?.[part],
              arbre,
            )
          return typeof valeur === 'string' && valeur.trim() === ''
        })
        .map((clef) => `${langue}:${clef}`),
    )

    expect(vides).toEqual([])
  })
})

describe('toute route localisée a ses deux versions', () => {
  it.each(Object.entries(routing.pathnames))('%s', (_interne, externe) => {
    if (typeof externe === 'string') {
      return
    }

    for (const locale of routing.locales) {
      expect(externe[locale], `chemin manquant pour « ${locale} »`).toBeTruthy()
    }
  })
})
