"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Car, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { setVehicleAvailability, reorderVehicle } from "@/lib/actions/vehicles"
import type { AdminVehicle } from "@/lib/vehicle-types"

export function VehicleCard({
  vehicle,
  isFirst,
  isLast,
}: {
  vehicle: AdminVehicle
  isFirst: boolean
  isLast: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleAvailabilityChange(checked: boolean) {
    startTransition(async () => {
      try {
        await setVehicleAvailability(vehicle.id, checked)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't update availability.")
      }
    })
  }

  function handleReorder(direction: "up" | "down") {
    startTransition(async () => {
      try {
        await reorderVehicle(vehicle.id, direction)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't reorder the fleet.")
      }
    })
  }

  return (
    <div className="flex gap-4 rounded-lg border bg-card p-4">
      <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted sm:size-24">
        {vehicle.imageUrl ? (
          <Image
            src={vehicle.imageUrl}
            alt={vehicle.imageAlt || `${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
          />
        ) : (
          <Car className="size-6 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <p className="text-sm text-muted-foreground">
              {vehicle.color} · {vehicle.seats} seats · {vehicle.fuelType}
            </p>
          </div>
          <Badge variant={vehicle.available ? "outline" : "secondary"} className="shrink-0">
            {vehicle.available ? "Available" : "Unavailable"}
          </Badge>
        </div>

        <p className="mt-2 text-sm text-foreground">
          ${vehicle.pricePerDay.toLocaleString()}/day · ${vehicle.pricePerWeek.toLocaleString()}/week
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/fleet/${vehicle.id}`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleReorder("up")}
              disabled={pending || isFirst}
              aria-label="Move up"
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleReorder("down")}
              disabled={pending || isLast}
              aria-label="Move down"
            >
              <ArrowDown className="size-4" />
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Available</span>
            <Switch checked={vehicle.available} onCheckedChange={handleAvailabilityChange} disabled={pending} />
          </div>
        </div>
      </div>
    </div>
  )
}
