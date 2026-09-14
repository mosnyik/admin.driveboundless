import "server-only"

import { createRemoteJWKSet, jwtVerify } from "jose"

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
const ISSUER_VALUES = ["https://accounts.google.com", "accounts.google.com"]

const jwks = createRemoteJWKSet(new URL(JWKS_URL))

function getClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error("Missing GOOGLE_CLIENT_ID environment variable.")
  return clientId
}

function getClientSecret() {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientSecret) throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable.")
  return clientSecret
}

export function getRedirectUri() {
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")
  return `${appUrl}/api/auth/google/callback`
}

export function buildGoogleAuthUrl(state: string) {
  const url = new URL(AUTH_URL)
  url.searchParams.set("client_id", getClientId())
  url.searchParams.set("redirect_uri", getRedirectUri())
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", "openid email profile")
  url.searchParams.set("state", state)
  url.searchParams.set("prompt", "select_account")
  return url.toString()
}

interface GoogleIdentity {
  email: string
  emailVerified: boolean
}

/** Exchanges the authorization code for tokens and verifies the ID token's
 * signature/issuer/audience against Google's published keys, so the email
 * it returns can be trusted without an extra userinfo round trip. */
export async function resolveGoogleIdentity(code: string): Promise<GoogleIdentity> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status}`)
  }

  const { id_token: idToken } = await response.json()
  if (typeof idToken !== "string") {
    throw new Error("Google did not return an ID token.")
  }

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: ISSUER_VALUES,
    audience: getClientId(),
  })

  if (typeof payload.email !== "string") {
    throw new Error("Google ID token did not include an email address.")
  }

  return {
    email: payload.email.trim().toLowerCase(),
    emailVerified: payload.email_verified === true,
  }
}
