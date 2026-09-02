import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createSessionToken, setSessionCookie } from "@/lib/auth"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

const attempts = new Map<string, { count: number; lockedUntil: number }>()

function getClientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
}

function isLockedOut(key: string) {
  const entry = attempts.get(key)
  if (!entry) return false
  if (entry.lockedUntil && entry.lockedUntil > Date.now()) return true
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) attempts.delete(key)
  return false
}

function recordFailure(key: string) {
  const entry = attempts.get(key) ?? { count: 0, lockedUntil: 0 }
  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS
  }
  attempts.set(key, entry)
}

function clearFailures(key: string) {
  attempts.delete(key)
}

export async function POST(request: Request) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
    console.error("ADMIN_EMAIL or ADMIN_PASSWORD_HASH is not configured.")
    return NextResponse.json({ error: "Admin login is not configured yet." }, { status: 500 })
  }

  const clientKey = getClientKey(request)

  if (isLockedOut(clientKey)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 },
    )
  }

  let body: { email?: string; password?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
  }

  const emailMatches = email === ADMIN_EMAIL.trim().toLowerCase()
  const passwordMatches = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)

  if (!emailMatches || !passwordMatches) {
    recordFailure(clientKey)
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
  }

  clearFailures(clientKey)

  const token = await createSessionToken(email)
  await setSessionCookie(token)

  return NextResponse.json({ ok: true })
}
