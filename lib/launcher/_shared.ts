import {createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac} from 'node:crypto'
import {neon} from '@neondatabase/serverless'
import {env} from '@/lib/env'

export const SESSION_DAYS = 30
export const CODE_TTL_MINUTES = 10

export type Account = {
  id: string
  username: string
  email: string
  discordId: string | null
  discordUsername: string | null
  steamId: string | null
}

export function database() {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  return neon(env.DATABASE_URL)
}

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return headers === undefined ? Response.json(data, {status}) : Response.json(data, {status, headers})
}

export function error(message: string, status = 400) {
  return json({error: message}, status)
}

export function hash(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function hmacSecret() {
  return env.EMAIL_VERIFICATION_SECRET ?? env.RESEND_API_KEY ?? 'development-only-secret'
}

export function codeDigest(id: string, code: string) {
  return createHmac('sha256', hmacSecret()).update(`${id}:${code}`).digest('hex')
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}

export async function passwordHash(password: string, salt = randomBytes(16)) {
  const key = await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, {N: 16384, r: 8, p: 1}, (error, derived) => error ? reject(error) : resolve(derived as Buffer))
  })
  return {hash: key.toString('hex'), salt: salt.toString('hex')}
}

export async function passwordMatches(password: string, storedHash: string, storedSalt: string) {
  const actual = await passwordHash(password, Buffer.from(storedSalt, 'hex'))
  const expected = Buffer.from(storedHash, 'hex')
  const received = Buffer.from(actual.hash, 'hex')
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export function bearer(request: Request) {
  const value = request.headers.get('authorization')
  return value?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null
}

export async function currentAccount(request: Request) {
  const token = bearer(request)
  if (!token) return null
  const sql = database()
  const rows = await sql`
    select a.id, a.username, a.email, a.discord_id as "discordId",
      a.discord_username as "discordUsername", a.steam_id as "steamId"
    from launcher_sessions s join launcher_accounts a on a.id = s.account_id
    where s.token_hash = ${hash(token)} and s.revoked_at is null and s.expires_at > now()
    limit 1`
  return (rows[0] as Account | undefined) ?? null
}

export async function createSession(accountId: string) {
  const token = randomToken()
  const sql = database()
  await sql`
    insert into launcher_sessions (token_hash, account_id, expires_at)
    values (${hash(token)}, ${accountId}, now() + interval '30 days')`
  return token
}

export function publicUser(account: Account) {
  return {
    id: account.id, username: account.username, email: account.email,
    discordLinked: account.discordId !== null, discordUsername: account.discordUsername,
    discordId: account.discordId, steamLinked: account.steamId !== null, steamId: account.steamId,
  }
}

export function corsHeaders(origin: string | null) {
  const allowed = new Set([
    env.NEXT_PUBLIC_URL_SITE,
    'tauri://localhost', 'http://localhost:1420', 'http://tauri.localhost', 'https://tauri.localhost',
  ].filter(Boolean))
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
  })
  if (origin && allowed.has(origin)) headers.set('Access-Control-Allow-Origin', origin)
  return headers
}

export function withCors(response: Response, origin: string | null) {
  const headers = new Headers(response.headers)
  for (const [key, value] of corsHeaders(origin)) headers.set(key, value)
  return new Response(response.body, {status: response.status, headers})
}

export async function ensureAuxiliarySchema() {
  const sql = database()
  await sql`
    create table if not exists launcher_email_verifications (
      id uuid primary key, username text not null, email text not null,
      password_hash text not null, password_salt text not null, code_hash text not null,
      attempts integer not null default 0, expires_at timestamptz not null,
      last_sent_at timestamptz not null default now()
    )`
  await sql`
    create table if not exists launcher_password_resets (
      id uuid primary key, account_id uuid not null references launcher_accounts(id) on delete cascade,
      code_hash text not null, attempts integer not null default 0, expires_at timestamptz not null,
      last_sent_at timestamptz not null default now()
    )`
}

export async function sendCode(email: string, subject: string, code: string) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    if (env.NODE_ENV === 'production') throw new Error('Email service is not configured')
    return
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: {'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({from: env.RESEND_FROM_EMAIL, to: [email], subject, html: `<p>Votre code Hollow : <strong>${code}</strong></p><p>Il expire dans 10 minutes.</p>`}),
  })
  if (!response.ok) throw new Error('Email provider rejected the message')
}

export function sixDigitCode() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
}

export function parseJson(request: Request) {
  return request.json() as Promise<Record<string, unknown>>
}

export function stringField(body: Record<string, unknown>, name: string) {
  const value = body[name]
  return typeof value === 'string' ? value.trim() : ''
}
