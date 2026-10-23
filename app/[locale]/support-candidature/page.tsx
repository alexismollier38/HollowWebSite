import type {Metadata} from 'next'
import Image from 'next/image'
import {connection} from 'next/server'
import {getTranslations, setRequestLocale} from 'next-intl/server'
import logoSupport from '@/assets/images/logo-support.png'
import {CandidatureSupportForm} from '@/components/support/CandidatureSupportForm'
import {getSupportIntakeOpen} from '@/lib/support-intake'

export const metadata: Metadata = {
  title: 'Candidature support',
  robots: {index: false, follow: false},
}

export default async function SupportApplicationPage({
  params,
}: {
  params: Promise<{locale: string}>
}) {
  await connection()
  const {locale} = await params
  setRequestLocale(locale)
  const t = await getTranslations({locale})
  const intakeOpen = await getSupportIntakeOpen()

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
          {intakeOpen && (
            <p className="mt-4 text-sm text-support-or/75">
              {t('support.required_fields')}
            </p>
          )}
        </header>

        {intakeOpen ? (
          <CandidatureSupportForm
            discordHelp={t('support.discord_help')}
            successMessage={t('support.success_message')}
          />
        ) : (
          <section className="support-panel p-6 text-center sm:p-9" role="status">
            <h2 className="text-3xl font-semibold text-support-or-clair">
              {intakeOpen === false
                ? t('support.applications_closed')
                : t('support.applications_unavailable')}
            </h2>
            <p className="mt-4 text-support-or/80">
              {intakeOpen === false
                ? t('support.applications_closed_description')
                : t('support.applications_unavailable_description')}
            </p>
          </section>
        )}
      </div>
    </main>
  )
}
