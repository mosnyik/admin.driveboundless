"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { createCompany, updateCompany } from "@/lib/actions/companies"
import type { CompanyFormValues } from "@/lib/company-types"

const DEFAULT_VALUES: CompanyFormValues = {
  name: "",
  dbaName: "",
  address: "",
  phone: "",
  email: "",
  notificationEmail: "",
  active: true,
}

export function CompanyForm({
  mode,
  companyId,
  initialValues,
}: {
  mode: "create" | "edit"
  companyId?: string
  initialValues?: CompanyFormValues
}) {
  const router = useRouter()
  const [values, setValues] = useState<CompanyFormValues>(initialValues ?? DEFAULT_VALUES)
  const [pending, startTransition] = useTransition()

  function update<K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createCompany(values)
          toast.success("Company added")
          router.push(result.id ? `/companies/${result.id}` : "/companies")
        } else if (companyId) {
          await updateCompany(companyId, values)
          toast.success("Company updated")
          router.push("/companies")
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't save the company.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Legal name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Turchese Solutions LLC"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dbaName">
            DBA name <span className="text-muted-foreground">— optional</span>
          </Label>
          <Input
            id="dbaName"
            value={values.dbaName}
            onChange={(event) => update("dbaName", event.target.value)}
            placeholder="Boundless Auto Solutions"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">
          Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="address"
          value={values.address}
          onChange={(event) => update("address", event.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Contact email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notificationEmail">
          Notification email <span className="text-muted-foreground">— optional</span>
        </Label>
        <Input
          id="notificationEmail"
          type="email"
          value={values.notificationEmail}
          onChange={(event) => update("notificationEmail", event.target.value)}
          placeholder="Falls back to the contact email above"
        />
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label htmlFor="active">Active</Label>
          <p className="text-sm text-muted-foreground">
            Inactive companies can&apos;t be assigned to a vehicle.
          </p>
        </div>
        <Switch id="active" checked={values.active} onCheckedChange={(checked) => update("active", checked)} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : mode === "create" ? (
            "Add company"
          ) : (
            "Save changes"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/companies")} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
