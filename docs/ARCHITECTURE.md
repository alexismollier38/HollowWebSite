# Architecture

État : lot 1 livré. Ce document décrit ce qui existe, pas ce qui est prévu — le
prévisionnel est dans [PLAN.md](PLAN.md).

## Arborescence

```
app/[locale]/       routes, layouts, métadonnées. Aucune directive `use client`.
app/polices.ts      les deux familles, via next/font/local
app/styles/         theme.css : les tokens Tailwind v4
assets/             sources non servies telles quelles : images, fontes
components/chrome/  barre haute, mentions du bas, gabarit des pages de texte
components/hero/    ce qui n'existe que pour la page d'accueil : braises, parallaxe
components/ui/      primitives sans logique métier (à venir)
features/<domaine>/ logique et vues d'un domaine (à venir, lot 4)
content/            MDX et JSON de lore validés au build (à venir, lot 3)
i18n/               routage, navigation et chargement des messages
lib/                utilitaires purs, schémas, tokens
messages/           fr.json, en.json
e2e/                parcours Playwright, axe-core, captures
scripts/            fontes, empreintes CSP, serveur autonome
```

Deux ajouts au découpage du cahier des charges. `components/chrome/` tient l'ossature —
barre haute, mentions légales, gabarit des pages de texte — qui n'est ni une primitive
ni une section. `components/hero/` tient ce qui n'a de sens que sur la page d'accueil.

`assets/` est distinct de `public/` : ce qui s'y trouve n'est **pas** servi tel quel.
Les images y sont importées statiquement pour que Next en dérive les formats et
l'aperçu flouté, et les fontes y sont déposées par `pnpm fonts`. `public/` reste
réservé aux fichiers accessibles par URL directe.

**Les fontes ne sont pas versionnées.** Clash Display et Satoshi sont sous ITF Free
Font License : auto-hébergement autorisé, redistribution interdite. `scripts/fetch-fonts.mjs`
les récupère depuis l'API Fontshare au premier build et les dépose dans `assets/fonts/`,
ignoré par git. Elles sont ensuite servies depuis notre domaine, donc la CSP reste en
`font-src 'self'`.

## Règles de dépendance, tenues par l'outillage

`eslint-plugin-boundaries` refuse à la compilation :

| Depuis        | Peut importer                                                         |
| ------------- | --------------------------------------------------------------------- |
| `app/`        | tout                                                                  |
| `components/` | `components/`, `lib/`, `i18n/` — **aucun domaine métier**             |
| `features/x/` | `features/x/`, `components/`, `lib/`, `i18n/` — **pas `features/y/`** |
| `lib/`        | `lib/` uniquement : c'est une feuille                                 |
| `i18n/`       | `i18n/`, `lib/`                                                       |

Deux autres règles complètent le dispositif :

- **Aucun texte rédactionnel en dur** : une règle ESLint maison (`eslint.config.mjs`)
  refuse toute phrase de plus de 40 caractères écrite directement dans du JSX. Le
  contenu passe par `messages/` ou `content/`.
- **Navigation localisée obligatoire** : `next/link` et le `usePathname` de
  `next/navigation` sont interdits hors de `i18n/`. Une seule dérogation existe
  aujourd'hui, commentée dans `components/chrome/SelecteurLangue.tsx`.

Les deux règles ont été vérifiées sur un cas de violation réel avant d'être adoptées :
une règle qui ne se déclenche jamais ne protège rien.

## Internationalisation

`next-intl`, FR par défaut sans préfixe (`/`), EN sous `/en`. Les chemins sont
localisés dans `i18n/routing.ts` : la carte `pathnames` grandit à chaque lot, et une
route qui n'y figure pas ne compile pas. Un test compare les deux arbres de messages et
échoue à la première clé manquante d'un côté ou de l'autre.

`NextIntlClientProvider` est monté **sans `messages`**. Il ne transmet que la locale,
dont le composant `Link` de next-intl a besoin : celui-ci appelle `useLocale()` sans
condition, y compris quand on lui passe la locale en propriété — vérifié dans sa
source après un build rouge. Les traductions, elles, restent entièrement côté serveur ;
le surcoût mesuré du fournisseur est de 0,4 Ko.

## Content-Security-Policy : pourquoi des empreintes et pas un nonce

Le cahier des charges demande une **CSP à nonce** (§6) et un **rendu statique** (§7).
La documentation de Next tranche : _« To use a nonce, your page must be dynamically
rendered […] Static pages are generated at build time, when no request or response
headers exist — so no nonce can be injected. »_ Et plus loin : _« Static optimization
and Incremental Static Regeneration (ISR) are disabled. »_

Les deux exigences s'excluent. Ce n'est pas une supposition : la première version du
site posait bien un nonce, et `e2e/securite.spec.ts` a signalé que **tous** les scripts
étaient bloqués par la politique.

Le nonce n'est qu'un moyen ; l'objectif est une CSP sans `unsafe-inline`. La solution
retenue l'atteint autrement :

1. `experimental.sri` fait poser par Next un attribut `integrity` sur les scripts
   externes, au build.
2. `scripts/generer-csp.mjs` calcule les empreintes SHA-256 des scripts en ligne de
   chaque page prérendue (la charge RSC, deux par page) et écrit
   `.next/csp-hashes.json`.
3. `proxy.ts` lit ce manifeste et compose `script-src 'self' 'sha256-…'` pour la page
   servie.

Résultat : pas de `unsafe-inline`, pas de `unsafe-eval`, et le rendu statique conservé.
Deux tests le vérifient à chaque exécution — la politique ne contient aucun mot-clé
permissif, et chaque script en ligne du HTML a bien son empreinte dans l'en-tête.

**Les deux autres options restent ouvertes**, c'est un arbitrage à trancher :

| Option                   | Ce qu'on gagne                  | Ce qu'on perd                                                                                |
| ------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------- |
| **Empreintes** (retenue) | Statique, CSP stricte           | Un script de build à maintenir ; les pages rendues à la demande devront être traitées à part |
| Nonce, rendu dynamique   | La lettre du cahier des charges | Le statique et l'ISR, donc les budgets du §7                                                 |
| `unsafe-inline`          | Simplicité                      | Une CSP qui ne protège plus des scripts injectés                                             |

**Limite connue** : une page rendue à la demande (ISR) produit un HTML inconnu au
build, donc sans empreinte. Le sujet se traite au lot 5, avec les actualités.

## Deux pièges rencontrés, pour ne pas les repayer

- **`Link` de next-intl exige le contexte de locale**, même avec une locale passée en
  propriété. Sans `NextIntlClientProvider`, le prérendu échoue sur « No intl context
  found » sans indiquer le composant fautif.
- **`request.headers.set()` ne fait rien dans `proxy.ts`.** L'objet est protégé et la
  mutation est ignorée sans lever d'erreur. Pour enrichir les en-têtes transmis à
  l'application, il faut reconstruire la requête.
- **Le serveur autonome doit écouter en double pile (`HOSTNAME="::"`).** La réécriture
  de langue de next-intl vise `localhost` ; en IPv4 seule, Next ne se reconnaît pas
  comme destinataire, croit à une cible externe, tente de relayer et fait boucler
  « / » sur lui-même. L'erreur affichée ne parle que de connexion refusée.

## Rendu

FR et EN sont prérendues en statique (`generateStaticParams`). Aucune page n'est
dynamique à ce stade. `proxy.ts` s'exécute sur le runtime Node.
