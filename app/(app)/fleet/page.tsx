import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getCallerScope } from "@/lib/auth"
import { getAdminVehicles } from "@/lib/vehicles"
import { VehicleCard } from "@/components/admin/vehicle-card"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Fleet",
}

export default async function FleetPage() {
  const scope = await getCallerScope()
  const isAdmin = scope?.role === "admin"
  // A sentinel, never-matching id when an owner has no company yet, so a
  // misconfigured account sees nothing rather than accidentally everything.
  const companyId = scope?.role === "owner" ? scope.companyId ?? "no-company-assigned" : undefined
  const vehicles = await getAdminVehicles(companyId)

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Fleet</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Add, edit, and reorder the vehicles shown on the website.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/fleet/new">
            <Plus className="size-4" />
            Add vehicle
          </Link>
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm font-medium text-foreground">No vehicles yet</p>
          <p className="text-sm text-muted-foreground">Add your first vehicle to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isFirst={index === 0}
              isLast={index === vehicles.length - 1}
              canReorder={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}
