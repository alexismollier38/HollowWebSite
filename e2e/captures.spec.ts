import {expect, test} from '@playwright/test'

/**
 * Le site est auto-hébergé : il n'y a pas de preview de déploiement à relire. Ces
 * captures sont la relecture visuelle de chaque lot, publiées en artefacts de CI.
 */
const formats = [
  {nom: 'bureau', viewport: {width: 1440, height: 900}},
  {nom: 'mobile', viewport: {width: 375, height: 812}},
] as const

const pages = [
  {nom: 'accueil-fr', chemin: '/'},
  {nom: 'accueil-en', chemin: '/en'},
] as const

for (const format of formats) {
  for (const cible of pages) {
    test(`capture ${cible.nom} en ${format.nom}`, async ({page}) => {
      await page.setViewportSize(format.viewport)
      await page.goto(cible.chemin)

      // Les fontes doivent être posées, sinon la capture montre le repli.
      await page.evaluate(() => document.fonts.ready)

      /*
       * Et les apparitions doivent être terminées. Elles sont décalées jusqu'à 0,75 s
       * et démarrent à opacité nulle : capturer trop tôt donne une page à moitié vide,
       * ce qui s'est produit avant que cette attente n'existe.
       *
       * Le délai est large : le fondu de la vidéo de fond compte aussi comme une
       * animation en cours, et quatre workers qui décodent en même temps allongent
       * l'attente. Un test qui tombe une fois sur cinq ne vaut rien.
       */
      await expect
        .poll(
          () =>
            page.evaluate(() =>
              document
                .getAnimations()
                .filter((animation) => animation.playState === 'running')
                .every(
                  (animation) =>
                    (animation.effect?.getComputedTiming().iterations ?? 1) === Infinity,
                ),
            ),
          {timeout: 15_000},
        )
        .toBe(true)

      await page.screenshot({
        path: `captures/${cible.nom}-${format.nom}.png`,
        fullPage: false,
      })
    })
  }
}
