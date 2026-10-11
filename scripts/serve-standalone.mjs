/**
 * Sert la sortie `output: 'standalone'`, exactement comme le fera l'image Docker.
 *
 * `next start` refuse de démarrer sur une sortie autonome, et c'est une bonne chose :
 * ça oblige les tests de bout en bout à s'exécuter contre l'artefact réellement livré,
 * pas contre un serveur de développement qui n'existera nulle part en production.
 *
 * Next ne recopie pas `.next/static` ni `public` dans la sortie autonome — le
 * Dockerfile le fait, ce script aussi.
 */
import {spawn} from 'node:child_process'
import {cp, mkdir} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const autonome = join(racine, '.next', 'standalone')

if (!existsSync(join(autonome, 'server.js'))) {
  console.error('Sortie autonome absente. Lance `pnpm build` d’abord.')
  process.exit(1)
}

await mkdir(join(autonome, '.next'), {recursive: true})
await cp(join(racine, '.next', 'static'), join(autonome, '.next', 'static'), {
  recursive: true,
})

// Le manifeste d'empreintes CSP est lu à l'exécution par proxy.ts.
await cp(
  join(racine, '.next', 'csp-hashes.json'),
  join(autonome, '.next', 'csp-hashes.json'),
)

if (existsSync(join(racine, 'public'))) {
  await cp(join(racine, 'public'), join(autonome, 'public'), {recursive: true})
}

/*
 * Écoute en double pile (`::`), et ce n'est pas cosmétique.
 *
 * Le routage de langue de next-intl réécrit « / » vers « /fr ». Next construit cette
 * réécriture avec l'hôte `localhost`. Si le serveur n'écoute qu'en IPv4, `localhost`
 * se résout d'abord en `::1`, Next ne se reconnaît pas comme destinataire, croit à une
 * cible externe, tente de relayer la requête, échoue — et retombe sur une redirection
 * de « / » vers « / ». Boucle infinie, et un message d'erreur qui ne parle que de
 * connexion refusée. La même précaution vaut dans le conteneur.
 */
const serveur = spawn(process.execPath, [join(autonome, 'server.js')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT ?? '3000',
    HOSTNAME: process.env.HOSTNAME ?? '::',
  },
})

serveur.on('exit', (code) => process.exit(code ?? 0))
