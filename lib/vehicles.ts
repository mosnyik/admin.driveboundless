import "server-only"

import { sanityFetch } from "@/lib/sanity"
import type { VehicleOption } from "@/lib/vehicle-types"

export * from "@/lib/vehicle-types"

const vehiclesQuery = `*[_type == "vehicle"] | order(coalesce(sortOrder, year) desc) {
  "id": _id,
  make,
  model,
  year,
  color,
  "pricePerDay": coalesce(pricePerDay, 0),
  "pricePerWeek": coalesce(pricePerWeek, round(coalesce(pricePerDay, 0) * 7 * 0.9)),
  "deliveryFee": coalesce(deliveryFee, 0),
  "available": coalesce(available, true)
}`

export async function getVehicleOptions() {
  const results = await sanityFetch<VehicleOption[]>(vehiclesQuery)
  return results ?? []
}
