"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { sanityFetch, sanityMutate, uploadSanityImage } from "@/lib/sanity"
import { getAdminVehicles } from "@/lib/vehicles"
import { FUEL_TYPES, type VehicleFormValues } from "@/lib/vehicle-types"

function validateValues(values: VehicleFormValues) {
  if (!values.make.trim()) throw new Error("Make is required.")
  if (!values.model.trim()) throw new Error("Model is required.")
  if (!Number.isFinite(values.year) || values.year < 1900) throw new Error("Enter a valid year.")
  if (!Number.isFinite(values.miles) || values.miles < 0) throw new Error("Enter a valid mileage.")
  if (!values.color.trim()) throw new Error("Color is required.")
  if (!Number.isFinite(values.pricePerWeek) || values.pricePerWeek < 0) {
    throw new Error("Enter a valid price per week.")
  }
  if (values.pricePerDay !== null && (!Number.isFinite(values.pricePerDay) || values.pricePerDay < 0)) {
    throw new Error("Enter a valid price per day.")
  }
  if (!Number.isFinite(values.minRentalDays) || values.minRentalDays < 1) {
    throw new Error("Minimum rental days must be at least 1.")
  }
  if (!Number.isFinite(values.deliveryFee) || values.deliveryFee < 0) {
    throw new Error("Enter a valid delivery fee.")
  }
  if (!values.pickupTimes.trim()) throw new Error("Pickup times are required.")
  if (!FUEL_TYPES.includes(values.fuelType)) throw new Error("Invalid fuel type.")
  if (!Number.isFinite(values.seats) || values.seats < 1) throw new Error("Enter a valid seat count.")
}

function buildFields(values: VehicleFormValues) {
  return {
    make: values.make.trim(),
    model: values.model.trim(),
    year: values.year,
    miles: values.miles,
    color: values.color.trim(),
    pricePerDay: values.pricePerDay ?? undefined,
    pricePerWeek: values.pricePerWeek,
    minRentalDays: values.minRentalDays,
    deliveryFee: values.deliveryFee,
    pickupTimes: values.pickupTimes.trim(),
    fuelType: values.fuelType,
    seats: values.seats,
    available: values.available,
  }
}

function companyReference(companyId: string | null) {
  return companyId ? { _type: "reference" as const, _ref: companyId } : undefined
}

async function uploadImageIfProvided(imageFile: File | null) {
  if (!imageFile || imageFile.size === 0) return undefined

  const bytes = new Uint8Array(await imageFile.arrayBuffer())
  return uploadSanityImage(bytes, imageFile.type || "image/jpeg", imageFile.name || "vehicle.jpg")
}

export async function createVehicle(values: VehicleFormValues, imageFile: File | null) {
  const session = await getSession()
  if (!session) throw new Error("You must be signed in to do that.")

  validateValues(values)

  const imageAssetId = await uploadImageIfProvided(imageFile)

  const existingSortOrders = await sanityFetch<number[]>(
    `*[_type == "vehicle" && defined(sortOrder)].sortOrder`,
  )
  const minSortOrder = existingSortOrders && existingSortOrders.length > 0 ? Math.min(...existingSortOrders, 0) : 0

  const document = {
    _type: "vehicle",
    ...buildFields(values),
    sortOrder: minSortOrder - 1,
    image: imageAssetId
      ? { _type: "image", asset: { _type: "reference", _ref: imageAssetId } }
      : undefined,
    company: companyReference(values.companyId),
  }

  const result = (await sanityMutate([{ create: document }])) as { results?: Array<{ id?: string }> }
  const newId = result.results?.[0]?.id

  revalidatePath("/fleet")

  return { ok: true as const, id: newId }
}

export async function updateVehicle(id: string, values: VehicleFormValues, imageFile: File | null) {
  const session = await getSession()
  if (!session) throw new Error("You must be signed in to do that.")

  validateValues(values)

  const imageAssetId = await uploadImageIfProvided(imageFile)

  const companyRef = companyReference(values.companyId)

  await sanityMutate([
    {
      patch: {
        id,
        set: {
          ...buildFields(values),
          ...(imageAssetId
            ? { image: { _type: "image", asset: { _type: "reference", _ref: imageAssetId } } }
            : {}),
          ...(companyRef ? { company: companyRef } : {}),
        },
        ...(companyRef ? {} : { unset: ["company"] }),
      },
    },
  ])

  revalidatePath("/fleet")
  revalidatePath(`/fleet/${id}`)

  return { ok: true as const }
}

export async function setVehicleAvailability(id: string, available: boolean) {
  const session = await getSession()
  if (!session) throw new Error("You must be signed in to do that.")

  await sanityMutate([{ patch: { id, set: { available } } }])

  revalidatePath("/fleet")

  return { ok: true as const }
}

export async function reorderVehicle(id: string, direction: "up" | "down") {
  const session = await getSession()
  if (!session) throw new Error("You must be signed in to do that.")

  const vehicles = await getAdminVehicles()
  const index = vehicles.findIndex((vehicle) => vehicle.id === id)

  if (index === -1) throw new Error("Vehicle not found.")

  const swapIndex = direction === "up" ? index - 1 : index + 1

  if (swapIndex < 0 || swapIndex >= vehicles.length) {
    return { ok: true as const }
  }

  const reordered = [...vehicles]
  const [moved] = reordered.splice(index, 1)
  reordered.splice(swapIndex, 0, moved)

  const total = reordered.length
  const mutations = reordered.map((vehicle, position) => ({
    patch: { id: vehicle.id, set: { sortOrder: total - position } },
  }))

  await sanityMutate(mutations)

  revalidatePath("/fleet")

  return { ok: true as const }
}
