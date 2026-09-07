import "server-only"

import { createHash, randomBytes } from "crypto"
import { sanityFetch, sanityMutate } from "@/lib/sanity"
import { isTerminalStatus, type ApplicationStatus } from "@/lib/application-types"

/** How long a mailed approval link stays valid before an owner has to ask
 * the admin to resend the alert (which issues a fresh token). */
const TOKEN_TTL_DAYS = 14

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export interface OwnerApprovalRecord {
  applicationId: string
  status: ApplicationStatus
  renterName: string
  vehicleLabel: string | null
  startDate: string | null
  endDate: string | null
  companyName: string | null
  tokenHash: string
  expiresAt: string
  usedAt: string | null
  usedVia: ApplicationStatus | null
}

const tokenQuery = `*[_type == "rentalApplication" && ownerApprovalToken.tokenHash == $hash][0]{
  "applicationId": _id,
  status,
  "renterName": renter.fullName,
  "vehicleLabel": selectedVehicle.label,
  "startDate": rental.startDate,
  "endDate": rental.endDate,
  "companyName": selectedVehicle.vehicle->company->name,
  "tokenHash": ownerApprovalToken.tokenHash,
  "expiresAt": ownerApprovalToken.expiresAt,
  "usedAt": ownerApprovalToken.usedAt,
  "usedVia": ownerApprovalToken.usedVia
}`

/** Looks up an application by the raw token from an approval link. Never
 * throws on a bad/unknown token — the caller renders an "invalid link"
 * state instead of a 500. */
export async function getByOwnerApprovalToken(token: string): Promise<OwnerApprovalRecord | null> {
  if (!token) return null
  return sanityFetch<OwnerApprovalRecord>(tokenQuery, { hash: hashToken(token) })
}

export function isOwnerApprovalTokenExpired(record: OwnerApprovalRecord) {
  return new Date(record.expiresAt).getTime() < Date.now()
}

export function isOwnerApprovalTokenSettled(record: OwnerApprovalRecord) {
  return Boolean(record.usedAt) || isTerminalStatus(record.status)
}

/** Issues a fresh single-use token for an application, replacing any
 * previous one (so an older mailed link stops working once a new alert
 * goes out). Returns the raw token — only its hash is ever stored. */
export async function issueOwnerApprovalToken(applicationId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await sanityMutate([
    {
      patch: {
        id: applicationId,
        set: {
          ownerApprovalToken: {
            tokenHash: hashToken(token),
            expiresAt,
            usedAt: null,
            usedVia: null,
          },
        },
      },
    },
  ])

  return token
}
