# Hollow — site vitrine

Site du serveur roleplay **Hollow**, sur nanos.world. Next.js App Router, TypeScript
strict, Tailwind v4, FR par défaut et EN en second.

## Démarrer

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Le build échoue si une variable d'environnement requise manque : c'est voulu. Voir
[docs/DEPLOY.md](docs/DEPLOY.md) pour la liste.

Les fontes ne sont pas versionnées — licence ITF, redistribution interdite. `pnpm
install` ne les récupère pas ; `pnpm dev` et `pnpm build` s'en chargent au premier
lancement, et il faut donc un accès réseau la première fois.

## Commandes

| Commande         | Ce qu'elle fait                                           |
| ---------------- | --------------------------------------------------------- |
| `pnpm dev`       | Serveur de développement                                  |
| `pnpm build`     | Copie des fontes, build, empreintes CSP                   |
| `pnpm start`     | Sert la sortie autonome, celle que l'image Docker exécute |
| `pnpm typecheck` | `tsc --noEmit`                                            |
| `pnpm lint`      | ESLint, aucun avertissement toléré                        |
| `pnpm test`      | Tests unitaires (Vitest)                                  |
| `pnpm test:e2e`  | Parcours, axe-core et captures (Playwright)               |
| `pnpm captures`  | Uniquement les captures d'écran                           |

## Documentation

| Document                                     | Contenu                                                        |
| -------------------------------------------- | -------------------------------------------------------------- |
| [docs/PLAN.md](docs/PLAN.md)                 | Les lots, leurs critères d'acceptation, les arbitrages ouverts |
| [docs/DESIGN.md](docs/DESIGN.md)             | Palette, typographie, layout, l'élément signature              |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Découpage, règles de dépendance, la décision CSP               |
| [docs/PERF.md](docs/PERF.md)                 | Budgets, mesures réelles, leviers restants                     |
| [docs/DEPLOY.md](docs/DEPLOY.md)             | Docker, reverse proxy, variables d'environnement               |

## Projet de fan non affilié

Hollow n'est associé ni à Shueisha, ni à Studio Pierrot, ni aux ayants droit de
_Black Clover_. **Le dépôt ne contient aucun asset sous licence tierce** : ni logo, ni
capture d'anime, ni illustration extraite. Les visuels sont des captures in-game, des
illustrations originales, ou des placeholders explicitement nommés comme tels.
