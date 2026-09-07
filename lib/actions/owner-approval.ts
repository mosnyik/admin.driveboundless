"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sanityMutate } from "@/lib/sanity"
import type { ApplicationStatus } from "@/lib/application-types"
import {
  getByOwnerApprovalToken,
  isOwnerApprovalTokenExpired,
  isOwnerApprovalTokenSettled,
} from "@/lib/owner-approval"

/** Records the decision made from a mailed single-use link, then redirects
 * back to the same link — which now renders the "already recorded" state.
 * Deliberately swallows invalid/expired/already-used tokens rather than
 * throwing: there's no session to show an error to, so the redirect target
 * is what communicates the outcome. */
export async function submitOwnerDecision(token: string, decision: ApplicationStatus) {
  if (decision !== "approved" && decision !== "declined") {
    throw new Error("Invalid decision.")
  }

  const record = await getByOwnerApprovalToken(token)

  if (record && !isOwnerApprovalTokenExpired(record) && !isOwnerApprovalTokenSettled(record)) {
    const now = new Date().toISOString()
    const changedBy = record.companyName
      ? `${record.companyName} (via approval email)`
      : "Owner (via approval email)"

    await sanityMutate([
      {
        patch: {
          id: record.applicationId,
          setIfMissing: { statusHistory: [] },
          insert: {
            after: "statusHistory[-1]",
            items: [
              {
                _key: crypto.randomUUID(),
                from: record.status,
                to: decision,
                changedAt: now,
                changedBy,
              },
            ],
          },
          set: {
            status: decision,
            statusUpdatedAt: now,
            ownerApprovalToken: {
              tokenHash: record.tokenHash,
              expiresAt: record.expiresAt,
              usedAt: now,
              usedVia: decision,
            },
          },
        },
      },
    ])

    revalidatePath("/")
    revalidatePath("/applications")
    revalidatePath(`/applications/${record.applicationId}`)
  }

  redirect(`/owner-action/${token}`)
}
