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

/**
 * Recipients to actually send new-application alerts to. Falls back to
 * ADMIN_EMAIL when no one is configured in Settings, so alerts never go
 * out silently to nobody.
 */
export async function getAlertRecipients(): Promise<string[]> {
  const settings = await getNotificationSettings()

  if (settings.alertRecipients.length > 0) {
    return settings.alertRecipients
  }

  const fallback = process.env.ADMIN_EMAIL?.trim()
  return fallback ? [fallback] : []
}
