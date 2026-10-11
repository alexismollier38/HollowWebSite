import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['{lib,features,components,i18n}/**/*.test.{ts,tsx}'],
    // Les parcours navigateur sont à Playwright, pas ici.
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
  },
})
