import {afterEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/env', () => ({env: {TICKETS_API_TOKEN: undefined}}))

import {getSupportIntakeOpen} from './support-intake'

const originalToken = process.env.SUPPORT_API_TOKEN
const originalUrl = process.env.SUPPORT_API_URL

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalToken === undefined) delete process.env.SUPPORT_API_TOKEN
  else process.env.SUPPORT_API_TOKEN = originalToken
  if (originalUrl === undefined) delete process.env.SUPPORT_API_URL
  else process.env.SUPPORT_API_URL = originalUrl
})

describe('état des candidatures Support', () => {
  it('lit l’état avec le jeton côté serveur, sans mise en cache', async () => {
    process.env.SUPPORT_API_TOKEN = 'secret-test'
    process.env.SUPPORT_API_URL =
      'https://moderation.example/api/recruitment?scope=support'
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({open: false}), {status: 200}))
    vi.stubGlobal('fetch', fetchMock)

    expect(await getSupportIntakeOpen()).toBe(false)
    const url = fetchMock.mock.calls[0]?.[0]
    const options = fetchMock.mock.calls[0]?.[1]
    expect(String(url)).toContain('scope=support&view=availability')
    expect(options.headers.Authorization).toBe('Bearer secret-test')
    expect(options.cache).toBe('no-store')
  })

  it('ne présente pas le formulaire si la disponibilité ne peut pas être confirmée', async () => {
    process.env.SUPPORT_API_TOKEN = 'secret-test'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('hors ligne')))
    expect(await getSupportIntakeOpen()).toBeNull()
  })
})
