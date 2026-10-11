# Performance — mesures et arbitrages

Mesures du lot 1, prises sur la sortie autonome réelle (`pnpm build` puis
`pnpm start`), pas sur un serveur de développement.

## Budgets du cahier des charges

| Métrique                                        | Budget                 | État au lot 1                                                                                                    |
| ----------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| LCP (mobile, 4G simulée)                        | < 2,0 s                | L'image du hero est en place ; mesure Lighthouse au prochain lot                                                 |
| INP                                             | < 200 ms               | À mesurer au lot 2                                                                                               |
| CLS                                             | < 0,05                 | À mesurer au lot 2                                                                                               |
| **JS initial (gzip, landing)**                  | **< 120 Ko**           | **146,3 Ko — dépassé, voir ci-dessous**                                                                          |
| Poids total au-dessus de la ligne de flottaison | < 900 Ko               | ~294 Ko (JS 146 + images 71 + fontes 66 + CSS 5 + HTML 6) — la vidéo est hors ligne de flottaison, voir plus bas |
| Lighthouse Perf / A11y / BP / SEO               | ≥ 95 / 100 / 100 / 100 | Vérifié en CI à partir du lot 2                                                                                  |

## Le budget JS ne tient pas, et il ne tiendra pas

**146,3 Ko gzip** pour la page d'accueil, contre 120 Ko demandés. Avant de proposer
quoi que ce soit, j'ai mesuré le plancher : en retirant **tous** les composants clients
du site — plus de tranche, plus de bascule de langue, plus une seule directive
`use client` — le total reste **146,3 Ko**.

Autrement dit : la tranche et la bascule de langue coûtent **0 Ko**. Les 146 Ko sont le
socle React 19.2 + Next 16 App Router, et il n'y a rien à optimiser dedans.

Détail des morceaux servis à un navigateur moderne :

| Morceau                                     | Poids gzip                                         |
| ------------------------------------------- | -------------------------------------------------- |
| Runtime React + réconciliateur              | 69,8 Ko                                            |
| Runtime App Router (routage, préchargement) | 45,8 Ko                                            |
| Chargeur de routes                          | 14,1 Ko                                            |
| Amorce Turbopack                            | 3,7 Ko                                             |
| Divers (page, layout)                       | 12,9 Ko                                            |
| **Total moderne**                           | **146,3 Ko**                                       |
| _Bundle hérité `noModule`_                  | _38,6 Ko, jamais chargé par un navigateur moderne_ |

### Trois issues, à trancher

1. **Relever le budget à 150 Ko.** C'est ce que la pile impose ; le budget de 120 Ko
   aurait été tenable avec un framework à hydratation partielle, pas avec App Router.
   Recommandé : le budget devient vrai, donc utile.
2. **Garder 120 Ko et changer de pile** (Astro, ou Next en Pages Router allégé). Le
   cahier des charges dit la pile non négociable, donc cette issue suppose de rouvrir
   le §6.
3. **Garder 120 Ko et laisser la CI rouge.** À éviter : un budget durablement violé
   cesse d'être lu.

En attendant l'arbitrage, `lighthouserc.json` bloque à **160 Ko** — la mesure plus une
marge de 10 %, ce qui détecte une régression réelle sans échouer dès le premier jour.
Ce n'est pas le budget du cahier des charges, et ce fichier est le seul endroit où
l'écart est encodé.

## Fontes : 66 Ko

| Fichier                  | Poids   | Préchargée |
| ------------------------ | ------- | ---------- |
| `ClashDisplay-400.woff2` | 15,1 Ko | oui        |
| `Satoshi-400.woff2`      | 24,9 Ko | oui        |
| `Satoshi-500.woff2`      | 25,0 Ko | oui        |

Trois fichiers, et c'est tout ce que la page utilise. Le mot-symbole étant une image,
aucune graisse d'affichage n'est nécessaire pour le titre.

La direction artistique précédente en coûtait 183 Ko, dont 121 pour la seule Fraunces
variable. Le changement de direction a donc rendu 117 Ko au budget.

Les fichiers ne sont pas versionnés : licence ITF, redistribution interdite. `pnpm
fonts` les récupère depuis Fontshare au premier build.

## Images du hero : 71 Ko

| Image          | Servie en             | Poids à 1080 px |
| -------------- | --------------------- | --------------- |
| Poster du hero | AVIF                  | 30,7 Ko         |
| Mot-symbole    | AVIF avec canal alpha | 40,0 Ko         |

Les deux sont préchargées, et exactement les deux : la page ne contient pas d'autre
image, et les deux sont au-dessus de la ligne de flottaison. Un troisième
préchargement entrerait en concurrence avec le LCP — un test le refuse.

Le mot-symbole coûte plus cher que le poster malgré sa taille : l'AVIF avec canal
alpha compresse moins bien, et le dessin métallique est riche en dégradés.

## Vidéo de fond : 2,71 Mo, et jamais avant que tout le reste soit là

| Rendu                                   | Poids   | Pour qui                               |
| --------------------------------------- | ------- | -------------------------------------- |
| `hero.webm` — AV1, 2560 × 1442, 5,04 s  | 2,71 Mo | Tous les navigateurs récents           |
| `hero.mp4` — H.264, 1920 × 1082, 5,04 s | 4,25 Mo | Le repli, Safari < 17 pour l'essentiel |

**Elle ne compte pas dans le poids au-dessus de la ligne de flottaison, et c'est
délibéré.** Le LCP est le poster, une image préchargée. La vidéo n'existe même pas dans
le HTML servi : elle est montée par JavaScript après `requestIdleCallback`, donc une
fois que le navigateur n'a plus rien d'autre à faire, puis se fond par-dessus le poster.
Si elle échoue, le poster reste et personne ne le remarque.

Quatre situations où elle n'est jamais demandée :

- `prefers-reduced-motion: reduce`
- `prefers-reduced-data: reduce` ou `navigator.connection.saveData`
- connexion annoncée en 3G ou moins
- écran de moins de 768 px — c'est-à-dire **tout le mobile**, d'où vient la majorité
  du public

**C'est un poids assumé, pas une négligence.** Le client a demandé la qualité, et 2,7 Mo
différés sur un visiteur de bureau en bonne connexion ne touchent ni le LCP, ni l'INP,
ni le CLS. Une version à 1600 px pesait 822 Ko et restait honnête sous les voiles : les
commandes pour y revenir sont dans `assets/images/README.md`, c'est un paramètre à
changer.

Le montage ouvre et ferme sur un fondu au noir, ce qui rend le raccord de boucle
invisible : 1,7 d'écart moyen contre 1,4 pour deux images consécutives ordinaires.

## Ce qui ne coûte rien, par construction

- **Le grain** est un `feTurbulence` en data URI, statique. Zéro requête, zéro script.
- **La tranche** n'anime rien en JavaScript : des traits en CSS et un seul
  `IntersectionObserver` partagé par les neuf sections.
- **Les messages de traduction** ne partent pas dans le bundle client : aucun
  `NextIntlClientProvider` n'est monté.
- **Aucune librairie d'icônes**, aucun script tiers, aucun `iframe`.

## Méthode

Les chiffres ci-dessus se reproduisent ainsi :

```bash
pnpm build && pnpm start
```

puis, dans un autre terminal, une requête sur `/` et la somme des tailles gzip des
scripts référencés. Lighthouse CI applique les mêmes budgets automatiquement à chaque
poussée.
