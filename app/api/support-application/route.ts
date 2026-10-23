import {NextResponse} from 'next/server'
import {z} from 'zod'
import {env} from '@/lib/env'

function dateValide(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return false
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date <= new Date()
  )
}

const reponse = z
  .string()
  .trim()
  .min(10, 'Cette réponse doit contenir au moins 10 caractères.')
  .max(4000, 'Cette réponse ne peut pas dépasser 4 000 caractères.')

const candidature = z.object({
  discordId: z
    .string()
    .trim()
    .regex(/^\d{17,20}$/, 'L’identifiant Discord doit contenir 17 à 20 chiffres.'),
  age: z
    .string()
    .regex(/^(?:1[3-9]|[2-9][0-9])$/, 'L’âge doit être compris entre 13 et 99 ans.'),
  birthDate: z
    .string()
    .regex(
      /^(?:0[1-9]|[12][0-9]|3[01])\/(?:0[1-9]|1[0-2])\/[0-9]{4}$/,
      'Utilise une date au format jj/mm/aaaa.',
    )
    .refine(dateValide, 'La date de naissance doit être une date réelle et passée.'),
  presentation: reponse,
  motivations: reponse,
  contribution: reponse,
})

const defaultSupportApiUrl =
  'https://hollow-adminstration.vercel.app/api/recruitment?scope=support'

export async function POST(request: Request) {
  const parsed = candidature.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !fields[field]) fields[field] = issue.message
    }
    return NextResponse.json(
      {message: 'Vérifie les champs indiqués ci-dessous.', fields},
      {status: 400},
    )
  }

  const token = process.env.SUPPORT_API_TOKEN ?? env.TICKETS_API_TOKEN
  if (!token) {
    return NextResponse.json(
      {message: 'Le formulaire n’est pas encore connecté au site de modération.'},
      {status: 503},
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
