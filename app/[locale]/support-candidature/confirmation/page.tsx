import type {Metadata} from 'next'
import Image from 'next/image'
import {setRequestLocale} from 'next-intl/server'
import logoSupport from '@/assets/images/logo-support.png'

export const metadata: Metadata = {
  title: 'Résultat de la candidature support',
  robots: {index: false, follow: false},
}

export default async function SupportApplicationConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>
  searchParams: Promise<{status?: string}>
}) {
  const {locale} = await params
  const {status} = await searchParams
  setRequestLocale(locale)

  const success = status === 'success'
  const formPath = locale === 'en' ? '/en/support-candidature' : '/support-candidature'

  return (
    <main
      id="contenu"
      className="support-page flex min-h-svh items-center px-4 py-10 sm:px-6"
    >
      <section className="support-panel mx-auto w-full max-w-[42rem] p-6 text-center sm:p-10">
        <Image
          src={logoSupport}
          alt="Hollow Recrutement Support"
          priority
          sizes="(max-width: 640px) 88vw, 500px"
          className="mx-auto block w-[min(30rem,100%)] object-contain"
        />
        <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-full border border-support-or/60 text-3xl text-support-or-clair">
          {success ? '✓' : '!'}
        </div>
        <h1 className="mt-6 font-display text-3xl text-support-or-clair sm:text-4xl">
          {success ? 'Formulaire envoyé' : 'Envoi impossible'}
        </h1>
        <p className="mx-auto mt-4 max-w-[32rem] text-base leading-relaxed text-support-or/75">
          {success
            ? 'Merci pour ta candidature. Elle a bien été transmise à l’équipe Hollow, qui reviendra vers toi prochainement.'
            : 'Une erreur est survenue pendant l’envoi de ta candidature. Vérifie tes réponses puis réessaie.'}
        </p>
        <a
          href={formPath}
          className="action mt-8 inline-flex rounded-md bg-support-or px-7 py-4 text-black transition-colors hover:bg-support-or-clair"
        >
          {success ? 'Retourner au formulaire' : 'Réessayer'}
        </a>
      </section>
    </main>
  )
}
