import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
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

  return (
    <div className="min-h-screen md:flex">
      <AdminSidebar email={session.email} />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
