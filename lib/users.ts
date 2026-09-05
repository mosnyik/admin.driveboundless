import "server-only"

import { sanityFetch } from "@/lib/sanity"
import type { AppUser, AppUserWithPasswordHash } from "@/lib/user-types"

export * from "@/lib/user-types"

const userFields = `
  "id": _id,
  email,
  role,
  "active": coalesce(active, true),
  "mustChangePassword": coalesce(mustChangePassword, false),
  createdAt,
  updatedAt
`

/** Includes passwordHash — server-only, and only for use immediately before bcrypt.compare/hash. */
export async function getUserByEmail(email: string): Promise<AppUserWithPasswordHash | null> {
  return sanityFetch<AppUserWithPasswordHash>(
    `*[_type == "appUser" && lower(email) == $email][0]{ ${userFields}, passwordHash }`,
    { email: email.trim().toLowerCase() },
  )
}

export async function getUserById(id: string): Promise<AppUserWithPasswordHash | null> {
  return sanityFetch<AppUserWithPasswordHash>(
    `*[_type == "appUser" && _id == $id][0]{ ${userFields}, passwordHash }`,
    { id },
  )
}

/** Excludes passwordHash — safe for the admin-facing user list UI. */
export async function getAllUsers(): Promise<AppUser[]> {
  const results = await sanityFetch<AppUser[]>(
    `*[_type == "appUser"] | order(createdAt asc){ ${userFields} }`,
  )
  return results ?? []
}
