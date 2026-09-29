"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { updateRentalSchedule } from "@/lib/actions/rental-schedule"
import { computeReturnSchedule, countRatePeriods, type RentalRate } from "@/lib/application-types"

export function ScheduleChangeDialog({
  applicationId,
  startDate: initialStartDate,
  startTime: initialStartTime,
  endDate: initialEndDate,
  rate,
}: {
  applicationId: string
  startDate: string
  startTime: string
  endDate: string
  rate: RentalRate
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [startTime, setStartTime] = useState(initialStartTime)
  const [notifyRenter, setNotifyRenter] = useState(true)
  const [pending, startTransition] = useTransition()

  const periods = countRatePeriods(initialStartDate, initialEndDate, rate)
  const unit = rate === "week" ? "week" : "day"
  const schedule =
    startDate && startTime ? computeReturnSchedule({ startDate, startTime, rate, periods }) : null
  const unchanged = startDate === initialStartDate && startTime === initialStartTime
  const canSubmit = Boolean(schedule) && !unchanged && !pending

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setStartDate(initialStartDate)
      setStartTime(initialStartTime)
      setNotifyRenter(true)
    }
  }

  function handleSubmit() {
    if (!canSubmit) return

    startTransition(async () => {
      try {
        const result = await updateRentalSchedule(applicationId, { startDate, startTime, notifyRenter })
        if (result.emailSent) {
          toast.success("Pick-up updated and the new agreement was emailed to the renter")
        } else if (result.emailSkipped) {
          toast.success("Pick-up updated and agreement regenerated")
        } else {
          toast.warning("Pick-up updated, but the email to the renter couldn't be sent", {
            description: result.emailError,
          })
        }
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't update the pick-up time.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full sm:w-auto">
          <CalendarClock className="size-4" />
          Change pick-up
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change pick-up time</DialogTitle>
          <DialogDescription>
            The return is set automatically from the {rate === "week" ? "weekly" : "daily"} rate and the
            rental agreement is regenerated. The original signed agreement is kept unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pickup-date">Pick-up date</Label>
              <Input
                id="pickup-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup-time">Pick-up time</Label>
              <Input
                id="pickup-time"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                disabled={pending}
              />
            </div>
          </div>

          <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New return</p>
            <p className="mt-0.5 text-foreground">
              {schedule ? `${schedule.endDate} at ${schedule.endTime}` : "Choose a pick-up date and time"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {periods} {unit}
              {periods === 1 ? "" : "s"} after pick-up, same as the original booking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="notify-renter"
              checked={notifyRenter}
              onCheckedChange={(checked) => setNotifyRenter(checked === true)}
              disabled={pending}
            />
            <Label htmlFor="notify-renter" className="font-normal">
              Email the renter the new times and updated agreement
            </Label>
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
              "Save pick-up"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
