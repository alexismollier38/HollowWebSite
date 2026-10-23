import type {Metadata} from 'next'
import {setRequestLocale} from 'next-intl/server'
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
    <main id="contenu" className="min-h-svh bg-black px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex w-full max-w-[46rem] flex-col gap-8">
        <header className="border-b border-white/10 pb-8">
          <p className="label text-estompe">Hollow</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight text-parchemin">
            Candidature support
          </h1>
          <p className="mt-5 max-w-[40rem] text-base leading-relaxed text-estompe-clair">
            Salut, je te laisserais répondre à ce petit questionnaire afin d’apprendre à
            te connaître un petit peu s’il te plaît :)
          </p>
          <p className="mt-4 text-sm text-estompe">
            Les champs marqués d’un astérisque sont obligatoires.
          </p>
        </header>

        <CandidatureSupportForm />
      </div>
    </main>
  )
}
