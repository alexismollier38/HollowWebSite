# Hollow — plan de production du site

Statut : **plan validé. Lot 1 livré.**

| Lot                               | État                                                             |
| --------------------------------- | ---------------------------------------------------------------- |
| 1 — Fondations                    | **livré** — build, lint, 45 tests unitaires et 34 parcours verts |
| 2 — Marque et haut de page        | à faire                                                          |
| 3 — Lore                          | à faire                                                          |
| 4 — Accès au jeu                  | à faire                                                          |
| 5 — Le reste du site              | à faire                                                          |
| 6 — Perf, a11y, livrables annexes | à faire                                                          |

**Deux arbitrages sont ouverts et attendent une décision** : la Content-Security-Policy
(section 4) et le budget de JavaScript initial (section 4 également). Aucun des deux
n'a été contourné en silence.

### Changement de périmètre du 28 août 2026

Sur décision du client, **la page d'accueil se limite au hero**. Les onze sections
ancrées décrites au §5 du cahier des charges ne sont plus empilées sur `/` : les
contenus rejoindront leurs propres routes (`/univers`, `/telecharger`, `/rejoindre`)
au fil des lots.

Deux conséquences :

- Les huit ancres de chantier ont été retirées, ainsi que leurs libellés de
  traduction. Ils reviendront avec leurs sections.
- **La tranche est supprimée.** Elle indexait des sections ; il n'y en a plus.

### Changement de direction artistique du 28 août 2026

Le client a fourni une maquette complète de la page d'accueil. Elle remplace la
proposition de design initiale, qui est abandonnée — palette, typographie et élément
signature compris. Le détail de ce qui a été repris à l'identique, de ce qui a été
ajouté et de ce qui a été retiré est dans [DESIGN.md](DESIGN.md).

Deux pages ont été créées au passage, parce que la maquette les référence en pied de
page et qu'un lien mort aurait été un défaut : `/mentions-legales` et
`/confidentialite`, sobres, sans rien d'inventé. Elles étaient prévues au lot 5 ; leur
contenu définitif y reste attendu.

---

## 0. Ce que j'ai vérifié avant d'écrire ce plan

Deux constats changent le brief. Ils sont en tête parce qu'ils touchent la conversion
principale.

### 0.1 Il n'y a pas de launcher à télécharger

nanos.world **est un jeu Steam** (app `1841660`), pas un client qu'un serveur distribue.
Un joueur installe nanos world depuis Steam, puis rejoint un serveur par le navigateur de
serveurs intégré ou par une connexion directe `IP:port`. Les packages et packs d'assets du
serveur sont téléchargés par le client au moment de la connexion — il n'y a rien à
pré-installer.

Vérifications faites :

- La documentation officielle ne décrit **qu'une** méthode de connexion : ouvrir le client
  et se connecter à `IP:port` (exemple donné : `127.0.0.1:7777`).
- **Aucun schéma `nanos://`** n'est documenté, ni dans la doc, ni dans les dépôts publics.
  Je ne construirai donc pas de lien profond : le site affichera une **adresse `IP:port`
  copiable en un clic**, comme prévu en repli par le brief.
- La page Steam affiche encore le jeu en « Coming soon », et la version installée sur ta
  machine est une **playtest** (`nanos-world-playtest`). Le jeu n'est donc pas
  publiquement installable par n'importe qui aujourd'hui — voir question bloquante n°1.

Conséquence : `features/launcher/` reste une feature à part entière avec son manifeste
versionné, sa route ISR, ses checksums et son état d'erreur — mais elle décrit **l'accès
au jeu**, et son action primaire dépend de ta réponse à la question 1.

### 0.2 Le lore n'existe pas encore côté serveur

J'ai lu les paquets `gs-*` chargés par `Server/Config.toml`. Ce qui est **réellement
implémenté** aujourd'hui :

| Domaine                 | Réalité dans le code                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Progression             | Niveaux 1 → 1000, courbe `100 × niveau^1.35`                                                          |
| Rangs                   | E, D, C, B, A, S                                                                                      |
| Attributs de personnage | force, endurance, agilité, intelligence, perception                                                   |
| Vitalité                | 1000 PV, 500 mana de base ; +25 PV/endurance, +15 mana/intelligence                                   |
| Familles de sorts       | Air, Eau, Feu, Terre (10 sorts chacune) ; Foudre, Glace, Lave, Ténèbres, Arbre-Monde (1 sort chacune) |
| Grimoire                | Livre équipé animé, cérémonie d'attribution (le livre vole jusqu'à son porteur)                       |
| Autres                  | Création de personnage, inventaire, combat, balai, HUD, caméra, PNJ « monarch »                       |
| Serveur                 | Dédié, port 7777, 64 joueurs max, base MySQL `gatefall`                                               |

