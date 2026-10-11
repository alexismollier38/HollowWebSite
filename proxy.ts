import {existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import createMiddleware from 'next-intl/middleware'
import type {NextRequest} from 'next/server'
import {routing} from '@/i18n/routing'

/**
 * `proxy.ts` remplace `middleware.ts` depuis Next 16.
 *
 * Deux métiers : le routage de langue, et la Content-Security-Policy.
 *
 * POURQUOI DES EMPREINTES ET PAS UN NONCE
 * ---------------------------------------
 * Le cahier des charges demande une CSP à nonce (§6) et un rendu statique (§7). Ces
 * deux exigences s'excluent : Next n'injecte un nonce que pendant un rendu par
 * requête, et une page prérendue n'en a pas. On l'a vérifié plutôt que de le supposer —
 * `e2e/securite.spec.ts` a d'abord signalé tous les scripts bloqués par la politique.
 *
 * Le nonce n'était qu'un moyen ; l'objectif est une CSP sans `unsafe-inline`. Les
 * empreintes SHA-256 des scripts en ligne, calculées au build par
 * `scripts/generer-csp.mjs`, l'atteignent en gardant le statique. Les scripts externes
 * sont couverts par `experimental.sri`.
 *
 * L'arbitrage est ouvert : voir docs/ARCHITECTURE.md pour les deux autres options.
 */

const routageI18n = createMiddleware(routing)

const enDeveloppement = process.env.NODE_ENV !== 'production'

type ManifesteCsp = Record<string, readonly string[]>

let manifeste: ManifesteCsp | null = null

/** Le manifeste est lu une fois, puis gardé en mémoire du processus. */
function chargerManifeste(): ManifesteCsp {
  if (manifeste !== null) {
    return manifeste
  }

  const fichier = join(process.cwd(), '.next', 'csp-hashes.json')

  manifeste = existsSync(fichier)
    ? (JSON.parse(readFileSync(fichier, 'utf8')) as ManifesteCsp)
    : {}

  return manifeste
}

function construireCsp(empreintes: readonly string[], enHttps: boolean): string {
  /*
   * ⚠️ En développement, on n'envoie **aucune** empreinte.
   *
   * Turbopack et React injectent du script en ligne qui change à chaque rechargement :
   * il faut `unsafe-inline`. Mais la règle CSP niveau 3 est sans appel — dès qu'une
   * empreinte ou un nonce figure dans la directive, `unsafe-inline` est ignoré. Mélanger
   * les deux revenait donc à bloquer tous les scripts en ligne du serveur de dev, et
   * l'application ne s'hydratait plus du tout. Le symptôme est trompeur : la page
   * s'affiche normalement, seul l'interactif est mort.
   */
  const scripts = enDeveloppement
    ? ["'self'", "'unsafe-eval'", "'unsafe-inline'"].join(' ')
    : ["'self'", ...empreintes].join(' ')

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // `unsafe-inline` ne concerne ici que les attributs `style` posés par React,
    // jamais les scripts.
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scripts}`,
    "connect-src 'self'",
    "media-src 'self'",
  ]

  /*
   * `upgrade-insecure-requests` n'a de sens que si la page est déjà servie en HTTPS.
   * Posée sur une réponse HTTP — derrière un reverse proxy qui termine TLS plus haut,
   * ou en test local — elle force les sous-ressources vers un HTTPS inexistant et
   * casse la page. C'est le test de console qui l'a signalé.
   */
  if (enHttps) {
    directives.push('upgrade-insecure-requests')
  }

  return directives.join('; ')
}

/**
 * Quelle page a réellement été rendue ? next-intl réécrit « / » vers « /fr » ; c'est
 * le chemin d'arrivée qui porte les scripts, pas celui demandé.
 */
function cheminRendu(request: NextRequest, reecriture: string | null): string {
  if (reecriture === null) {
    return request.nextUrl.pathname
  }

  try {
    return new URL(reecriture).pathname
  } catch {
    return reecriture
  }
}

export default function proxy(request: NextRequest) {
  const reponse = routageI18n(request)

  const chemin = cheminRendu(request, reponse.headers.get('x-middleware-rewrite'))
  const manifesteCsp = enDeveloppement ? {} : chargerManifeste()

  const empreintes = [
    ...(manifesteCsp[chemin] ?? []),
    // La page 404 peut être servie sur n'importe quel chemin : ses empreintes
    // accompagnent toutes les réponses, ça ne coûte que deux valeurs.
    ...(manifesteCsp['/_not-found'] ?? []),
  ]

  // Derrière un reverse proxy, c'est `x-forwarded-proto` qui dit la vérité.
  const enHttps =
    request.headers.get('x-forwarded-proto') === 'https' ||
    request.nextUrl.protocol === 'https:'

  reponse.headers.set(
    'content-security-policy',
    construireCsp([...new Set(empreintes)], enHttps),
  )

  return reponse
}

export const config = {
  /*
   * Tout sauf les fichiers internes de Next, les fichiers statiques et les images
   * optimisées. Le motif exclut aussi tout chemin qui porte un point (un fichier).
   */
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
