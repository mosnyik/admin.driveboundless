"use server"

import { revalidatePath } from "next/cache"
import { getCallerScope, getSession } from "@/lib/auth"
import { sanityFetch, sanityMutate } from "@/lib/sanity"
import {
  APPLICATION_STATUSES,
  needsInsuranceProof,
  type ApplicationInsurance,
  type ApplicationStatus,
} from "@/lib/application-types"
import { notifyRenterApproved } from "@/lib/notify-renter"

export async function updateApplicationStatus(applicationId: string, newStatus: ApplicationStatus) {
  const [session, scope] = await Promise.all([getSession(), getCallerScope()])

  if (!session || !scope) {
    throw new Error("You must be signed in to do that.")
  }

  if (!APPLICATION_STATUSES.includes(newStatus)) {
    throw new Error("Invalid status.")
  }

  const current = await sanityFetch<{
    status: ApplicationStatus
    companyId: string | null
    insurance: ApplicationInsurance | null
  } | null>(
    `*[_id == $id][0]{status, "companyId": selectedVehicle.vehicle->company->_id, insurance}`,
    { id: applicationId },
  )

  if (!current) {
    throw new Error("Application not found.")
  }

  if (scope.role === "owner" && current.companyId !== scope.companyId) {
    throw new Error("You can only update bookings for your own company.")
  }

  if (newStatus === "approved" && needsInsuranceProof(current.insurance)) {
    throw new Error(
      "This renter chose to buy coverage through RentalCover.com — add the carrier and policy number before approving.",
    )
  }

  if (current.status === newStatus) {
    return { ok: true as const }
  }

  const now = new Date().toISOString()

  await sanityMutate([
    {
      patch: {
        id: applicationId,
        setIfMissing: { statusHistory: [] },
        insert: {
          after: "statusHistory[-1]",
          items: [
            {
              _key: crypto.randomUUID(),
              from: current.status,
              to: newStatus,
              changedAt: now,
              changedBy: session.email,
            },
          ],
        },
        set: {
          status: newStatus,
          statusUpdatedAt: now,
        },
      },
    },
  ])

  revalidatePath("/")
  revalidatePath("/applications")
  revalidatePath(`/applications/${applicationId}`)

  if (newStatus === "approved") {
    await notifyRenterApproved(applicationId)
  }

  return { ok: true as const }
}