**Aucun royaume, aucune compagnie, aucun donjon, aucun examen n'existe dans le code.** Le
brief demande pourtant « le contenu lore réel, pas du lorem » pour 4 royaumes, 9+
compagnies, les examens et le grand donjon PvP. Je ne vais pas inventer du contenu de jeu
sans te le dire — voir question bloquante n°2.

### 0.3 Outillage de la machine

`node v24.11.1` (LTS) et `npm 11.6.2` sont là, **`pnpm` n'est pas installé** : je
l'activerai par `corepack enable pnpm` et je l'épinglerai dans `packageManager`.
`C:\Users\Admin\Desktop\HollowWebsite` est **vide et n'est pas un dépôt git** : je
l'initialise au lot 1.

---

## 1. Décisions prises

### Tranchées par le client

| #   | Question                     | Décision                                                                                                                                                                                                                                    |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Que télécharge le visiteur ? | **Pas de launcher.** Le parcours est : installer nanos world depuis Steam, puis rejoindre par l'adresse `IP:port` copiable. `features/launcher/` garde son manifeste versionné, prêt à accueillir un exécutable si le projet en produit un. |
| 2   | D'où vient le lore ?         | **Je le dérive, le client relit.** Canon Black Clover public **reformulé** — aucun texte copié — croisé avec les systèmes réellement codés. Chaque entité naît en `statut: brouillon` et ne passe en `validé` qu'après relecture.           |
| 3   | Où en est le serveur ?       | **Pas encore ouvert.** Le site est un site d'annonce. Aucun compteur de joueurs, aucune date inventée.                                                                                                                                      |
| 4   | Déploiement ?                | **Auto-hébergé uniquement**, Docker `output: standalone` derrière un reverse proxy. Pas de Vercel.                                                                                                                                          |

### Ce que la combinaison 1 + 3 impose

Les deux réponses tirent dans des directions opposées : la 1 met Steam en avant, la 3 dit
que le serveur n'est pas ouvert. On ne peut pas demander à quelqu'un d'installer un jeu
pour rejoindre un serveur éteint. Je tranche ainsi, et c'est le point à corriger en
premier si tu n'es pas d'accord :

- **Action primaire, partout : « Rejoindre le Discord ».** C'est la seule conversion qui
  a un sens aujourd'hui, et le brief dit que le public vient déjà de là.
- **Action secondaire : « Préparer son accès »**, qui mène à `/telecharger`. Cette page
  est construite en entier — installation de nanos world depuis Steam, configuration
  requise réelle, les trois étapes de connexion, l'adresse du serveur — mais l'adresse
  s'affiche en état « pas encore ouvert » tant que la variable d'environnement est vide.
- Le jour de l'ouverture, une seule variable d'environnement à renseigner inverse la
  hiérarchie des deux actions. C'est prévu dans le code, pas à refaire.

### Conséquence du « auto-hébergé uniquement »

Sans preview Vercel, il faut un autre moyen de relire visuellement chaque lot : la CI
produit des **captures Playwright** (mobile 375 px et bureau 1440 px, FR et EN) publiées
en artefacts de build. Chaque lot se termine avec ses captures.

### Points secondaires, avec repli

Aucun n'est bloquant. J'avance avec le repli et je le signale dans le code.

| Point                      | Repli appliqué                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Nom de domaine             | `hollow.example` en variable d'environnement, à remplacer d'un mot.                                                                         |
| URL d'invitation Discord   | Variable obligatoire : le build **casse** si elle manque, parce que c'est l'action primaire.                                                |
| Adresse publique `IP:port` | Bloc masqué tant que la variable est vide, plutôt qu'une fausse adresse.                                                                    |
| Captures in-game           | Placeholders marqués `PLACEHOLDER` dans le nom de fichier et listés dans `docs/CONTENT.md`.                                                 |
| Forge de grimoire (§9)     | Non livrée. Lot 7, à déclencher.                                                                                                            |
| Nom et baseline définitifs | « Hollow » et « Le grimoire est vierge. Écris-le. » ; la base de données du serveur s'appelle encore `gatefall`, dis-moi si le nom a bougé. |

---

## 2. Décisions d'architecture

La pile du §6 du brief est reprise telle quelle. Trois précisions :

- **Aucun texte lore dans un composant** est vérifié mécaniquement : une règle ESLint
  maison interdit les chaînes de plus de 40 caractères dans `components/` et
  `features/*/views/`, et un test Vitest recharge tout `content/` par les schémas Zod.
