/**
 * Récupère les fontes du site depuis Fontshare, la source officielle.
 *
 * POURQUOI UN TÉLÉCHARGEMENT ET PAS DES FICHIERS VERSIONNÉS
 * ---------------------------------------------------------
 * Clash Display et Satoshi appartiennent à l'Indian Type Foundry et sont diffusées
 * sous la ITF Free Font License. Cette licence autorise l'usage commercial et
 * l'auto-hébergement par `@font-face` — c'est ce que fait ce site — mais interdit de
 * **redistribuer** les fichiers. Les committer dans un dépôt qui peut devenir public
 * serait précisément cela.
 *
 * Les fichiers sont donc absents du dépôt (.gitignore) et récupérés au build depuis
 * l'API Fontshare. Ils sont ensuite servis depuis notre propre domaine : aucun appel
 * à un tiers au chargement de la page, et la CSP reste en `font-src 'self'`.
 *
 * Le téléchargement est ignoré si les fichiers sont déjà là : un build hors ligne
 * fonctionne dès lors qu'on a construit une fois.
 */
import {mkdir, writeFile} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const destination = join(racine, 'assets', 'fonts')

/** Ce que le site utilise réellement, et rien de plus. */
const familles = [
  {famille: 'satoshi', graisse: 400, fichier: 'Satoshi-400.woff2'},
  {famille: 'satoshi', graisse: 500, fichier: 'Satoshi-500.woff2'},
  {famille: 'clash-display', graisse: 400, fichier: 'ClashDisplay-400.woff2'},
]

const manquantes = familles.filter(({fichier}) => !existsSync(join(destination, fichier)))

if (manquantes.length === 0) {
  console.log('Fontes déjà présentes dans assets/fonts/.')
  process.exit(0)
}

await mkdir(destination, {recursive: true})

/*
 * Une requête par famille. Grouper les deux dans une seule URL fait taire l'API sur
 * la seconde — l'encodage des `f[]` répétés ne survit pas au passage. Deux appels
 * coûtent quelques millisecondes et ne mentent pas.
 */
let css = ''

for (const famille of new Set(manquantes.map((f) => f.famille))) {
  const graisses = manquantes
    .filter((f) => f.famille === famille)
    .map((f) => f.graisse)
    .join(',')

  const url = `https://api.fontshare.com/v2/css?f%5B%5D=${famille}@${graisses}&display=swap`

  try {
    const reponse = await fetch(url, {headers: {'user-agent': 'hollow-site/build'}})

    if (!reponse.ok) {
      throw new Error(`HTTP ${reponse.status}`)
    }

    css += await reponse.text()
  } catch (erreur) {
    console.error(
      `Impossible de joindre Fontshare pour ${famille} (${erreur.message}).\n` +
        'Télécharge Clash Display et Satoshi depuis https://www.fontshare.com,\n' +
        `puis dépose les .woff2 dans ${destination} sous les noms attendus :\n  ` +
        familles.map((f) => f.fichier).join('\n  '),
    )
    process.exit(1)
  }
}

/** Découpe la feuille en blocs @font-face pour rattacher chaque URL à sa graisse. */
const blocs = css.split('@font-face').slice(1)

for (const {famille, graisse, fichier} of manquantes) {
  const nomCss = famille === 'clash-display' ? 'Clash Display' : 'Satoshi'

  const bloc = blocs.find(
    (candidat) =>
      candidat.includes(`font-family: '${nomCss}'`) &&
      new RegExp(`font-weight:\\s*${graisse}\\b`).test(candidat),
  )

  const lien = bloc?.match(/url\('(\/\/[^']+\.woff2)'\)/)?.[1]

  if (lien === undefined) {
    console.error(`Bloc @font-face introuvable pour ${nomCss} ${graisse}.`)
    process.exit(1)
  }

  const reponse = await fetch(`https:${lien}`)

  if (!reponse.ok) {
    console.error(`Téléchargement échoué pour ${fichier} : HTTP ${reponse.status}`)
    process.exit(1)
  }

  const octets = Buffer.from(await reponse.arrayBuffer())
  await writeFile(join(destination, fichier), octets)

  console.log(`${fichier} — ${Math.round(octets.length / 1024)} Ko`)
}
