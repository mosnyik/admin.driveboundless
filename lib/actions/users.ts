"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { getSession, getViewAsCompanyId } from "@/lib/auth"
import { sanityMutate } from "@/lib/sanity"
import { getUserByEmail, getUserById } from "@/lib/users"
import type { AppUserRole } from "@/lib/user-types"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const BCRYPT_COST = 12

/** Also unavailable while "viewing as" a company — an impersonating admin
 * shouldn't retain admin-only powers a real owner wouldn't have. The one
 * exception is exiting impersonation itself (setViewAsCompany), which checks
 * the real session directly instead of going through this. */
export async function requireAdmin() {
  const session = await getSession()
  if (!session) throw new Error("You must be signed in to do that.")
  if (session.role !== "admin") throw new Error("Only an administrator can do that.")

  const viewAsCompanyId = await getViewAsCompanyId()
  if (viewAsCompanyId) throw new Error('Exit "View as" mode to do that.')

  return session
}

function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }
}

export async function createUser({
  email,
  role,
  initialPassword,
  companyId,
}: {
  email: string
  role: AppUserRole
  initialPassword: string
  companyId: string | null
}) {
  await requireAdmin()

  const cleanedEmail = email.trim().toLowerCase()

  if (!EMAIL_PATTERN.test(cleanedEmail)) {
    throw new Error(`"${cleanedEmail}" doesn't look like a valid email address.`)
  }

  if (role !== "admin" && role !== "owner") {
    throw new Error("Invalid role.")
  }

  if (role === "owner" && !companyId) {
    throw new Error("Choose which company this owner belongs to.")
  }

  validatePassword(initialPassword)

  const existing = await getUserByEmail(cleanedEmail)
  if (existing) {
    throw new Error(`An account already exists for ${cleanedEmail}.`)
  }

  const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_COST)
  const now = new Date().toISOString()

  await sanityMutate([
    {
      create: {
        _type: "appUser",
        email: cleanedEmail,
        role,
        passwordHash,
        active: true,
        mustChangePassword: true,
        company: role === "owner" && companyId ? { _type: "reference", _ref: companyId } : undefined,
        createdAt: now,
        updatedAt: now,
      },
    },
  ])

  revalidatePath("/settings")

  return { ok: true as const }
}

export async function setUserCompany(userId: string, companyId: string) {
  await requireAdmin()

  if (!companyId) {
    throw new Error("Choose a company.")
  }

  await sanityMutate([
    {
      patch: {
        id: userId,
        set: {
          company: { _type: "reference", _ref: companyId },
          updatedAt: new Date().toISOString(),
        },
      },
    },
  ])

  revalidatePath("/settings")

  return { ok: true as const }
}

export async function setUserActive(userId: string, active: boolean) {
  const session = await requireAdmin()

  if (userId === session.userId && !active) {
    throw new Error("You can't deactivate your own account.")
  }

  await sanityMutate([
    { patch: { id: userId, set: { active, updatedAt: new Date().toISOString() } } },
  ])

  revalidatePath("/settings")

  return { ok: true as const }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin()

  validatePassword(newPassword)

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST)

  await sanityMutate([
    {
      patch: {
        id: userId,
        set: { passwordHash, mustChangePassword: true, updatedAt: new Date().toISOString() },
      },
    },
  ])

  revalidatePath("/settings")

  return { ok: true as const }
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const session = await getSession()
  if (!session) throw new Error("You must be signed in to do that.")

  validatePassword(newPassword)

  const user = await getUserById(session.userId)
  if (!user) throw new Error("Your account could not be found.")

  const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!currentMatches) {
    throw new Error("Current password is incorrect.")
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST)

  await sanityMutate([
    {
      patch: {
        id: session.userId,
        set: { passwordHash, mustChangePassword: false, updatedAt: new Date().toISOString() },
      },
    },
  ])

  revalidatePath("/settings")

  return { ok: true as const }
}
