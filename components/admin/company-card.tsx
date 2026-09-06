"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Building2, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { setCompanyActive } from "@/lib/actions/companies"
import { ViewAsButton } from "@/components/admin/view-as-button"
import type { Company } from "@/lib/company-types"

export function CompanyCard({ company }: { company: Company }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleActiveChange(checked: boolean) {
    startTransition(async () => {
      try {
        await setCompanyActive(company.id, checked)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't update this company.")
      }
    })
  }

  return (
    <div className="flex gap-4 rounded-lg border bg-card p-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
        <Building2 className="size-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{company.name}</p>
            {company.dbaName && (
              <p className="text-sm text-muted-foreground">DBA {company.dbaName}</p>
            )}
          </div>
          <Badge variant={company.active ? "outline" : "secondary"} className="shrink-0">
            {company.active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          {company.email} · {company.phone}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/companies/${company.id}`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>

          <ViewAsButton companyId={company.id} />

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Active</span>
            <Switch checked={company.active} onCheckedChange={handleActiveChange} disabled={pending} />
          </div>
        </div>
      </div>
    </div>
  )
}
