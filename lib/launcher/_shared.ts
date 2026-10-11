import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHmac,
} from 'node:crypto'
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
  return headers === undefined
    ? Response.json(data, {status})
    : Response.json(data, {status, headers})
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

export async function passwordHash(
  password: string,
  salt: Buffer | string = randomBytes(16),
) {
  const key = await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      64,
      {N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024},
      (error, derived) => (error ? reject(error) : resolve(derived as Buffer)),
    )
  })
  return {
    hash: key.toString('hex'),
    salt: typeof salt === 'string' ? salt : salt.toString('hex'),
  }
}

export async function passwordMatches(
  password: string,
  storedHash: string,
  storedSalt: string,
) {
  // Les comptes de l’ancien backend ont un sel base64url ; les nouveaux comptes
  // utilisent l’hexadécimal. Supporter les deux formats permet la migration sans
  // forcer tous les joueurs à réinitialiser leur mot de passe.
  const salt = /^[0-9a-f]{32}$/i.test(storedSalt)
    ? Buffer.from(storedSalt, 'hex')
    : storedSalt
  const actual = await passwordHash(password, salt)
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
    id: account.id,
    username: account.username,
    email: account.email,
    discordLinked: account.discordId !== null,
    discordUsername: account.discordUsername,
    discordId: account.discordId,
    steamLinked: account.steamId !== null,
    steamId: account.steamId,
  }
}

export function corsHeaders(origin: string | null) {
  const allowed = new Set(
    [
      env.NEXT_PUBLIC_URL_SITE,
      'tauri://localhost',
      'http://localhost:1420',
      'http://tauri.localhost',
      'https://tauri.localhost',
    ].filter(Boolean),
  )
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
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Hollow <${env.RESEND_FROM_EMAIL}>`,
      to: [email],
      subject,
      html: codeEmailHtml({
        code,
        purpose:
          subject.toLowerCase().includes('réinitial') ||
          subject.toLowerCase().includes('reset')
            ? 'password-reset'
            : 'email-verification',
      }),
    }),
  })
  if (!response.ok) throw new Error('Email provider rejected the message')
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  )
}

export function oauthHtmlResult(success: boolean, message: string) {
  const title = success ? 'Liaison terminée' : 'Liaison impossible'
  const accent = success ? '#6ee7a0' : '#ff5668'
  const safeMessage = escapeHtml(message)
  return new Response(
    `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#100507"><title>${title} — Hollow RP</title>
<style>:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif}*{box-sizing:border-box}body{min-height:100vh;margin:0;display:grid;place-items:center;color:#f8eeee;background:#000}body:before{content:"";position:fixed;inset:0;background:radial-gradient(circle at 50% 42%,rgba(105,0,0,.22),transparent 34%),radial-gradient(circle at 12% 88%,rgba(105,0,0,.13),transparent 34%)}.shell{position:relative;z-index:1;width:min(560px,calc(100vw - 32px));padding:1px;border-radius:28px;background:linear-gradient(145deg,rgba(105,0,0,.85),rgba(105,0,0,.22) 48%,rgba(255,255,255,.08));box-shadow:0 28px 90px #000,0 0 80px rgba(105,0,0,.12)}.card{overflow:hidden;padding:42px 34px 36px;border-radius:27px;text-align:center;background:linear-gradient(145deg,#000,#030000 56%,#180000)}.logo{width:min(270px,72vw);margin:0 auto 24px;display:block}.badge{width:58px;height:58px;margin:0 auto 18px;display:grid;place-items:center;border:1px solid ${accent};border-radius:50%;color:${accent};font-size:28px}h1{margin:0;color:${accent};font-family:Georgia,serif;font-size:clamp(27px,5vw,38px);font-weight:600}.message{margin:16px auto 0;max-width:400px;color:#eadcdd;font-size:16px;line-height:1.7}.hint{margin:9px 0 28px;color:#a99699;font-size:13px}.button{display:inline-flex;align-items:center;justify-content:center;min-width:280px;min-height:48px;padding:0 24px;border-radius:6px;color:#fff;background:#bd0000;font-size:13px;font-weight:800;text-transform:uppercase;text-decoration:none}.footer{margin-top:26px;color:#806e71;font-size:11px;letter-spacing:.1em;text-transform:uppercase}</style></head>
<body><main class="shell"><section class="card" aria-live="polite"><img class="logo" src="${env.NEXT_PUBLIC_URL_SITE}/images/logo-hollow.png" alt="Hollow RP"><div class="badge" aria-hidden="true">${success ? '✓' : '!'}</div><h1>${title}</h1><p class="message">${safeMessage}</p><p class="hint">Tu peux maintenant revenir au launcher Hollow.</p><a class="button" href="${env.NEXT_PUBLIC_URL_SITE}">← Retourner sur Hollow</a><div class="footer">Hollow RP · Ton histoire commence ici</div></section></main></body></html>`,
    {
      status: success ? 200 : 400,
      headers: {'Content-Type': 'text/html; charset=utf-8'},
    },
  )
}

export function codeEmailHtml({
  code,
  purpose,
}: {
  code: string
  purpose: 'email-verification' | 'password-reset'
}) {
  const isReset = purpose === 'password-reset'
  const eyebrow = isReset ? 'Sécurité du compte' : "Bienvenue dans l'univers Hollow"
  const title = isReset ? 'Réinitialise ton mot de passe' : 'Confirme ton adresse e-mail'
  const instruction = isReset
    ? 'Saisis ce code dans le launcher pour choisir un nouveau mot de passe.'
    : 'Saisis ce code dans le launcher pour terminer la création de ton compte.'
  const warning = isReset
    ? "Si tu n'as pas demandé cette réinitialisation, ignore ce mail."
    : "Si tu n'as pas demandé la création d'un compte, ignore ce mail."
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ton code Hollow</title></head><body style="margin:0;padding:0;background:#f3eeee;color:#21191a;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">Ton code Hollow expire dans 10 minutes.</div><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f3eeee"><tr><td align="center" style="padding:24px 12px 40px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;background:#fff9f9;border:1px solid #e7c4c8;border-radius:16px"><tr><td align="center" style="padding:16px 20px 8px;background:#100607;border-radius:16px 16px 0 0"><img src="${env.NEXT_PUBLIC_URL_SITE}/images/logo-hollow.png" width="250" alt="Hollow" style="display:block;width:100%;max-width:250px;height:auto;border:0"></td></tr><tr><td align="center" style="padding:26px 24px 32px"><p style="margin:0 0 12px;color:#9e1d2e;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">${eyebrow}</p><h1 style="margin:0 0 14px;color:#21191a;font-size:24px">${title}</h1><p style="margin:0 0 24px;color:#55484a;font-size:14px;line-height:1.6">${instruction}</p><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:330px;background:#f9e9eb;border:1px solid #dca8ae;border-radius:10px"><tr><td align="center" style="padding:18px 8px;color:#690000;font-size:30px;font-weight:700;letter-spacing:6px">${escapeHtml(code)}</td></tr></table><p style="margin:22px 0 0;color:#32282a;font-size:14px">Ce code est valable <strong>10 minutes</strong>.</p><p style="margin:17px 0 0;color:#766669;font-size:12px;line-height:1.6">${warning}<br>Ne partage jamais ce code.</p></td></tr></table><p style="margin:20px 0 0;color:#766669;font-size:11px;letter-spacing:1px;text-transform:uppercase">Hollow RP · Ton histoire commence ici</p></td></tr></table></body></html>`
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
