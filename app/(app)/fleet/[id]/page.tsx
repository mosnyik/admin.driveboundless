import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCallerScope } from "@/lib/auth"
import { getAdminVehicleById } from "@/lib/vehicles"
import { getActiveCompanies } from "@/lib/companies"
import { VehicleForm } from "@/components/admin/vehicle-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Edit vehicle",
}

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const scope = await getCallerScope()
  // A sentinel, never-matching id when an owner has no company yet, so a
  // misconfigured account gets a 404 rather than accidentally everything.
  const companyId = scope?.role === "owner" ? scope.companyId ?? "no-company-assigned" : undefined
  const [vehicle, companies] = await Promise.all([
    getAdminVehicleById(id, companyId),
    scope?.role === "admin" ? getActiveCompanies() : Promise.resolve([]),
  ])

  if (!vehicle) {
    notFound()
  }

  const fixedCompany =
    scope?.role === "owner" && vehicle.companyId && vehicle.companyName
      ? { id: vehicle.companyId, name: vehicle.companyName }
      : undefined

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
      <Link
        href="/fleet"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to fleet
      </Link>

      <h1 className="mt-4 mb-8 font-serif text-3xl font-semibold text-foreground">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Vehicle details</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleForm
            mode="edit"
            vehicleId={vehicle.id}
            initialImageUrl={vehicle.imageUrl}
            companies={companies}
            fixedCompany={fixedCompany}
            initialValues={{
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              miles: vehicle.miles,
              color: vehicle.color,
              pricePerDay: vehicle.pricePerDay,
              pricePerWeek: vehicle.pricePerWeek,
              minRentalDays: vehicle.minRentalDays,
              deliveryFee: vehicle.deliveryFee,
              pickupTimes: vehicle.pickupTimes,
              fuelType: vehicle.fuelType,
              seats: vehicle.seats,
              available: vehicle.available,
              companyId: vehicle.companyId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
