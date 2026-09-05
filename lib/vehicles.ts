import "server-only"

import { sanityFetch } from "@/lib/sanity"
import type { AdminVehicle, VehicleOption } from "@/lib/vehicle-types"

export * from "@/lib/vehicle-types"

// Matches the ordering used by the public drive-boundless site's fleet query,
// so the admin list always reflects what visitors actually see.
const ORDER_CLAUSE = "order(coalesce(orderRank, sortOrder, year) desc)"

const vehiclesQuery = `*[_type == "vehicle"] | ${ORDER_CLAUSE} {
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

const adminVehiclesQuery = `*[_type == "vehicle"] | ${ORDER_CLAUSE} {
  "id": _id,
  make,
  model,
  year,
  "miles": coalesce(miles, 0),
  color,
  "pricePerDay": coalesce(pricePerDay, 0),
  "pricePerWeek": coalesce(pricePerWeek, round(coalesce(pricePerDay, 0) * 7 * 0.9)),
  "minRentalDays": coalesce(minRentalDays, 1),
  "deliveryFee": coalesce(deliveryFee, 0),
  "pickupTimes": coalesce(pickupTimes, "9 AM - 6 PM"),
  "fuelType": coalesce(fuelType, "Regular"),
  "seats": coalesce(seats, 5),
  "imageUrl": image.asset->url,
  "imageAlt": coalesce(image.alt, ""),
  "available": coalesce(available, true),
  "sortOrder": coalesce(sortOrder, 0),
  "companyId": company->_id,
  "companyName": company->name
}`

export async function getAdminVehicles() {
  const results = await sanityFetch<AdminVehicle[]>(adminVehiclesQuery)
  return results ?? []
}

const adminVehicleByIdQuery = `*[_type == "vehicle" && _id == $id][0]{
  "id": _id,
  make,
  model,
  year,
  "miles": coalesce(miles, 0),
  color,
  "pricePerDay": coalesce(pricePerDay, 0),
  "pricePerWeek": coalesce(pricePerWeek, round(coalesce(pricePerDay, 0) * 7 * 0.9)),
  "minRentalDays": coalesce(minRentalDays, 1),
  "deliveryFee": coalesce(deliveryFee, 0),
  "pickupTimes": coalesce(pickupTimes, "9 AM - 6 PM"),
  "fuelType": coalesce(fuelType, "Regular"),
  "seats": coalesce(seats, 5),
  "imageUrl": image.asset->url,
  "imageAlt": coalesce(image.alt, ""),
  "available": coalesce(available, true),
  "sortOrder": coalesce(sortOrder, 0),
  "companyId": company->_id,
  "companyName": company->name
}`

export async function getAdminVehicleById(id: string) {
  return sanityFetch<AdminVehicle>(adminVehicleByIdQuery, { id })
}