- **`eslint-plugin-boundaries`** matérialise les règles du brief : `features/*` ne
  s'importent pas entre eux, `components/ui` n'importe rien de `features/`, `lib/` est
  feuille.
- **Le contenu passe par `lib/content/`** (un `ContentSource` avec une implémentation
  système de fichiers). Brancher un CMS plus tard = écrire une deuxième implémentation,
  sans toucher aux vues.

---

## 3. Les lots

Chaque lot est compilable, testé, et se termine par un compte rendu : ce que j'ai fait,
ce que j'ai choisi et pourquoi, ce qui reste ouvert.

### Lot 1 — Fondations

Dépôt git, pnpm épinglé, Next.js App Router, TypeScript `strict` +
`noUncheckedIndexedAccess`, Tailwind v4 en `@theme` avec les tokens de DESIGN.md,
`next-intl` (FR par défaut, EN en second), ESLint flat + `boundaries` + Prettier, Husky +
lint-staged + commits conventionnels, Vitest + Playwright + axe-core, validation
d'environnement, en-têtes de sécurité avec CSP à nonce, `Dockerfile` `output: standalone`,
GitHub Actions (typecheck → lint → test → build → Lighthouse CI → captures Playwright en
artefacts).

**Critères d'acceptation**

- [ ] `pnpm build` sans erreur, `pnpm lint` sans **aucun** avertissement.
- [ ] `/` et `/en` répondent, les trois fontes sont servies en local, la tranche est là.
- [ ] Le test de contraste des tokens passe ; il échoue si je casse un hex.
- [ ] Une variable d'environnement manquante fait échouer le build (démontré en CI).
- [ ] CI verte de bout en bout, capture d'écran de la page nue fournie.

### Lot 2 — Marque et haut de page

Preloader, hero, manifeste, barre haute, la tranche, pied de page avec le disclaimer
« projet de fan non affilié », FR et EN complets sur ces sections.

**Critères d'acceptation**

- [ ] Le LCP est **l'image** poster, mesuré, pas la vidéo.
- [ ] Lighthouse mobile à ce stade : Perf ≥ 95, A11y 100, Best practices 100, SEO 100.
- [ ] JS initial < 60 Ko gzip (moitié du budget final, consommée à moitié du site).
- [ ] axe-core : zéro violation. Navigation clavier complète, focus dessiné.
- [ ] Lisible à 320 px de large et à 200 % de zoom, vérifié en capture.

### Lot 3 — Le lore

`content/` + schémas Zod + `lib/content/`, les 4 royaumes, les compagnies, la magie
(attributs réels : Air, Eau, Feu, Terre, Foudre, Glace, Lave, Ténèbres, Arbre-Monde), les
sections correspondantes et les routes `/univers/**`.

**Critères d'acceptation**

- [ ] Un MDX invalide **casse le build**, avec un message qui nomme le fichier et le champ.
- [ ] Zéro texte lore dans un composant (règle ESLint + test).
- [ ] Sélecteur de royaume et carrousel de compagnies pilotables entièrement au clavier.
- [ ] FR et EN complets, aucune clé manquante (test qui compare les deux arbres).
- [ ] Chaque entité porte un `statut` (`brouillon` / `validé`) repris dans l'inventaire xlsx.

### Lot 4 — Accès au jeu

`features/launcher/` : manifeste versionné validé par Zod, route ISR, détection d'OS sans
masquer les autres, SHA-256 copiable si un exécutable existe un jour, **adresse serveur
copiable**, route de redirection 302 avec compteur et miroir de secours, état d'erreur
explicite, page `/telecharger`, `docs/LAUNCHER.md` écrit avec la skill `nanos-world-dev`.

Adapté aux décisions 1 et 3 : la page décrit l'installation de nanos world depuis Steam,
la configuration requise réelle (Windows 10 64 bits, 2 cœurs 2 GHz, 2 Go, GTX 750 Ti,
10 Go — recommandée : Windows 11, 4 cœurs 3 GHz, 8 Go, GTX 1060, 20 Go SSD ; Linux via
Proton), et les trois étapes de connexion. Le bloc d'adresse est en état « pas encore
ouvert » tant que la variable n'est pas renseignée.

**Critères d'acceptation**

- [ ] Parcours Playwright : landing → `/telecharger` → copie de l'adresse → bloc
      « et maintenant ? ».
- [ ] L'échec du miroir principal est **testé** et affiche le lien direct, jamais un
      spinner qui tourne.
