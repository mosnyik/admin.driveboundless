import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { createSessionToken, setSessionCookie } from "@/lib/auth"
import { getUserByEmail } from "@/lib/users"
import { resolveGoogleIdentity } from "@/lib/google-oauth"

const STATE_COOKIE = "google_oauth_state"

function loginError(request: NextRequest, error: string) {
  const url = new URL("/login", request.url)
  url.searchParams.set("error", error)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(STATE_COOKIE)?.value
  cookieStore.delete(STATE_COOKIE)

  if (!code || !state || !expectedState || state !== expectedState) {
    return loginError(request, "state")
  }

  let identity: Awaited<ReturnType<typeof resolveGoogleIdentity>>

  try {
    identity = await resolveGoogleIdentity(code)
  } catch (error) {
    console.error("Google sign-in failed", error)
    return loginError(request, "google")
  }

  if (!identity.emailVerified) {
    return loginError(request, "unverified")
  }

  const user = await getUserByEmail(identity.email)

  if (!user || !user.active) {
    return loginError(request, "not_approved")
  }

  const token = await createSessionToken({ userId: user.id, email: user.email, role: user.role })
  await setSessionCookie(token)

  return NextResponse.redirect(new URL("/", request.url))
}
