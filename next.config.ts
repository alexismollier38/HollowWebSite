import type {NextConfig} from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Importé pour son effet de bord : la validation d'environnement doit échouer au build,
// pas à la première requête.
import './lib/env'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/**
 * En-têtes statiques. La Content-Security-Policy n'est pas ici : elle porte un nonce
 * par requête, donc elle est posée dans proxy.ts.
 */
const enTetesSecurite = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'X-Frame-Options', value: 'DENY'},
  {key: 'Cross-Origin-Opener-Policy', value: 'same-origin'},
]

const nextConfig: NextConfig = {
  // Docker utilise l'image autonome ; Vercel gère déjà son propre bundling.
  // Next.js 16.3 ne produit pas le manifeste attendu par l'adaptateur Vercel
  // lorsque `output: 'standalone'` est activé.
  ...(process.env.VERCEL ? {} : {output: 'standalone' as const}),

  experimental: {sri: {algorithm: 'sha256'}},
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [{source: '/:path*', headers: enTetesSecurite}]
  },
}

export default withNextIntl(nextConfig)
