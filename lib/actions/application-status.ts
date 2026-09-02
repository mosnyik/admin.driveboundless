"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { sanityFetch, sanityMutate } from "@/lib/sanity"
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/application-types"

export async function updateApplicationStatus(applicationId: string, newStatus: ApplicationStatus) {
  const session = await getSession()

  if (!session) {
    throw new Error("You must be signed in to do that.")
  }

  if (!APPLICATION_STATUSES.includes(newStatus)) {
    throw new Error("Invalid status.")
  }

  const current = await sanityFetch<{ status: ApplicationStatus } | null>(
    `*[_id == $id][0]{status}`,
    { id: applicationId },
  )

  if (!current) {
    throw new Error("Application not found.")
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

  return { ok: true as const }
}
