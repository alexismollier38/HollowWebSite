import {changePassword, login, logout, register, resendEmail, session, verifyEmail} from '@/lib/launcher/auth'
import {database, error, currentAccount, parseJson, stringField, json, withCors, hash, randomToken, ensureAuxiliarySchema} from '@/lib/launcher/_shared'
import {randomUUID} from 'node:crypto'
import {env} from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function passwordResetRequest(request: Request) {
  await ensureAuxiliarySchema()
  const body = await parseJson(request), email = stringField(body, 'email').toLowerCase(), sql = database()
  const account = (await sql`select id, email from launcher_accounts where lower(email) = ${email} limit 1`)[0] as {id: string; email: string} | undefined
  if (account) {
    const id = randomUUID(), code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
    const {codeDigest, sendCode} = await import('@/lib/launcher/_shared')
    await sql`insert into launcher_password_resets (id, account_id, code_hash, expires_at, last_sent_at) values (${id}, ${account.id}, ${codeDigest(id, code)}, now() + interval '10 minutes', now())`
    await sendCode(account.email, 'Réinitialisation de votre mot de passe Hollow', code)
  }
  return json({ok: true})
}

async function passwordResetConfirm(request: Request) {
  const body = await parseJson(request), id = stringField(body, 'resetId'), code = stringField(body, 'code'), newPassword = stringField(body, 'newPassword'), sql = database()
  if (newPassword.length < 8) return error('Mot de passe invalide')
  const rows = await sql`select * from launcher_password_resets where id = ${id} and expires_at > now() limit 1`, reset = rows[0] as Record<string, unknown> | undefined
  const {codeDigest, passwordHash} = await import('@/lib/launcher/_shared')
  if (!reset || Number(reset.attempts) >= 5 || codeDigest(id, code) !== reset.code_hash) {
    if (reset) await sql`update launcher_password_resets set attempts = attempts + 1 where id = ${id}`
    return error('Code invalide ou expiré')
  }
  const next = await passwordHash(newPassword)
  await sql`update launcher_accounts set password_hash = ${next.hash}, password_salt = ${next.salt}, updated_at = now() where id = ${reset.account_id}`
  await sql`update launcher_sessions set revoked_at = now() where account_id = ${reset.account_id}`
  await sql`delete from launcher_password_resets where id = ${id}`
  return json({ok: true})
}

async function avatars(request: Request) {
  const account = await currentAccount(request); if (!account) return error('Session invalide', 401)
  const sql = database(), rows = await sql`select discord_id as "discordId", steam_id as "steamId" from launcher_accounts where id = ${account.id}`
  const row = rows[0] as {discordId: string | null; steamId: string | null} | undefined
  const discordAvatarUrl = row?.discordId && env.TICKETS_API_TOKEN ? await externalAvatar(row.discordId) : null
  const steamAvatarUrl = row?.steamId ? `https://avatars.steamstatic.com/${row.steamId}_full.jpg` : null
  return json({discordAvatarUrl, steamAvatarUrl})
}

async function externalAvatar(discordId: string) {
  try {
    const response = await fetch(`https://hollow-adminstration.vercel.app/api/launcher-avatar?discordId=${encodeURIComponent(discordId)}`, {headers: {Authorization: `Bearer ${env.TICKETS_API_TOKEN}`}, cache: 'no-store'})
    if (!response.ok) return null
    const data = await response.json() as {avatarUrl?: string}
    return data.avatarUrl ?? null
  } catch { return null }
}

async function ticket(request: Request, reply = false) {
  const account = await currentAccount(request); if (!account) return error('Session invalide', 401)
  if (!env.TICKETS_API_TOKEN) return error('Support indisponible', 503)
  const body = await parseJson(request), payload = {...body, accountId: account.id, requesterDiscordId: account.discordId, ...(reply ? {reply: true} : {})}
  if (reply && !account.discordId) return error('Un compte Discord lié est requis', 403)
  const response = await fetch('https://hollow-adminstration.vercel.app/api/tickets', {method: 'POST', headers: {'Authorization': `Bearer ${env.TICKETS_API_TOKEN}`, 'Content-Type': 'application/json'}, body: JSON.stringify(payload)})
  return new Response(await response.text(), {status: response.status, headers: {'Content-Type': response.headers.get('content-type') ?? 'application/json'}})
}