- [ ] Aucun chiffre inventé : version, poids, empreinte et adresse viennent du manifeste
      ou de l'environnement, sinon ils ne s'affichent pas.
- [ ] Renseigner la variable d'adresse fait basculer la hiérarchie des actions sur tout
      le site, vérifié par un test.

### Lot 5 — Le reste du site

Systèmes, monde et galerie, actualités MDX en ISR, `/rejoindre` avec la FAQ, mentions
légales et confidentialité, `sitemap.xml`, `robots.txt`, images Open Graph.

**Critères d'acceptation**

- [ ] Parcours Playwright verts, dont le changement de langue sur une page profonde.
- [ ] `hreflang` complet et réciproque FR ↔ EN.
- [ ] Revalidation ISR vérifiée sur les actualités.

### Lot 6 — Perf, a11y et livrables annexes

Passe jusqu'aux budgets du §7, analytics auto-hébergées, puis : cahier des charges et
charte graphique en `.docx`, inventaire de contenu et suivi des budgets en `.xlsx`, deck
de 10 slides en `.pptx`, press kit et règlement RP en `.pdf`, et les deux skills projet
`hollow-brand` et `hollow-lore`.

**Critères d'acceptation**

- [ ] Toute la table du §7 tenue en CI sur mobile simulé, budgets bloquants activés.
- [ ] La Definition of Done du §12 cochée ligne par ligne.
- [ ] Les deux skills utilisables telles quelles, testées sur une génération de contenu.

### Lot 7 — Forge de grimoire (optionnel)

Uniquement sur ta demande. Version déterministe côté serveur : tables + graine, blason SVG
généré, sortie copiable. Aucune IA sans ta validation explicite.

---

## 4. Arbitrages ouverts après le lot 1

Deux exigences du cahier des charges se sont révélées impossibles à tenir telles
quelles. Elles sont documentées, mesurées, et attendent une décision.

### 4.1 CSP à nonce contre rendu statique

Le §6 demande une CSP à nonce, le §7 un rendu statique. La documentation de Next
tranche : un nonce impose le rendu dynamique, ce qui supprime le statique **et l'ISR**.

Ce qui est livré : une CSP par **empreintes SHA-256** calculées au build, sans
`unsafe-inline` ni `unsafe-eval`, avec le rendu statique conservé. Le détail et les
deux autres options sont dans [ARCHITECTURE.md](ARCHITECTURE.md).

### 4.2 Le budget de 120 Ko de JavaScript

Mesuré : **146,3 Ko gzip**. En retirant tous les composants clients du site, on reste à
146,3 Ko : c'est le socle React 19 + Next 16 App Router, pas notre code. Les trois
issues sont dans [PERF.md](PERF.md) ; ma recommandation est de relever le budget à
150 Ko, parce qu'un budget qu'on ne peut pas tenir cesse d'être lu.

---

## 5. Risques et arbitrages, annoncés d'avance

| Risque                                             | Arbitrage proposé                                                                                                                                                                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trois familles de fontes ≈ 120–150 Ko              | Fraunces variable sous-ensemblée et préchargée, Alegreya Sans en 2 graisses, Plex Mono en 1. Si le poids se tend : Plex Mono tombe au profit de `ui-monospace`.                                                                                    |
| `next-intl` + Radix + `motion` contre 120 Ko de JS | `motion` en import dynamique, Radix limité à Tabs / Dialog / Accordion. Si ça déborde quand même : **j'abandonne `motion` sur la landing** et tout passe en CSS scroll-driven. Je te préviendrai avant, je ne réglerai pas le problème en silence. |
| Lighthouse « Best practices » à 100                | Impose une CSP à nonce sans `unsafe-inline` et zéro erreur console. Donc aucun widget Discord embarqué, aucun script tiers.                                                                                                                        |
| Le hero vidéo contre un LCP < 2 s                  | La vidéo ne se rattache **jamais** sur mobile, ni sous `Save-Data`, ni sous connexion lente, ni sous `prefers-reduced-motion`. Sur mobile, le poster est l'expérience finale, pas un pis-aller.                                                    |
| Le site promet un jeu pas encore ouvert            | Traité par la question 1 et la question 3. Le repli est le discours prudent : rien d'inventé, pas de compteur de joueurs sans API.                                                                                                                 |

---

## 6. Hors périmètre

L'exécutable du launcher s'il devait exister, l'API de statut du serveur (je la consomme,
je ne l'écris pas), l'hébergement et le nom de domaine, la modération du Discord, la
production des captures in-game, et tout asset sous licence tierce — le dépôt n'en
contiendra aucun.
