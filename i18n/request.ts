import {hasLocale} from 'next-intl'
import {getRequestConfig} from 'next-intl/server'
import {routing} from './routing'

export default getRequestConfig(async ({requestLocale}) => {
  const demandee = await requestLocale
  const locale = hasLocale(routing.locales, demandee) ? demandee : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Fuseau figé : les dates d'actualités doivent s'afficher pareil partout,
    // sinon le rendu statique et le rendu client divergent.
    timeZone: 'Europe/Paris',
  }
})
