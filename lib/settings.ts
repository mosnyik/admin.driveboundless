import "server-only"

import { sanityFetch } from "@/lib/sanity"
import type { NotificationSettings } from "@/lib/settings-types"

export * from "@/lib/settings-types"

export const NOTIFICATION_SETTINGS_DOC_ID = "notificationSettings"

const settingsQuery = `*[_id == "${NOTIFICATION_SETTINGS_DOC_ID}"][0]{
  "alertRecipients": coalesce(alertRecipients, [])
}`

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const result = await sanityFetch<NotificationSettings>(settingsQuery)
  return { alertRecipients: result?.alertRecipients ?? [] }
}
