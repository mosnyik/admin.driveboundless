import "server-only"

import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { getUserById } from "@/lib/users"

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

const VIEW_AS_COMPANY_COOKIE = "db_view_as_company"

/** Doesn't need signing — it only ever takes effect for a real admin session
 * (checked first in getCallerScope below), so a forged value on a non-admin
 * session does nothing. */
export async function getViewAsCompanyId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(VIEW_AS_COMPANY_COOKIE)?.value ?? null
}

export async function setViewAsCompanyCookie(companyId: string | null) {
  const cookieStore = await cookies()

  if (companyId) {
    cookieStore.set(VIEW_AS_COMPANY_COOKIE, companyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })
  } else {
    cookieStore.delete(VIEW_AS_COMPANY_COOKIE)
  }
}

export type CallerScope = { role: "admin" } | { role: "owner"; companyId: string | null }

/** Admin resolves straight from the session (no DB hit) unless a "view as
 * company" override is active, in which case it's treated as that company's
 * owner for scoping purposes — session.email (audit trails) is unaffected.
 * A real owner does one fresh lookup for companyId so a reassignment takes
 * effect immediately, same as the active-account check in app/(app)/layout.tsx. */
export async function getCallerScope(): Promise<CallerScope | null> {
  const session = await getSession()
  if (!session) return null

  if (session.role === "admin") {
    const viewAsCompanyId = await getViewAsCompanyId()
    if (viewAsCompanyId) {
      return { role: "owner", companyId: viewAsCompanyId }
    }
    return { role: "admin" }
  }

  const user = await getUserById(session.userId)
  return { role: "owner", companyId: user?.companyId ?? null }
}

export { SESSION_COOKIE }
