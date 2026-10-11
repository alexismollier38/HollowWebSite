import AxeBuilder from '@axe-core/playwright'
import {expect, test} from '@playwright/test'
import en from '../messages/en.json' with {type: 'json'}
import fr from '../messages/fr.json' with {type: 'json'}

/*
 * Les textes attendus sont lus dans messages/*.json plutôt que recopiés : un test qui
 * duplique la chaîne ne détecte pas une traduction oubliée, il la fige.
 */

test.describe('page d’accueil', () => {
  test('s’affiche en français à la racine', async ({page}) => {
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.getByText(fr.marque.baseline)).toBeVisible()
  })

  test('le mot-symbole porte le titre de niveau 1', async ({page}) => {
    await page.goto('/')

    const titre = page.getByRole('heading', {level: 1})
    await expect(titre).toBeVisible()
    // Le mot-symbole est une image : c'est son texte de remplacement qui fait le titre.
    await expect(titre.getByRole('img', {name: fr.marque.nom})).toBeVisible()
  })

  test('tient sur un seul écran, sans défilement', async ({page}) => {
    await page.goto('/')

    const debordeVerticalement = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight + 1,
    )

    expect(debordeVerticalement).toBe(false)
  })

  test('le bloc de texte est calé à gauche, pas centré', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900})
    await page.goto('/')

    const bloc = await page
      .locator('#entree h1')
      .evaluate((noeud) => noeud.closest('div')!.getBoundingClientRect().toJSON())

    // La maquette ne donne aucune marge automatique à cette colonne : elle commence
    // au bord gauche et n'atteint pas le milieu de l'écran.
    expect(bloc.left).toBeLessThan(40)
    expect(bloc.right).toBeLessThan(900)
  })

  test('la barre haute ne contient que le Discord', async ({page}) => {
    await page.goto('/')

    const liens = page.getByRole('banner').getByRole('link')
    await expect(liens).toHaveCount(1)
    await expect(liens).toHaveAttribute('href', /discord/)
  })

  test('l’action primaire est le Discord, et c’est la seule', async ({page}) => {
    await page.goto('/')

    const discord = page.getByRole('link', {name: fr.actions.discord})
    await expect(discord).toBeVisible()
    await expect(discord).toHaveAttribute('href', /discord/)
  })

  test('le pied de page ne porte que les deux liens de la maquette', async ({page}) => {
    await page.goto('/')

    const liens = page.getByRole('contentinfo').getByRole('link')
    await expect(liens).toHaveCount(2)
    await expect(liens.first()).toHaveText(fr.pied.conditions)
    await expect(liens.last()).toHaveText(fr.pied.confidentialite)
  })

  test('l’illustration est décorative et préchargée', async ({page}) => {
    await page.goto('/')

    const illustration = page.locator('#entree img').first()
    await expect(illustration).toBeVisible()
    await expect(illustration).toHaveAttribute('alt', '')
    await expect(illustration).toHaveAttribute('src', /\/_next\/image/)

    /*
     * Deux préchargements, et exactement deux : l'illustration et le mot-symbole.
     * Le hero ne contient que ces deux images, toutes deux au-dessus de la ligne de
     * flottaison. Un troisième serait une régression — il entrerait en concurrence
     * avec le LCP.
     */
    await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(2)
    await expect(page.locator('#entree img')).toHaveCount(2)
  })
})

