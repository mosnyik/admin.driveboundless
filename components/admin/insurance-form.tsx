"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { updateApplicationInsurance } from "@/lib/actions/insurance"

export function InsuranceForm({
  applicationId,
  initialCarrier,
  initialPolicyNumber,
}: {
  applicationId: string
  initialCarrier: string
  initialPolicyNumber: string
}) {
  const router = useRouter()
  const [carrier, setCarrier] = useState(initialCarrier)
  const [policyNumber, setPolicyNumber] = useState(initialPolicyNumber)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    startTransition(async () => {
      try {
        const result = await updateApplicationInsurance(applicationId, { carrier, policyNumber })
        if (result.emailSent) {
          toast.success("Insurance saved and the updated agreement was emailed to the renter")
        } else {
          toast.warning("Insurance saved, but the updated agreement email couldn't be sent", {
            description: result.emailError,
          })
        }
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't save insurance details.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="insurance-carrier">Carrier</Label>
        <Input
          id="insurance-carrier"
          value={carrier}
          onChange={(event) => setCarrier(event.target.value)}
          placeholder="State Farm, GEICO, etc."
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="insurance-policy">Policy number</Label>
        <Input
          id="insurance-policy"
          value={policyNumber}
          onChange={(event) => setPolicyNumber(event.target.value)}
          placeholder="POL-123456789"
          disabled={pending}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending || !carrier.trim() || !policyNumber.trim()}>
          {pending ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : (
            "Save & send updated agreement"
          )}
        </Button>
      </div>
    </form>
  )
}
