import {expect, test} from '@playwright/test'

test('le formulaire support s’hydrate et transmet la candidature', async ({page}) => {
  const erreurs: string[] = []
  page.on('pageerror', (erreur) => erreurs.push(erreur.message))
  page.on('console', (message) => {
    if (message.type() === 'error') erreurs.push(message.text())
  })

  let candidatureEnvoyee: Record<string, string> | undefined
  await page.route('**/api/support-application', async (route) => {
    candidatureEnvoyee = route.request().postDataJSON() as Record<string, string>
    await route.fulfill({status: 200, contentType: 'application/json', body: '{}'})
  })

  const response = await page.goto('/support-candidature')
  expect(response).not.toBeNull()
  const csp = (await response!.allHeaders())['content-security-policy']
  const scriptSrc = csp?.match(/script-src ([^;]*)/)?.[1] ?? ''
  const nonce = scriptSrc.match(/'nonce-([^']+)'/)?.[1]
  expect(nonce).toBeTruthy()
  expect(scriptSrc).not.toContain("'unsafe-inline'")
  const html = await response!.text()
  const scriptsEnLigne = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)]
  expect(scriptsEnLigne.length).toBeGreaterThan(0)
  for (const script of scriptsEnLigne) {
    expect(script[0]).toContain(`nonce="${nonce}"`)
  }

  await page.getByPlaceholder('Ex. 742482884069294211').fill('742482884069294211')
  await page.getByPlaceholder('Ton âge').fill('20')
  await page.getByPlaceholder('jj/mm/aaaa').fill('01/01/2006')
  await page.getByPlaceholder('Parle-nous un peu de toi...').fill('Je suis étudiant.')
  await page
    .getByPlaceholder('Pourquoi souhaites-tu rejoindre l’équipe support ?')
    .fill('Je veux aider les joueurs.')
  await page
    .getByPlaceholder('Tes idées, ton expérience et ta façon d’aider la communauté...')
    .fill('Je répondrai aux demandes.')
  await page.getByRole('button', {name: 'Envoyer ma candidature'}).click()

  await expect(page.getByRole('heading', {name: 'Formulaire envoyé'})).toBeVisible()
  expect(candidatureEnvoyee?.discordId).toBe('742482884069294211')
  expect(erreurs).toEqual([])
})

test('la confirmation et le formulaire anglais ont un nonce CSP', async ({request}) => {
  for (const chemin of [
    '/support-candidature/confirmation',
    '/en/support-application',
    '/en/support-application/confirmation',
  ]) {
    const response = await request.get(chemin)
    expect(response.ok(), chemin).toBe(true)
    const csp = response.headers()['content-security-policy'] ?? ''
    const nonce = csp.match(/script-src [^;]*'nonce-([^']+)'/)?.[1]
    expect(nonce, chemin).toBeTruthy()
    const scriptsEnLigne = [
      ...(await response.text()).matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g),
    ]
    expect(scriptsEnLigne.length, chemin).toBeGreaterThan(0)
    for (const script of scriptsEnLigne) {
      expect(script[0], chemin).toContain(`nonce="${nonce}"`)
    }
  }
})
