import {database, error, hash} from '@/lib/launcher/_shared'
import {env} from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams, state = params.get('state'), code = params.get('code')
  if (!state || !code || !env.LAUNCHER_DISCORD_CLIENT_ID || !env.LAUNCHER_DISCORD_CLIENT_SECRET) return error('Callback Discord invalide', 400)
  const sql = database(), flows = await sql`select id, account_id as "accountId" from launcher_oauth_flows where provider = 'discord' and state_hash = ${hash(state)} and completed_at is null and expires_at > now() limit 1`
  const flow = flows[0] as {id: string; accountId: string} | undefined
  if (!flow) return error('Flux Discord invalide ou expiré', 400)
  const base = env.LAUNCHER_BASE_URL ?? env.NEXT_PUBLIC_URL_SITE
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams({client_id: env.LAUNCHER_DISCORD_CLIENT_ID, client_secret: env.LAUNCHER_DISCORD_CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: `${base}/api/launcher/discord/callback`})})
  if (!tokenResponse.ok) { await sql`update launcher_oauth_flows set error = 'discord_token_exchange' where id = ${flow.id}`; return error('Échec de la liaison Discord', 502) }
  const token = await tokenResponse.json() as {access_token?: string}
  const userResponse = await fetch('https://discord.com/api/users/@me', {headers: {Authorization: `Bearer ${token.access_token ?? ''}`}})
  if (!userResponse.ok) { await sql`update launcher_oauth_flows set error = 'discord_profile' where id = ${flow.id}`; return error('Profil Discord indisponible', 502) }
  const discordUser = await userResponse.json() as {id: string; username: string}
  await sql`update launcher_accounts set discord_id = ${discordUser.id}, discord_username = ${discordUser.username}, discord_linked_at = now(), updated_at = now() where id = ${flow.accountId}`
  await sql`update launcher_oauth_flows set completed_at = now() where id = ${flow.id}`
  return new Response('<!doctype html><title>Hollow</title><p>La liaison Discord est terminée. Vous pouvez fermer cette fenêtre.</p>', {headers: {'Content-Type': 'text/html; charset=utf-8'}})
}
