import {createNavigation} from 'next-intl/navigation'
import {routing} from './routing'

/**
 * Les seuls outils de navigation autorisés dans l'application. Importer `next/link`
 * directement contourne la localisation des chemins — la règle ESLint le refuse.
 */
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing)
