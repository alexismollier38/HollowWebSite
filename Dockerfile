# Image autonome pour l'auto-hébergement derrière un reverse proxy.
# Trois étapes : dépendances, build, exécution. Seule la dernière part en production.

# ---------------------------------------------------------------- dépendances
FROM node:24-alpine AS deps
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------- build
FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Les variables NEXT_PUBLIC_* sont figées dans le bundle au moment du build :
# elles doivent donc être fournies ici, pas au démarrage du conteneur.
ARG NEXT_PUBLIC_URL_SITE
ARG NEXT_PUBLIC_URL_DISCORD
ARG NEXT_PUBLIC_URL_LAUNCHER
ARG NEXT_PUBLIC_ADRESSE_SERVEUR
ENV NEXT_PUBLIC_URL_SITE=$NEXT_PUBLIC_URL_SITE \
    NEXT_PUBLIC_URL_DISCORD=$NEXT_PUBLIC_URL_DISCORD \
    NEXT_PUBLIC_URL_LAUNCHER=$NEXT_PUBLIC_URL_LAUNCHER \
    NEXT_PUBLIC_ADRESSE_SERVEUR=$NEXT_PUBLIC_ADRESSE_SERVEUR \
    NEXT_TELEMETRY_DISABLED=1

# `pnpm build` enchaîne : copie des fontes, next build, empreintes CSP.
RUN pnpm build

# ------------------------------------------------------------------ exécution
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Écoute en double pile : en IPv4 seule, la réécriture de langue de next-intl vise
# `localhost`, que le serveur ne reconnaît pas comme lui-même, et « / » boucle.
ENV HOSTNAME="::"

RUN addgroup --system --gid 1001 hollow \
 && adduser --system --uid 1001 hollow

COPY --from=build --chown=hollow:hollow /app/.next/standalone ./
COPY --from=build --chown=hollow:hollow /app/.next/static ./.next/static
COPY --from=build --chown=hollow:hollow /app/public ./public
# Lu à l'exécution par proxy.ts pour composer la Content-Security-Policy.
COPY --from=build --chown=hollow:hollow /app/.next/csp-hashes.json ./.next/csp-hashes.json

USER hollow
EXPOSE 3000

CMD ["node", "server.js"]
