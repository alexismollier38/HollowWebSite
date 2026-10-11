/**
 * Calcule les empreintes SHA-256 des scripts en ligne de chaque page prérendue.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Le cahier des charges demande une CSP à nonce et un rendu statique. La
 * documentation de Next tranche : « To use a nonce, your page must be dynamically
 * rendered […] Static pages are generated at build time, when no request or response
 * headers exist — so no nonce can be injected. » Les deux exigences s'excluent.
 *
 * Le nonce n'est qu'un moyen : le but est une CSP sans `unsafe-inline`. Une empreinte
 * l'atteint aussi, et se calcule au build — donc sans sacrifier le statique.
 *
 * Next émet deux scripts en ligne par page (la charge RSC, `self.__next_f.push`). Ils
 * sont identiques d'un chargement à l'autre pour une page prérendue : les hacher est
 * exact, pas approximatif. Les scripts externes, eux, sont déjà couverts par
 * `experimental.sri`, qui leur pose un attribut `integrity`.
 *
 * LIMITE CONNUE
 * -------------
 * Une page rendue à la demande (ISR, dynamique) produit un HTML inconnu au build :
 * ses empreintes manqueront. Le sujet se traite au lot 5, quand les actualités
 * arriveront — voir docs/ARCHITECTURE.md.
 */
import {createHash} from 'node:crypto'
import {readdir, readFile, writeFile} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import {dirname, join, relative} from 'node:path'
import {fileURLToPath} from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const pagesPrerendues = join(racine, '.next', 'server', 'app')
const destination = join(racine, '.next', 'csp-hashes.json')

if (!existsSync(pagesPrerendues)) {
  console.error('Aucune page prérendue trouvée. Lance `pnpm build` d’abord.')
  process.exit(1)
}

/** Tous les .html sous un dossier, chemins absolus. */
async function parcourir(dossier) {
  const entrees = await readdir(dossier, {withFileTypes: true})

  const listes = await Promise.all(
    entrees.map(async (entree) => {
      const chemin = join(dossier, entree.name)

      if (entree.isDirectory()) {
        return parcourir(chemin)
      }

      return entree.name.endsWith('.html') ? [chemin] : []
    }),
  )

  return listes.flat()
}

/** Les corps des <script> sans attribut `src`. */
function scriptsEnLigne(html) {
  const corps = []
  const motif = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g

  let trouve = motif.exec(html)

  while (trouve !== null) {
    if (trouve[1] !== undefined && trouve[1] !== '') {
      corps.push(trouve[1])
    }
    trouve = motif.exec(html)
  }

  return corps
}

const fichiers = await parcourir(pagesPrerendues)
const manifeste = {}

for (const fichier of fichiers) {
  // .next/server/app/fr.html -> /fr ; .next/server/app/index.html -> /
  const relatif = relative(pagesPrerendues, fichier).replaceAll('\\', '/')
  const route = `/${relatif.replace(/\.html$/, '').replace(/(^|\/)index$/, '')}` || '/'

  const html = await readFile(fichier, 'utf8')

  const empreintes = scriptsEnLigne(html).map(
    (corps) => `'sha256-${createHash('sha256').update(corps, 'utf8').digest('base64')}'`,
  )

  if (empreintes.length > 0) {
    manifeste[route] = [...new Set(empreintes)]
  }
}

await writeFile(destination, `${JSON.stringify(manifeste, null, 2)}\n`, 'utf8')

const total = Object.values(manifeste).reduce((somme, liste) => somme + liste.length, 0)
console.log(
  `${total} empreintes de scripts en ligne pour ${Object.keys(manifeste).length} pages.`,
)
