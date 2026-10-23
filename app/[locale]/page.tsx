import Image from 'next/image'
import {useTranslations} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import fondHero from '@/assets/images/fond-hero.png'
import motSymbole from '@/assets/images/logo-hollow.png'
import {BarreHaute} from '@/components/chrome/BarreHaute'
import {MentionsBas} from '@/components/chrome/MentionsBas'

/**
 * Page d'accueil — un seul écran, celui du hero.
 *
 * La composition suit la direction artistique fournie par le client : illustration
 * plein cadre fixe et un bloc de texte centré autour du mot-symbole.
 */
export default async function PageAccueil({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params

  // Rendu statique : sans ça, `useTranslations` bascule la page en dynamique.
  setRequestLocale(locale)

  return <Hero />
}

function Hero() {
  const t = useTranslations()

  return (
    <>
      <BarreHaute />

      <main id="contenu">
        <section
          id="entree"
          aria-labelledby="titre-entree"
          /*
           * `h-svh` pour tenir exactement l'écran, `min-h` pour qu'un écran très bas — ou
           * un zoom à 200 % — fasse grandir la section et défiler la page plutôt que de
           * rogner le contenu. L'original bloquait le défilement ; on ne peut pas.
           */
          className="relative h-svh min-h-[40rem] overflow-hidden bg-black"
        >
          <Image
            src={fondHero}
            alt=""
            fill
            priority
            sizes="100vw"
            aria-hidden="true"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-black/55" />

          <div className="relative z-10 flex h-full w-[min(680px,88%)] flex-col items-center justify-center gap-[clamp(16px,2.6vh,28px)] px-4 md:w-[min(680px,62%)] md:px-[clamp(28px,4.4vw,64px)]">
            <h1 id="titre-entree" className="w-full">
              <Image
                src={motSymbole}
                alt={t('marque.nom')}
                loading="eager"
                sizes="(max-width: 640px) 90vw, 600px"
                className="mx-auto block h-auto max-h-[28vh] w-[min(600px,100%)] object-contain"
              />
            </h1>

            <div className="mt-[clamp(2px,0.8vh,10px)] flex flex-wrap items-center justify-center gap-[clamp(16px,2vw,30px)]">
              <button
                type="button"
                aria-disabled="true"
                className="action flex items-center gap-[13px] border border-parchemin/25 bg-encre/55 px-8 py-[15px] text-parchemin-vif shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_14px_40px_rgb(0_0_0/0.5)] backdrop-blur-[10px] transition-colors hover:border-parchemin hover:bg-parchemin/10 focus-visible:border-parchemin"
              >
                {t('actions.launcher')}
              </button>
            </div>
          </div>
        </section>
      </main>

      <MentionsBas />
    </>
  )
}
