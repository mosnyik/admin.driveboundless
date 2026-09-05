import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createSessionToken, setSessionCookie } from "@/lib/auth"
import { getUserByEmail } from "@/lib/users"

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

  const user = await getUserByEmail(email)
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false

  if (!user || !user.active || !passwordMatches) {
    recordFailure(clientKey)
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
  }

  clearFailures(clientKey)

  const token = await createSessionToken({ userId: user.id, email: user.email, role: user.role })
  await setSessionCookie(token)

  return NextResponse.json({ ok: true, mustChangePassword: user.mustChangePassword })
}
