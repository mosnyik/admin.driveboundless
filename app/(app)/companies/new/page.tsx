import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCallerScope } from "@/lib/auth"
import { CompanyForm } from "@/components/admin/company-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Add company",
}

export default async function NewCompanyPage() {
  const scope = await getCallerScope()
  if (scope?.role !== "admin") notFound()

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to companies
      </Link>

      <h1 className="mt-4 mb-8 font-serif text-3xl font-semibold text-foreground">Add company</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Company details</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm mode="create" />
        </CardContent>
      </Card>
    </div>
  )
}
