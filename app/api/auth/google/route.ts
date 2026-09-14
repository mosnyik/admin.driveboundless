import { randomBytes } from "crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { buildGoogleAuthUrl } from "@/lib/google-oauth"

const STATE_COOKIE = "google_oauth_state"

export async function GET() {
  const state = randomBytes(32).toString("base64url")
  const cookieStore = await cookies()

  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  })

  return NextResponse.redirect(buildGoogleAuthUrl(state))
}
