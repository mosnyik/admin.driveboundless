export type AppUserRole = "admin" | "owner"

export interface AppUser {
  id: string
  email: string
  role: AppUserRole
  active: boolean
  /** Only ever meaningful for "owner" accounts — admins sign in with Google and never have a password. */
  mustChangePassword: boolean
  companyId: string | null
  createdAt: string
  updatedAt: string
}

/** Only ever read on the server, immediately before bcrypt.compare/hash. Never project this into a
 * client-facing query. Absent (undefined) for admin accounts, which sign in with Google only. */
export interface AppUserWithPasswordHash extends AppUser {
  passwordHash?: string
}

export interface CreateUserInput {
  email: string
  role: AppUserRole
  companyId: string | null
  /** Required for "owner" accounts; ignored for "admin" (Google-only). */
  initialPassword?: string
}
