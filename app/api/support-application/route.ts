import {NextResponse} from 'next/server'
import {z} from 'zod'
import {env} from '@/lib/env'

const candidature = z.object({
  discordId: z.string().trim().min(2).max(40),
  age: z.string().regex(/^(?:1[3-9]|[2-9][0-9])$/),
  birthDate: z
    .string()
    .regex(/^(?:0[1-9]|[12][0-9]|3[01])\/(?:0[1-9]|1[0-2])\/[0-9]{4}$/),
  presentation: z.string().trim().min(10).max(4000),
  motivations: z.string().trim().min(10).max(4000),
  contribution: z.string().trim().min(10).max(4000),
})

const defaultSupportApiUrl =
  'https://hollow-adminstration.vercel.app/api/recruitment?scope=support'

export async function POST(request: Request) {
  const token = process.env.SUPPORT_API_TOKEN ?? env.TICKETS_API_TOKEN
  if (!token) {
    return NextResponse.json(
      {message: 'Le formulaire n’est pas encore connecté au site de modération.'},
      {status: 503},
    )
  }

  const parsed = candidature.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      {message: 'Vérifie les réponses du formulaire.'},
      {status: 400},
    )
  }

  const response = await fetch(process.env.SUPPORT_API_URL ?? defaultSupportApiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'submit',
      scope: 'support',
      ...parsed.data,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) {
    return NextResponse.json(
      {message: 'Le site de modération a refusé la candidature. Réessaie plus tard.'},
      {status: response.status >= 500 ? 502 : response.status},
    )
  }

  return NextResponse.json({ok: true})
}
