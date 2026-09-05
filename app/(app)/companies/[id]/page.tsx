import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCompanyById } from "@/lib/companies"
import { CompanyForm } from "@/components/admin/company-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Edit company",
}

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const company = await getCompanyById(id)

  if (!company) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to companies
      </Link>

      <h1 className="mt-4 mb-8 font-serif text-3xl font-semibold text-foreground">{company.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Company details</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm
            mode="edit"
            companyId={company.id}
            initialValues={{
              name: company.name,
              dbaName: company.dbaName,
              address: company.address,
              phone: company.phone,
              email: company.email,
              notificationEmail: company.notificationEmail === company.email ? "" : company.notificationEmail,
              active: company.active,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
