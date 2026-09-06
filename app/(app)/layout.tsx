import { redirect } from "next/navigation"
import { getCallerScope, getSession, clearSessionCookie, getViewAsCompanyId } from "@/lib/auth"
import { getUserById } from "@/lib/users"
import { getCompanyById } from "@/lib/companies"
import { AdminSidebar } from "@/components/admin/sidebar"
import { ViewAsBanner } from "@/components/admin/view-as-banner"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Re-checked on every navigation (not just at login) so a deactivated
  // account loses access immediately instead of waiting out the JWT's 7-day life.
  const user = await getUserById(session.userId)

  if (!user || !user.active) {
    await clearSessionCookie()
    redirect("/login")
  }

  // The sidebar's nav should reflect the impersonated role while "viewing as"
  // a company, even though `user` above is always the real logged-in admin.
  const scope = await getCallerScope()
  const viewAsCompanyId = session.role === "admin" ? await getViewAsCompanyId() : null
  const viewAsCompany = viewAsCompanyId ? await getCompanyById(viewAsCompanyId) : null

  return (
    <div className="min-h-screen md:flex">
      <AdminSidebar email={session.email} role={scope?.role ?? user.role} />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        {viewAsCompany && <ViewAsBanner companyName={viewAsCompany.name} />}
        <main>{children}</main>
      </div>
    </div>
  )
}
