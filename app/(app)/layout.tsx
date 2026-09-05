import { redirect } from "next/navigation"
import { getSession, clearSessionCookie } from "@/lib/auth"
import { getUserById } from "@/lib/users"
import { AdminSidebar } from "@/components/admin/sidebar"

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

  return (
    <div className="min-h-screen md:flex">
      <AdminSidebar email={session.email} />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
