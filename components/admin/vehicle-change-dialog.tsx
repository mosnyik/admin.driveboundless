"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { changeApplicationVehicle } from "@/lib/actions/vehicle-change"
import type { VehicleOption } from "@/lib/vehicle-types"

export function VehicleChangeDialog({
  applicationId,
  currentVehicleLabel,
  vehicles,
}: {
  applicationId: string
  currentVehicleLabel: string | null
  vehicles: VehicleOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [vehicleId, setVehicleId] = useState<string>("")
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()

  const canSubmit = vehicleId.length > 0 && reason.trim().length >= 3 && !pending

  function handleSubmit() {
    if (!canSubmit) return

    startTransition(async () => {
      try {
        await changeApplicationVehicle(applicationId, vehicleId, reason)
        toast.success("Vehicle changed and agreement regenerated")
        setOpen(false)
        setVehicleId("")
        setReason("")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't change the vehicle.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto">
          <Car className="size-4" />
          {currentVehicleLabel ? "Change vehicle" : "Assign vehicle"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{currentVehicleLabel ? "Change vehicle" : "Assign vehicle"}</DialogTitle>
          <DialogDescription>
            Pricing updates automatically and the rental agreement is regenerated. The current
            agreement is retained in the vehicle history below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle">New vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger id="vehicle" className="w-full">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id} disabled={!vehicle.available}>
                    {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.color} · $
                    {vehicle.pricePerWeek.toLocaleString()}/week
                    {!vehicle.available ? " (unavailable)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for the change</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Requested vehicle wasn't available at pickup, upgraded to a larger vehicle…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {pending ? (
              <>
                <Spinner />
                Regenerating…
              </>
            ) : (
              "Confirm change"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
