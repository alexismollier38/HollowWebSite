# Backend du launcher Hollow — intégration Next.js

Ce projet utilise Next.js 16, TypeScript strict et un serveur autonome Dockerisé. Le
backend du launcher est donc porté sous forme de Route Handlers Node.js, et non sous
forme de fonctions Vercel JavaScript.

## Structure

```text
app/api/launcher/route.ts                         # /api/launcher?action=...
app/api/launcher/discord/callback/route.ts        # callback OAuth Discord
app/api/launcher/steam/callback/route.ts          # callback OpenID Steam
lib/launcher/_shared.ts                            # DB, sessions, hash, CORS, e-mails
lib/launcher/auth.ts                               # inscription, login, session, reset
```

Les modules serveur restent dans `lib/launcher` : ils ne doivent jamais être importés
par un composant client. Les Route Handlers utilisent le runtime `nodejs` et sont
dynamiques.

## Routes disponibles

Les requêtes JSON utilisent `Content-Type: application/json`. Les actions authentifiées
envoient `Authorization: Bearer <token>`.

| Méthode | URL | Corps |
| --- | --- | --- |
| POST | `/api/launcher?action=register` | `{ username, email, password }` |
| POST | `/api/launcher?action=resend-email` | `{ verificationId }` |
| POST | `/api/launcher?action=verify-email` | `{ verificationId, code }` |
| POST | `/api/launcher?action=login` | `{ identity, password }` |
| GET | `/api/launcher?action=session` | — |
| PATCH | `/api/launcher?action=session` | `{ currentPassword, newPassword }` |
| POST | `/api/launcher?action=logout` | — |
| POST | `/api/launcher?action=password-reset-request` | `{ email }` |
| POST | `/api/launcher?action=password-reset-confirm` | `{ resetId, code, newPassword }` |
| GET | `/api/launcher?action=avatars` | — |
| GET | `/api/launcher?action=tickets` | session + Discord lié |
| POST | `/api/launcher?action=ticket` | `{ ticketId, subject, category, message, attachments? }` |
| POST | `/api/launcher?action=ticket-reply` | `{ ticketId, message, attachments? }` |
| POST | `/api/launcher?action=flow` | `{ provider: "discord" | "steam" }` |
| GET | `/api/launcher?action=flow-status&id=...&secret=...` | secret du flux |
| OPTIONS | `/api/launcher` | prévol CORS |

L’inscription renvoie `202` et ne crée le compte qu’après validation du code. Une
connexion ou une validation réussie renvoie `{ token, user }`. Seul le hash SHA-256
du token de session est conservé en base. Les mots de passe utilisent `crypto.scrypt`.

Les routes tickets et les flux Discord/Steam nécessitent le contrat du service Hollow
Administration et doivent être activés avec leurs variables dédiées avant d’être
exposés au launcher. Les callbacks présents répondent déjà en Node/HTML, mais la
validation et l’association OAuth doivent être branchées sur le service cible avant
mise en production.

## Base PostgreSQL / Neon

Le code utilise `@neondatabase/serverless` et `DATABASE_URL`. Les tables principales
doivent exister avant le premier déploiement :

```sql
create extension if not exists pgcrypto;

create table if not exists launcher_accounts (
  id uuid primary key default gen_random_uuid(), username text not null, email text not null,
  password_hash text not null, password_salt text not null,
  discord_id text, discord_username text, discord_linked_at timestamptz,
  steam_id text, steam_linked_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists launcher_accounts_username_lower_uq on launcher_accounts (lower(username));
create unique index if not exists launcher_accounts_email_lower_uq on launcher_accounts (lower(email));
create unique index if not exists launcher_accounts_discord_id_uq on launcher_accounts (discord_id) where discord_id is not null;
create unique index if not exists launcher_accounts_steam_id_uq on launcher_accounts (steam_id) where steam_id is not null;

create table if not exists launcher_sessions (
  token_hash text primary key, account_id uuid not null references launcher_accounts(id) on delete cascade,
  expires_at timestamptz not null, revoked_at timestamptz
);
create index if not exists launcher_sessions_account_idx on launcher_sessions(account_id);

create table if not exists launcher_oauth_flows (
  id uuid primary key, account_id uuid not null references launcher_accounts(id) on delete cascade,
  provider text not null check (provider in ('discord', 'steam')), state_hash text not null,
  secret_hash text not null, expires_at timestamptz not null, completed_at timestamptz, error text
);
create index if not exists launcher_oauth_flows_state_idx on launcher_oauth_flows(state_hash);
```

Les tables `launcher_email_verifications` et `launcher_password_resets` sont créées
par `ensureAuxiliarySchema` au premier usage. Pour la production, déplacer cette
création dans une migration versionnée est préférable.

## Variables d’environnement

Ajouter au `.env.local` et au secret manager du serveur :

```text
DATABASE_URL=postgresql://...
LAUNCHER_BASE_URL=https://hollow.example
RESEND_API_KEY=...
RESEND_FROM_EMAIL=contact@hollow.example
EMAIL_VERIFICATION_SECRET=secret-aleatoire-d-au-moins-32-caracteres
LAUNCHER_DISCORD_CLIENT_ID=...
LAUNCHER_DISCORD_CLIENT_SECRET=...
TICKETS_API_TOKEN=...
```

Les variables `NEXT_PUBLIC_*` existantes restent celles du site. Les secrets du
launcher ne doivent pas être préfixés `NEXT_PUBLIC_`, ni copiés dans le bundle,
le launcher desktop, Git ou un fichier Markdown partagé.

## CORS et déploiement

La whitelist comprend l’origine `NEXT_PUBLIC_URL_SITE` et les origines Tauri usuelles.
Compléter `lib/launcher/_shared.ts` si le client desktop utilise une autre origine.
Le proxy global exclut déjà `/api` de la réécriture i18n et de la CSP de page.

Le déploiement reste celui de [DEPLOY.md](DEPLOY.md) : `pnpm build`, image
`output: 'standalone'`, puis reverse proxy vers le port 3000. Les tests à ajouter au
prochain lot doivent couvrir les parcours register/verify, login/session/logout,
reset, CORS et les callbacks OAuth avec des doubles des services externes.
