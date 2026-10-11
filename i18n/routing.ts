import {defineRouting} from 'next-intl/routing'

/**
 * FR par défaut sans préfixe (`/`), EN sous `/en`. Miroir complet : toute route
 * ajoutée ici doit exister dans les deux langues, sinon `Link` ne compile pas.
 *
 * Les chemins sont localisés : un anglophone lit `/en/download`, pas `/en/telecharger`.
 * La carte grandit à chaque lot ; c'est volontairement contraignant.
 */
export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed',

  /*
   * Ni cookie de langue, ni détection par `Accept-Language` : **le chemin est la seule
   * source de vérité.**
   *
   * Le cookie posait un vrai bogue — depuis `/en`, un lien vers `/` était aussitôt
   * renvoyé vers `/en`, donc on ne pouvait plus revenir au français. Il rendait aussi
   * chaque page dépendante d'un en-tête, ce qui interdit à un cache de servir la même
   * réponse à tout le monde.
   *
   * Effet de bord assumé : un anglophone qui arrive sur `/` voit d'abord le français.
   * C'est ce que demande le cahier des charges — « FR par défaut, EN en second ». Et
   * le site ne pose plus aucun cookie, donc aucune bannière n'a lieu d'être.
   */
  localeCookie: false,
  localeDetection: false,

  pathnames: {
    '/': '/',
    '/conditions-utilisation': {fr: '/conditions-utilisation', en: '/terms-of-use'},
    '/confidentialite': {fr: '/confidentialite', en: '/privacy'},
  },
})

export type Locale = (typeof routing.locales)[number]
