import {randomUUID} from 'node:crypto'
import {createSession, database, ensureAuxiliarySchema, error, passwordHash, publicUser, sendCode, sixDigitCode, codeDigest, stringField, parseJson, json, passwordMatches, currentAccount, hash} from './_shared'

export async function register(request: Request) {
  const body = await parseJson(request)
  const username = stringField(body, 'username'), email = stringField(body, 'email').toLowerCase(), password = stringField(body, 'password')
  if (!username || !email || password.length < 8) return error('Pseudo, e-mail et mot de passe valide requis')
  await ensureAuxiliarySchema()
  const sql = database()
  const existing = await sql`select id from launcher_accounts where lower(username) = lower(${username}) or lower(email) = ${email} limit 1`
  if (existing.length) return error('Ce pseudo ou cette adresse e-mail est déjà utilisé', 409)
  const pending = await sql`select id, last_sent_at from launcher_email_verifications where lower(email) = ${email} and expires_at > now() limit 1`
  const currentPending = pending[0] as {last_sent_at?: string} | undefined
  if (currentPending?.last_sent_at && Date.now() - new Date(currentPending.last_sent_at).getTime() < 60_000) return error('Veuillez attendre avant de renvoyer un code', 429)
  const id = randomUUID(), code = sixDigitCode(), passwordData = await passwordHash(password)
  await sql`insert into launcher_email_verifications (id, username, email, password_hash, password_salt, code_hash, expires_at) values (${id}, ${username}, ${email}, ${passwordData.hash}, ${passwordData.salt}, ${codeDigest(id, code)}, now() + interval '10 minutes') on conflict (id) do nothing`
  await sendCode(email, 'Votre code de vérification Hollow', code)
  return json({verificationId: id, email, expiresInSeconds: 600, resendAfterSeconds: 60}, 202)
}

export async function resendEmail(request: Request) {
  const body = await parseJson(request), id = stringField(body, 'verificationId'), sql = database()
  const rows = await sql`select * from launcher_email_verifications where id = ${id} and expires_at > now() limit 1`
  const pending = rows[0] as Record<string, unknown> | undefined
  if (!pending) return error('Vérification invalide ou expirée')
  if (Date.now() - new Date(String(pending.last_sent_at)).getTime() < 60_000) return error('Veuillez attendre avant de renvoyer un code', 429)
  const code = sixDigitCode()
  await sql`update launcher_email_verifications set code_hash = ${codeDigest(id, code)}, last_sent_at = now() where id = ${id}`
  await sendCode(String(pending.email), 'Votre code de vérification Hollow', code)
  return json({ok: true, resendAfterSeconds: 60})
}

export async function verifyEmail(request: Request) {
  const body = await parseJson(request), id = stringField(body, 'verificationId'), code = stringField(body, 'code')
  const sql = database(), rows = await sql`select * from launcher_email_verifications where id = ${id} and expires_at > now() limit 1`
  const pending = rows[0] as Record<string, unknown> | undefined
  if (!pending || Number(pending.attempts) >= 5) return error('Code invalide ou expiré', 400)
  if (codeDigest(id, code) !== pending.code_hash) { await sql`update launcher_email_verifications set attempts = attempts + 1 where id = ${id}`; return error('Code invalide ou expiré', 400) }
  const account = await sql`insert into launcher_accounts (username, email, password_hash, password_salt) values (${pending.username}, ${pending.email}, ${pending.password_hash}, ${pending.password_salt}) returning id, username, email, discord_id as "discordId", discord_username as "discordUsername", steam_id as "steamId"`
  await sql`delete from launcher_email_verifications where id = ${id}`
  const user = account[0] as Parameters<typeof publicUser>[0] | undefined
  if (!user) return error('Création du compte impossible', 500)
  return json({token: await createSession(String(user.id)), user: publicUser(user)}, 201)
}

export async function login(request: Request) {
  const body = await parseJson(request)
  // Le launcher historique envoie `username`, tandis que le contrat public utilise
  // `identity`. Accepter aussi `email` évite un 401 trompeur lorsque le client est
  // encore sur l’ancien contrat.
  const identity = stringField(body, 'identity') || stringField(body, 'username') || stringField(body, 'email')
  const password = stringField(body, 'password')
  const sql = database(), rows = await sql`select id, username, email, password_hash as "passwordHash", password_salt as "passwordSalt", discord_id as "discordId", discord_username as "discordUsername", steam_id as "steamId" from launcher_accounts where lower(username) = lower(${identity}) or lower(email) = lower(${identity}) limit 1`
  const account = rows[0] as (Parameters<typeof publicUser>[0] & {passwordHash: string; passwordSalt: string}) | undefined
  if (!account || !(await passwordMatches(password, account.passwordHash, account.passwordSalt))) return error('Identifiants invalides', 401)
  return json({token: await createSession(account.id), user: publicUser(account)})
}

export async function session(request: Request) {
  const account = await currentAccount(request)
  return account ? json({user: publicUser(account)}) : error('Session invalide', 401)
}

export async function logout(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (token) await database()`update launcher_sessions set revoked_at = now() where token_hash = ${hash(token)} and revoked_at is null`
  return json({ok: true})
}

export async function changePassword(request: Request) {
  const account = await currentAccount(request); if (!account) return error('Session invalide', 401)
  const body = await parseJson(request), currentPassword = stringField(body, 'currentPassword'), newPassword = stringField(body, 'newPassword')
  const sql = database(), rows = await sql`select password_hash as "passwordHash", password_salt as "passwordSalt" from launcher_accounts where id = ${account.id}`
  const stored = rows[0] as {passwordHash: string; passwordSalt: string} | undefined
  if (!stored || !(await passwordMatches(currentPassword, stored.passwordHash, stored.passwordSalt)) || newPassword.length < 8) return error('Mot de passe actuel ou nouveau mot de passe invalide', 400)
  const next = await passwordHash(newPassword)
  await sql`update launcher_accounts set password_hash = ${next.hash}, password_salt = ${next.salt}, updated_at = now() where id = ${account.id}`
  await sql`update launcher_sessions set revoked_at = now() where account_id = ${account.id}`
  return json({ok: true})
}
