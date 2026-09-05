import "server-only"

import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

const SESSION_COOKIE = "db_admin_session"
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET environment variable is missing or too short (needs 32+ characters).",
    )
  }

  return new TextEncoder().encode(secret)
}

export type AppUserRole = "admin" | "owner"

export interface AdminSession {
  userId: string
  email: string
  role: AppUserRole
  issuedAt: number
}

export async function createSessionToken({
  userId,
  email,
  role,
}: {
  userId: string
  email: string
  role: AppUserRole
}) {
  return new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey())
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())

    if (
      typeof payload.email !== "string" ||
      typeof payload.userId !== "string" ||
      (payload.role !== "admin" && payload.role !== "owner")
    ) {
      return null
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      issuedAt: (payload.iat ?? 0) * 1000,
    }
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  return verifySessionToken(token)
}

export { SESSION_COOKIE }
