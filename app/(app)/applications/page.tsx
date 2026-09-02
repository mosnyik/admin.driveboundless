import type { Metadata } from "next"
import { getApplications } from "@/lib/applications"
import { ApplicationsView } from "@/components/admin/applications-view"

export const metadata: Metadata = {
  title: "Applications",
}

export default async function ApplicationsPage() {
  const applications = await getApplications()

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Applications</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Every rental application, grouped by where it stands.
        </p>
      </div>

      <ApplicationsView applications={applications} />
    </div>
  )
}
