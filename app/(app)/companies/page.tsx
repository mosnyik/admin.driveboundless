import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getCompanies } from "@/lib/companies"
import { CompanyCard } from "@/components/admin/company-card"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Companies",
}

export default async function CompaniesPage() {
  const companies = await getCompanies()

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Companies</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            The companies that own vehicles in the fleet.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/companies/new">
            <Plus className="size-4" />
            Add company
          </Link>
        </Button>
      </div>

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm font-medium text-foreground">No companies yet</p>
          <p className="text-sm text-muted-foreground">Add the first owning company to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  )
}
