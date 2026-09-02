import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getAdminVehicleById } from "@/lib/vehicles"
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
  const vehicle = await getAdminVehicleById(id)

  if (!vehicle) {
    notFound()
  }

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
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