test.describe('fond animé', () => {
  test('la vidéo est absente du HTML servi', async ({request}) => {
    const html = await (await request.get('/')).text()

    // Le premier rendu ne doit contenir que le poster : le LCP est une image, et
    // rien ne doit être demandé au réseau pour la vidéo avant que le navigateur
    // n'ait fini son travail.
    expect(html).not.toContain('<video')
  })

  test('elle se rattache après coup, par-dessus le poster', async ({page}, infos) => {
    test.skip(
      infos.project.name === 'mobile',
      'Sous 768 px la vidéo est refusée — c’est le dernier test de ce bloc qui le vérifie.',
    )

    await page.goto('/')

    const video = page.locator('#entree video')
    await expect(video).toBeAttached({timeout: 10_000})
    await expect(video).toHaveAttribute('preload', 'none')

    // AV1 en premier, H.264 en repli.
    const types = await video
      .locator('source')
      .evaluateAll((noeuds) => noeuds.map((noeud) => noeud.getAttribute('type')))
    expect(types).toEqual(['video/webm', 'video/mp4'])
  })

  test('elle ne montre jamais son fondu d’ouverture au noir', async ({page}, infos) => {
    test.skip(infos.project.name === 'mobile', 'La vidéo est refusée sous 768 px.')

    await page.goto('/')

    const video = page.locator('#entree video')
    await expect(video).toBeAttached({timeout: 10_000})

    /*
     * La vidéo ouvre sur du noir — c'est ce qui rend la boucle invisible. Elle doit
     * donc démarrer après ce fondu, à la position exacte dont le poster est
     * l'extraction. Sans ça, la page clignote au moment où la vidéo se pose.
     *
     * Ce test lie l'encodage au composant : changer la durée du fondu sans ajuster
     * `DEBUT_VISIBLE` le fait tomber.
     */
    await expect
      .poll(() => video.evaluate((noeud: HTMLVideoElement) => noeud.currentTime), {
        timeout: 10_000,
      })
      .toBeGreaterThanOrEqual(0.9)
  })

  test('elle ne se monte pas sous mouvement réduit', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#entree video')).toHaveCount(0)
  })

  test('elle ne se monte pas sur un petit écran', async ({page}) => {
    await page.setViewportSize({width: 480, height: 800})
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#entree video')).toHaveCount(0)
  })
})

test.describe('pages de texte', () => {
  test('les deux liens du bas mènent à une vraie page', async ({page}) => {
    await page.goto('/')

    await page.getByRole('link', {name: fr.pied.conditions}).click()
    await expect(page).toHaveURL(/\/conditions-utilisation$/)
    await expect(page.getByRole('heading', {level: 1})).toHaveText(fr.conditions.titre)

    await page.goBack()

    await page.getByRole('link', {name: fr.pied.confidentialite}).click()
    await expect(page).toHaveURL(/\/confidentialite$/)
    await expect(page.getByRole('heading', {level: 1})).toHaveText(
      fr.confidentialite.titre,
    )
  })

  test('leurs chemins sont traduits en anglais', async ({page}) => {
    await page.goto('/en')

    await page.getByRole('link', {name: en.pied.conditions}).click()
    await expect(page).toHaveURL(/\/en\/terms-of-use$/)
  })

  test('l’affiliation est démentie noir sur blanc dans les conditions', async ({
    page,
  }) => {
    await page.goto('/conditions-utilisation')

    await expect(page.getByText(fr.conditions.marques)).toBeVisible()
  })
})

test.describe('langues', () => {
  test('la version anglaise existe et se sert', async ({page}) => {
    // Aucune bascule n'est affichée — c'est la maquette. La route reste servie.
    await page.goto('/en')

    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByText(en.marque.baseline)).toBeVisible()
  })
})

test.describe('accessibilité', () => {
  for (const chemin of ['/', '/en', '/conditions-utilisation', '/confidentialite']) {
    test(`axe-core ne relève rien de sérieux sur ${chemin}`, async ({page}) => {
      await page.goto(chemin)

      const resultat = await new AxeBuilder({page})
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const serieuses = resultat.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      )

      expect(serieuses.map((violation) => `${violation.id} — ${violation.help}`)).toEqual(
        [],
      )
    })
  }

  test('le lien d’évitement est atteignable au clavier', async ({page}) => {
    await page.goto('/')
    await page.keyboard.press('Tab')

    await expect(
      page.getByRole('link', {name: fr.navigation.aller_au_contenu}),
    ).toBeFocused()
  })

  test('le mouvement s’arrête si le visiteur le demande', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.goto('/')

    // Les braises n'ont plus de trajectoire : la règle CSS les retire.
    await expect(page.locator('[data-braise]').first()).toBeHidden()

    const dureeIllustration = await page
      .locator('#entree img')
      .first()
      .evaluate((noeud) => getComputedStyle(noeud).animationDuration)

    expect(Number.parseFloat(dureeIllustration)).toBeLessThan(0.1)
  })
})

test.describe('petits écrans', () => {
  test.use({viewport: {width: 320, height: 640}})

  test('aucun défilement horizontal à 320 px', async ({page}) => {
    await page.goto('/')

    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )

    expect(debordement).toBe(false)
  })
})
