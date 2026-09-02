import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { VehicleForm } from "@/components/admin/vehicle-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Add vehicle",
}

export default function NewVehiclePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
      <Link
        href="/fleet"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to fleet
      </Link>

      <h1 className="mt-4 mb-8 font-serif text-3xl font-semibold text-foreground">Add vehicle</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Vehicle details</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleForm mode="create" />
        </CardContent>
      </Card>
    </div>
  )
}
