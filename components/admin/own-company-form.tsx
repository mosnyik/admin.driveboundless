"use client"

import { useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { updateOwnCompany } from "@/lib/actions/companies"
import type { OwnCompanyFormValues } from "@/lib/company-types"

export function OwnCompanyForm({ initialValues }: { initialValues: OwnCompanyFormValues }) {
  const [values, setValues] = useState<OwnCompanyFormValues>(initialValues)
  const [pending, startTransition] = useTransition()

  function update<K extends keyof OwnCompanyFormValues>(key: K, value: OwnCompanyFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    startTransition(async () => {
      try {
        await updateOwnCompany(values)
        toast.success("Company details updated")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't save your company details.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="own-address">
          Address <span className="text-muted-foreground">— optional</span>
        </Label>
        <Input
          id="own-address"
          value={values.address}
          onChange={(event) => update("address", event.target.value)}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="own-phone">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="own-phone"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            disabled={pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="own-email">
            Contact email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="own-email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            disabled={pending}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="own-notification-email">
          Notification email <span className="text-muted-foreground">— optional</span>
        </Label>
        <Input
          id="own-notification-email"
          type="email"
          value={values.notificationEmail}
          onChange={(event) => update("notificationEmail", event.target.value)}
          placeholder="Falls back to the contact email above"
          disabled={pending}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Spinner />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  )
}
