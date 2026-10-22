import Image from 'next/image'
import {useTranslations} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import motSymbole from '@/assets/images/logo-hollow.png'
import {BarreHaute} from '@/components/chrome/BarreHaute'
import {MentionsBas} from '@/components/chrome/MentionsBas'
import {env} from '@/lib/env'

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
          <div className="relative flex h-full w-[min(680px,88%)] flex-col items-center justify-center gap-[clamp(16px,2.6vh,28px)] px-4 md:w-[min(680px,62%)] md:px-[clamp(28px,4.4vw,64px)]">
            <h1 id="titre-entree" className="w-full">
              <Image
                src={motSymbole}
                alt={t('marque.nom')}
                loading="eager"
                sizes="(max-width: 640px) 90vw, 600px"
                className="mx-auto block h-auto max-h-[28vh] w-[min(600px,100%)] object-contain"
              />
            </h1>

            {/*
          Sur grand écran, la baseline est décalée sous la moitié droite du mot-symbole
          et remonte dans son ombre : c'est ce décalage qui empêche l'ensemble de
          ressembler à un logo centré au-dessus d'un sous-titre centré.

          Sous 768 px, le décalage est abandonné. Il faisait chevaucher la phrase et le
          mot-symbole, et une ligne insécable débordait de l'écran. La composition de
          référence a été dessinée pour un écran large ; la majorité du public arrive
          de Discord, sur un téléphone.
        */}
            <p className="w-[min(600px,100%)] md:-mt-[clamp(26px,6vh,52px)]">
              <span className="block text-center font-display text-baseline text-parchemin [text-shadow:0_1px_2px_rgb(0_0_0/0.95),0_2px_18px_rgb(0_0_0/0.9)] md:pl-[46.5%] md:text-left md:whitespace-nowrap">
                {t('marque.baseline')}
              </span>
            </p>

            <div className="mt-[clamp(2px,0.8vh,10px)] flex flex-wrap items-center justify-center gap-[clamp(16px,2vw,30px)]">
              <a
                href={env.NEXT_PUBLIC_URL_LAUNCHER}
                rel="noreferrer noopener"
                target="_blank"
                className="action flex items-center gap-[13px] border border-parchemin/25 bg-encre/55 px-8 py-[15px] text-parchemin-vif shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_14px_40px_rgb(0_0_0/0.5)] backdrop-blur-[10px] transition-colors hover:border-parchemin hover:bg-parchemin/10 focus-visible:border-parchemin"
              >
                {t('actions.launcher')}
              </a>
            </div>
          </div>
        </section>
      </main>

      <MentionsBas />
    </>
  )
}
