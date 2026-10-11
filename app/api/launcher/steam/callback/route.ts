import {database, error, hash, oauthHtmlResult} from '@/lib/launcher/_shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams, state = params.get('state'), claimedId = params.get('openid.claimed_id')
  if (!params.get('openid.mode') || !state || !claimedId) return error('Callback Steam invalide', 400)
  const sql = database(), flows = await sql`select id, account_id as "accountId" from launcher_oauth_flows where provider = 'steam' and expires_at > now() and completed_at is null and state_hash = ${hash(state)} limit 1`
  const flow = flows[0] as {id: string; accountId: string} | undefined
  if (!flow) return error('Flux Steam invalide ou expiré', 400)
  const steamId = claimedId.split('/').pop()
  if (!steamId) return error('Identifiant Steam invalide', 400)
  const verification = new URLSearchParams(params)
  verification.set('openid.mode', 'check_authentication')
  const verified = await fetch('https://steamcommunity.com/openid/login', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: verification})
  const text = await verified.text()
  if (!verified.ok || !text.includes('is_valid:true')) { await sql`update launcher_oauth_flows set error = 'steam_assertion' where id = ${flow.id}`; return error('Échec de la validation Steam', 502) }
  await sql`update launcher_accounts set steam_id = ${steamId}, steam_linked_at = now(), updated_at = now() where id = ${flow.accountId}`
  await sql`update launcher_oauth_flows set completed_at = now() where id = ${flow.id}`
  return oauthHtmlResult(true, 'La liaison Steam est terminée. Vous pouvez fermer cette fenêtre.')
}
