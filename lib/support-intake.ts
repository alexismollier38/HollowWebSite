import {env} from '@/lib/env'

const defaultSupportApiUrl =
  'https://hollow-adminstration.vercel.app/api/recruitment?scope=support'

export const supportApiUrl = () => process.env.SUPPORT_API_URL ?? defaultSupportApiUrl
export const supportToken = () => process.env.SUPPORT_API_TOKEN ?? env.TICKETS_API_TOKEN

export async function getSupportIntakeOpen(): Promise<boolean | null> {
  const token = supportToken()
  if (!token) return null
  try {
    const url = new URL(supportApiUrl())
    url.searchParams.set('view', 'availability')
    const response = await fetch(url, {
      headers: {Authorization: `Bearer ${token}`},
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) return null
    const result = (await response.json()) as {open?: boolean}
    return typeof result.open === 'boolean' ? result.open : null
  } catch {
    return null
  }
}
