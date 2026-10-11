import {createHash} from 'node:crypto'
import {expect, test} from '@playwright/test'

/**
 * La CSP repose sur des empreintes calculées au build (voir proxy.ts pour le
 * raisonnement). Ces tests vérifient les deux moitiés du contrat : la politique est
 * bien stricte, et elle autorise exactement les scripts que la page contient.
 */
test.describe('en-têtes de sécurité', () => {
  for (const chemin of ['/', '/en']) {
    test(`la CSP de ${chemin} couvre tous les scripts en ligne de la page`, async ({
      request,
    }) => {
      const reponse = await request.get(chemin)
      const csp = reponse.headers()['content-security-policy']

      expect(csp, 'aucune Content-Security-Policy sur la réponse').toBeTruthy()
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("frame-ancestors 'none'")

      // Le point qui compte : aucune tolérance aux scripts en ligne arbitraires.
      const directiveScripts = csp?.match(/script-src ([^;]*)/)?.[1] ?? ''
      expect(directiveScripts).not.toContain("'unsafe-inline'")
      expect(directiveScripts).not.toContain("'unsafe-eval'")

      // Chaque script en ligne du HTML doit avoir son empreinte dans la politique.
      const html = await reponse.text()
      const enLigne = [
        ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
      ]
        .map((trouve) => trouve[1] ?? '')
        .filter((corps) => corps !== '')

      expect(
        enLigne.length,
        'aucun script en ligne : le test ne prouverait rien',
      ).toBeGreaterThan(0)

      for (const corps of enLigne) {
        const empreinte = createHash('sha256').update(corps, 'utf8').digest('base64')
        expect(
          directiveScripts.includes(empreinte),
          `script en ligne non couvert par la CSP (sha256-${empreinte})`,
        ).toBe(true)
      }
    })
  }

  test('les scripts externes portent une empreinte d’intégrité', async ({request}) => {
    const html = await (await request.get('/')).text()
    const externes = [...html.matchAll(/<script[^>]*\bsrc=[^>]*>/g)].map(
      (trouve) => trouve[0],
    )

    expect(externes.length).toBeGreaterThan(0)
    expect(externes.some((balise) => balise.includes('integrity="sha256-'))).toBe(true)
  })

  test('les en-têtes statiques sont posés', async ({request}) => {
    const enTetes = (await request.get('/')).headers()

    expect(enTetes['strict-transport-security']).toContain('max-age=')
    expect(enTetes['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(enTetes['x-content-type-options']).toBe('nosniff')
    expect(enTetes['x-frame-options']).toBe('DENY')
    expect(enTetes['permissions-policy']).toContain('camera=()')
    // Next ne doit pas annoncer sa présence.
    expect(enTetes['x-powered-by']).toBeUndefined()
  })
})

test.describe('console', () => {
  test('aucune erreur de console au chargement', async ({page}) => {
    const erreurs: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        erreurs.push(message.text())
      }
    })
    page.on('pageerror', (erreur) => erreurs.push(erreur.message))

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(erreurs).toEqual([])
  })
})
