import {defineConfig, devices} from '@playwright/test'

// Port dédié aux tests : le 3000 est trop souvent pris par autre chose sur un poste
// de développement, et un échec de port ressemble à s'y méprendre à un échec de test.
const PORT = process.env.PORT_TEST ?? '3210'
const URL_BASE = process.env.URL_TEST ?? `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // `exactOptionalPropertyTypes` interdit de passer `undefined` : on omet la clé.
  ...(process.env.CI ? {workers: 2} : {}),
  reporter: process.env.CI
    ? [['github'], ['html', {open: 'never'}]]
    : [['list'], ['html', {open: 'never'}]],

  use: {
    baseURL: URL_BASE,
    trace: 'on-first-retry',
    locale: 'fr-FR',
  },

  projects: [
    {
      name: 'bureau',
      use: {...devices['Desktop Chrome'], viewport: {width: 1440, height: 900}},
      testIgnore: /captures\.spec\.ts/,
    },
    {
      // Le public vient majoritairement de Discord sur mobile : il ne passe pas après.
      name: 'mobile',
      use: {...devices['Pixel 5']},
      testIgnore: /captures\.spec\.ts/,
    },
    {
      // Sans preview de déploiement, les captures sont la relecture visuelle du lot.
      name: 'captures',
      testMatch: /captures\.spec\.ts/,
      use: {...devices['Desktop Chrome']},
    },
  ],

  webServer: {
    // La sortie autonome, celle que l'image Docker exécutera. Pas un serveur de dev.
    command: 'pnpm start',
    url: URL_BASE,
    env: {PORT},
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
