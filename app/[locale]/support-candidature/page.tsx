import type {Metadata} from 'next'
import Image from 'next/image'
import {setRequestLocale} from 'next-intl/server'
import logoSupport from '@/assets/images/logo-support.png'
import {CandidatureSupportForm} from '@/components/support/CandidatureSupportForm'

export const metadata: Metadata = {
  title: 'Candidature support',
  robots: {index: false, follow: false},
}

export default async function SupportApplicationPage({
  params,
}: {
  params: Promise<{locale: string}>
}) {
  const {locale} = await params
  setRequestLocale(locale)

  return (
    <main id="contenu" className="support-page min-h-svh px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto flex w-full max-w-[46rem] flex-col gap-8">
        <header className="support-panel p-6 sm:p-9">
          <Image
            src={logoSupport}
            alt="Hollow Recrutement Support"
            priority
            sizes="(max-width: 700px) 88vw, 560px"
            className="mx-auto block w-[min(31rem,100%)] object-contain"
          />
          <h1 className="sr-only">Candidature support Hollow</h1>
          <p className="mx-auto mt-7 max-w-[40rem] text-base leading-relaxed text-support-or-clair">
            Salut, je te laisserais répondre à ce petit questionnaire afin d’apprendre à
            te connaître un petit peu s’il te plaît :)
          </p>
          <p className="mt-4 text-sm text-support-or/75">
            Les champs marqués d’un astérisque sont obligatoires.
          </p>
        </header>

        <CandidatureSupportForm />
      </div>
    </main>
  )
}
