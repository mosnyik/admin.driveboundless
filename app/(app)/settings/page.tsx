import type { Metadata } from "next"
import { getNotificationSettings } from "@/lib/settings"
import { NotificationSettingsForm } from "@/components/admin/notification-settings-form"
import { ThemeSettings } from "@/components/admin/theme-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
  const settings = await getNotificationSettings()

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Manage your dashboard preferences.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Appearance</CardTitle>
            <CardDescription>
              Follows your device by default — pick Light or Dark to override it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSettings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">New application alerts</CardTitle>
            <CardDescription>
              Everyone on this list gets an email the moment a new rental application arrives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettingsForm
              initialRecipients={settings.alertRecipients}
              defaultRecipient={process.env.ADMIN_EMAIL ?? null}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