async function tickets(request: Request) {
  const account = await currentAccount(request); if (!account) return error('Session invalide', 401)
  if (!account.discordId || !env.TICKETS_API_TOKEN) return error('Un compte Discord lié est requis', 403)
  const response = await fetch(`https://hollow-adminstration.vercel.app/api/tickets?requesterDiscordId=${encodeURIComponent(account.discordId)}`, {headers: {Authorization: `Bearer ${env.TICKETS_API_TOKEN}`}, cache: 'no-store'})
  return new Response(await response.text(), {status: response.status, headers: {'Content-Type': response.headers.get('content-type') ?? 'application/json'}})
}

async function flow(request: Request) {
  const account = await currentAccount(request); if (!account) return error('Session invalide', 401)
  await ensureAuxiliarySchema()
  const body = await parseJson(request), provider = stringField(body, 'provider')
  if (provider !== 'discord' && provider !== 'steam') return error('Fournisseur OAuth invalide')
  const id = randomUUID(), state = randomToken(), secret = randomToken(), sql = database()
  await sql`insert into launcher_oauth_flows (id, account_id, provider, state_hash, secret_hash, expires_at) values (${id}, ${account.id}, ${provider}, ${hash(state)}, ${hash(secret)}, now() + interval '10 minutes')`
  const base = env.LAUNCHER_BASE_URL ?? env.NEXT_PUBLIC_URL_SITE
  const authorizeUrl = provider === 'discord'
    ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(env.LAUNCHER_DISCORD_CLIENT_ID ?? '')}&redirect_uri=${encodeURIComponent(`${base}/api/launcher/discord/callback`)}&response_type=code&scope=identify&state=${encodeURIComponent(state)}`
    : `https://steamcommunity.com/openid/login?openid.ns=http://specs.openid.net/auth/2.0&openid.mode=checkid_setup&openid.return_to=${encodeURIComponent(`${base}/api/launcher/steam/callback?state=${state}`)}&openid.realm=${encodeURIComponent(base ?? '')}`
  return json({id, secret, authorizeUrl}, 201)
}

async function flowStatus(request: Request) {
  const params = new URL(request.url).searchParams, id = params.get('id'), secret = params.get('secret')
  if (!id || !secret) return error('Flux invalide', 400)
  const rows = await database()`select completed_at as "completedAt", expires_at as "expiresAt", error from launcher_oauth_flows where id = ${id} and secret_hash = ${hash(secret)} limit 1`
  const row = rows[0] as {completedAt: string | null; expiresAt: string; error: string | null} | undefined
  if (!row) return error('Flux invalide', 404)
  if (new Date(row.expiresAt) < new Date()) return json({expired: true})
  return json({complete: row.completedAt !== null, error: row.error})
}

export async function OPTIONS(request: Request) { return withCors(new Response(null, {status: 204}), request.headers.get('origin')) }

export async function GET(request: Request) {
  const action = new URL(request.url).searchParams.get('action')
  const response = action === 'session' ? await session(request) : action === 'avatars' ? await avatars(request) : action === 'tickets' ? await tickets(request) : action === 'flow-status' ? await flowStatus(request) : error('Action inconnue', 404)
  return withCors(response, request.headers.get('origin'))
}

export async function PATCH(request: Request) {
  const response = new URL(request.url).searchParams.get('action') === 'session' ? await changePassword(request) : error('Action inconnue', 404)
  return withCors(response, request.headers.get('origin'))
}

export async function POST(request: Request) {
  const action = new URL(request.url).searchParams.get('action')
  const response = action === 'register' ? await register(request)
    : action === 'verify-email' ? await verifyEmail(request)
    : action === 'resend-email' ? await resendEmail(request)
    : action === 'login' ? await login(request)
    : action === 'logout' ? await logout(request)
    : action === 'password-reset-request' ? await passwordResetRequest(request)
    : action === 'password-reset-confirm' ? await passwordResetConfirm(request)
    : action === 'flow' ? await flow(request)
    : action === 'ticket' ? await ticket(request)
    : action === 'ticket-reply' ? await ticket(request, true)
    : error('Action inconnue', 404)
  return withCors(response, request.headers.get('origin'))
}
