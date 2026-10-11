import type {Metadata, Viewport} from 'next'
import {notFound} from 'next/navigation'
import {hasLocale, NextIntlClientProvider} from 'next-intl'
import {getTranslations, setRequestLocale} from 'next-intl/server'
import {variablesDePolices} from '@/app/polices'
import {routing} from '@/i18n/routing'
import {env} from '@/lib/env'
import {fonds} from '@/lib/tokens/palette'
import '@/app/styles/theme.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}))
}

export const viewport: Viewport = {
  themeColor: fonds.encre,
  colorScheme: 'dark',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>
}): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale})

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_URL_SITE),
    title: {
      default: 'Hollow',
      template: `%s — ${t('marque.nom')}`,
    },
    description: t('marque.description'),
    alternates: {
      canonical: locale === routing.defaultLocale ? '/' : `/${locale}`,
      languages: {fr: '/', en: '/en'},
    },
    openGraph: {
      type: 'website',
      siteName: t('marque.nom'),
      title: 'Hollow',
      description: t('marque.description'),
      locale,
    },
  }
}

/**
 * Racine du document. Aucune directive `use client` ici ni dans aucune page : le seul
 * composant client du site est la parallaxe du hero, et c'est une feuille.
 *
 * Le layout ne pose ni barre haute, ni pied de page, ni même le `<main>` : chaque page
 * place ses propres repères. C'est ce qui permet à la page d'accueil de sortir sa
 * barre haute et son pied de page **hors** du contenu principal — un `<header>`
 * imbriqué dans une `<section>` ne porte aucun rôle de bannière, et les repères de
 * navigation manquaient au lecteur d'écran.
 *
 * `NextIntlClientProvider` est monté **sans `messages`**. Il ne transmet que la locale,
 * dont le composant `Link` de next-intl a besoin : il appelle `useLocale()` sans
 * condition, même quand on lui passe la locale en propriété. Les traductions, elles,
 * restent entièrement côté serveur — le coût mesuré est de 0,4 Ko.
 */
export default async function LayoutLocale({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{locale: string}>
}) {
  const {locale} = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const t = await getTranslations({locale})

  return (
    <html lang={locale} className={variablesDePolices} data-scroll-behavior="smooth">
      <body className="antialiased">
        <a
          href="#contenu"
          className="label sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:bg-encre focus-visible:px-4 focus-visible:py-2 focus-visible:text-parchemin"
        >
          {t('navigation.aller_au_contenu')}
        </a>

        <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
