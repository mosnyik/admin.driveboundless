import type { Metadata } from "next"
import { getCallerScope, getSession } from "@/lib/auth"
import { getNotificationSettings } from "@/lib/settings"
import { getAllUsers, getUserById } from "@/lib/users"
import { getActiveCompanies, getCompanyById } from "@/lib/companies"
import { AccountSettingsForm } from "@/components/admin/account-settings-form"
import { NotificationSettingsForm } from "@/components/admin/notification-settings-form"
import { OwnCompanyForm } from "@/components/admin/own-company-form"
import { ThemeSettings } from "@/components/admin/theme-settings"
import { UserManagement } from "@/components/admin/user-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
  const [session, scope] = await Promise.all([getSession(), getCallerScope()])
  const isAdmin = scope?.role === "admin"
  const isOwner = scope?.role === "owner"

  const [settings, currentUser, companies, ownCompany] = await Promise.all([
    isAdmin ? getNotificationSettings() : null,
    session ? getUserById(session.userId) : null,
    isAdmin ? getActiveCompanies() : Promise.resolve([]),
    isOwner && scope.companyId ? getCompanyById(scope.companyId) : Promise.resolve(null),
  ])
  const users = isAdmin ? await getAllUsers() : null

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
            <CardTitle className="font-serif text-lg">Your account</CardTitle>
            <CardDescription>Change the password you sign in with.</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountSettingsForm mustChangePassword={currentUser?.mustChangePassword ?? false} />
          </CardContent>
        </Card>

        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Your company</CardTitle>
              <CardDescription>
                {ownCompany
                  ? `Contact and notification details for ${ownCompany.name}. Legal name and account status are managed by an admin.`
                  : "Your account isn't linked to a company yet — contact an admin."}
              </CardDescription>
            </CardHeader>
            {ownCompany && (
              <CardContent>
                <OwnCompanyForm
                  initialValues={{
                    address: ownCompany.address,
                    phone: ownCompany.phone,
                    email: ownCompany.email,
                    notificationEmail:
                      ownCompany.notificationEmail === ownCompany.email ? "" : ownCompany.notificationEmail,
                  }}
                />
              </CardContent>
            )}
          </Card>
        )}

        {isAdmin && users && session && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Team</CardTitle>
              <CardDescription>
                People who can sign in to this dashboard. Set a password for them here — they&apos;ll
                choose their own on first login.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement users={users} currentUserId={session.userId} companies={companies} />
            </CardContent>
          </Card>
        )}

        {isAdmin && settings && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">New application alerts</CardTitle>
              <CardDescription>
                Everyone on this list gets an email the moment a new rental application arrives. This
                is the central, admin-wide list — each company&apos;s own notification address is set
                from its entry on the Companies page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettingsForm
                initialRecipients={settings.alertRecipients}
                defaultRecipient={process.env.ADMIN_EMAIL ?? null}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
