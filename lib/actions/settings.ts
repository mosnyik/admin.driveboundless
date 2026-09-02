"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { sanityMutate } from "@/lib/sanity"
import { NOTIFICATION_SETTINGS_DOC_ID } from "@/lib/settings"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function updateAlertRecipients(emails: string[]) {
  const session = await getSession()

  if (!session) {
    throw new Error("You must be signed in to do that.")
  }

  const cleaned = Array.from(
    new Set(
      emails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0),
    ),
  )

  for (const email of cleaned) {
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error(`"${email}" doesn't look like a valid email address.`)
    }
  }

  await sanityMutate([
    {
      createOrReplace: {
        _id: NOTIFICATION_SETTINGS_DOC_ID,
        _type: "notificationSettings",
        alertRecipients: cleaned,
      },
    },
  ])

  revalidatePath("/settings")

  return { ok: true as const, alertRecipients: cleaned }
}
