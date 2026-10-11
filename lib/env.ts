import {createEnv} from '@t3-oss/env-nextjs'
import {z} from 'zod'

/**
 * Environnement validé au build. Une variable requise qui manque casse `pnpm build` —
 * c'est voulu : mieux vaut un build rouge qu'un bouton Discord qui pointe dans le vide.
 *
 * Voir .env.example pour la liste commentée.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.url().optional(),
    LAUNCHER_BASE_URL: z.url().optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
    EMAIL_VERIFICATION_SECRET: z.string().min(32).optional(),
    LAUNCHER_DISCORD_CLIENT_ID: z.string().min(1).optional(),
    LAUNCHER_DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
    TICKETS_API_TOKEN: z.string().min(1).optional(),
  },

  client: {
    /** Origine publique du site, sans barre oblique finale. Sert au sitemap et aux canoniques. */
    NEXT_PUBLIC_URL_SITE: z.url(),

    /**
     * Invitation Discord. **Requise** : c'est l'action primaire du site tant que le
     * serveur n'est pas ouvert.
     */
    NEXT_PUBLIC_URL_DISCORD: z.url(),

    /**
     * Adresse publique du serveur de jeu, au format `hôte:port`.
     * Vide tant que le serveur n'est pas ouvert : le bloc d'adresse reste alors masqué
     * plutôt que d'afficher une adresse inventée.
     */
    NEXT_PUBLIC_ADRESSE_SERVEUR: z
      .string()
      .regex(
        /^[a-zA-Z0-9.-]+:\d{1,5}$/,
        'Format attendu : « hôte:port », par exemple « jouer.hollow.example:7777 ».',
      )
      .optional(),

    /** URL publique de téléchargement du launcher Hollow. */
    NEXT_PUBLIC_URL_LAUNCHER: z.url(),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    LAUNCHER_BASE_URL: process.env.LAUNCHER_BASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    EMAIL_VERIFICATION_SECRET: process.env.EMAIL_VERIFICATION_SECRET,
    LAUNCHER_DISCORD_CLIENT_ID: process.env.LAUNCHER_DISCORD_CLIENT_ID,
    LAUNCHER_DISCORD_CLIENT_SECRET: process.env.LAUNCHER_DISCORD_CLIENT_SECRET,
    TICKETS_API_TOKEN: process.env.TICKETS_API_TOKEN,
    NEXT_PUBLIC_URL_SITE: process.env.NEXT_PUBLIC_URL_SITE,
    NEXT_PUBLIC_URL_DISCORD: process.env.NEXT_PUBLIC_URL_DISCORD,
    NEXT_PUBLIC_ADRESSE_SERVEUR: process.env.NEXT_PUBLIC_ADRESSE_SERVEUR,
    NEXT_PUBLIC_URL_LAUNCHER: process.env.NEXT_PUBLIC_URL_LAUNCHER,
  },

  /** Une variable présente mais vide vaut absente : sinon `""` passerait la validation. */
  emptyStringAsUndefined: true,
})

/** Le serveur est-il annoncé comme joignable ? Décide de la hiérarchie des actions. */
export const serveurOuvert = env.NEXT_PUBLIC_ADRESSE_SERVEUR !== undefined
