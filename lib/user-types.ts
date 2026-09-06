export type AppUserRole = "admin" | "owner"

export interface AppUser {
  id: string
  email: string
  role: AppUserRole
  active: boolean
  mustChangePassword: boolean
  companyId: string | null
  createdAt: string
  updatedAt: string
}

/** Only ever read on the server, immediately before bcrypt.compare/hash. Never project this into a client-facing query. */
export interface AppUserWithPasswordHash extends AppUser {
  passwordHash: string
}

export interface CreateUserInput {
  email: string
  role: AppUserRole
  initialPassword: string
}
