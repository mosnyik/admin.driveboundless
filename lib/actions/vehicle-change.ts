"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { sanityFetch, sanityMutate, uploadSanityFile } from "@/lib/sanity"
import { buildRentalAgreementSnapshot, type RentalAgreementFormData } from "@/lib/rental-agreement"
import { createAgreementPdf } from "@/lib/agreement-pdf"

interface CurrentApplicationState {
  renter: {
    fullName: string
    phone: string
    email: string
    address: { street: string; city: string; state: string; zip: string }
  } | null
  license: { number: string; state: string; expiry: string } | null
  insurance: { carrier?: string; policyNumber?: string } | null
  rental: {
    purpose: string
    startDate: string
    startTime: string
    endDate: string
    endTime: string
    paymentDueDay: string
    mileageAllowance: string
    additionalNotes?: string
  } | null
  additionalDrivers: Array<{ name: string; licenseNumber: string; licenseState: string }> | null
  selectedVehicleLabel: string | null
  /** Whatever agreement PDF is currently "active" — the most recent vehicle
   * change's agreement if one exists, otherwise the original frozen one. This
   * is what gets retained as "previous" when this change generates a new one. */
  activeAgreementPdf: { _type: "file"; asset: { _type: "reference"; _ref: string } } | null
}

const currentStateQuery = `*[_id == $id][0]{
  renter,
  license,
  insurance,
  rental,
  additionalDrivers,
  "selectedVehicleLabel": selectedVehicle.label,
  "activeAgreementPdf": coalesce(currentAgreement.pdf, agreement.pdf)
}`

interface NewVehicle {
  _id: string
  make: string
  model: string
  year: number
  color: string
  pricePerDay: number
  pricePerWeek: number
  deliveryFee: number
}

const vehicleQuery = `*[_id == $vehicleId][0]{
  _id,
  make,
  model,
  year,
  color,
  "pricePerDay": coalesce(pricePerDay, 0),
  "pricePerWeek": coalesce(pricePerWeek, round(coalesce(pricePerDay, 0) * 7 * 0.9)),
  "deliveryFee": coalesce(deliveryFee, 0)
}`

export async function changeApplicationVehicle(applicationId: string, newVehicleId: string, reason: string) {
  const session = await getSession()

  if (!session) {
    throw new Error("You must be signed in to do that.")
  }

  const trimmedReason = reason.trim()

  if (trimmedReason.length < 3) {
    throw new Error("Please give a short reason for the change.")
  }

  const [current, vehicle] = await Promise.all([
    sanityFetch<CurrentApplicationState>(currentStateQuery, { id: applicationId }),
    sanityFetch<NewVehicle>(vehicleQuery, { vehicleId: newVehicleId }),
  ])

  if (!current) {
    throw new Error("Application not found.")
  }

  if (!vehicle) {
    throw new Error("Vehicle not found.")
  }

  const now = new Date().toISOString()

  const formData: RentalAgreementFormData = {
    fullName: current.renter?.fullName ?? "",
    address: current.renter?.address?.street ?? "",
    city: current.renter?.address?.city ?? "",
    state: current.renter?.address?.state ?? "",
    zip: current.renter?.address?.zip ?? "",
    phone: current.renter?.phone ?? "",
    email: current.renter?.email ?? "",
    licenseNumber: current.license?.number ?? "",
    licenseState: current.license?.state ?? "",
    licenseExpiry: current.license?.expiry ?? "",
    insuranceCarrier: current.insurance?.carrier,
    insurancePolicyNumber: current.insurance?.policyNumber,
    rentalPurpose: current.rental?.purpose ?? "",
    startDate: current.rental?.startDate ?? "",
    startTime: current.rental?.startTime ?? "",
    endDate: current.rental?.endDate ?? "",
    endTime: current.rental?.endTime ?? "",
    rentalRate: "week",
    paymentDueDay: current.rental?.paymentDueDay ?? "",
    mileageAllowance: current.rental?.mileageAllowance ?? "",
    additionalNotes: current.rental?.additionalNotes,
  }

  const agreement = buildRentalAgreementSnapshot({
    formData,
    selectedVehicle: {
      id: vehicle._id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      pricePerDay: vehicle.pricePerDay,
      pricePerWeek: vehicle.pricePerWeek,
      deliveryFee: vehicle.deliveryFee,
    },
    additionalDrivers: current.additionalDrivers ?? [],
    acceptedAt: now,
  })

  const safeName = (current.renter?.fullName || "renter").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()
  const pdfBytes = createAgreementPdf(agreement.plainText)
  const pdfAssetId = await uploadSanityFile(
    pdfBytes,
    "application/pdf",
    `${safeName || "renter"}-rental-agreement-amended.pdf`,
  )

  const newVehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`.replace(/\s+/g, " ").trim()

  await sanityMutate([
    {
      patch: {
        id: applicationId,
        setIfMissing: { vehicleChangeHistory: [] },
        insert: {
          after: "vehicleChangeHistory[-1]",
          items: [
            {
              _key: crypto.randomUUID(),
              changedAt: now,
              changedBy: session.email,
              reason: trimmedReason,
              previousVehicleLabel: current.selectedVehicleLabel ?? null,
              newVehicleLabel,
              previousAgreementPdf: current.activeAgreementPdf ?? undefined,
            },
          ],
        },
        set: {
          selectedVehicle: {
            vehicle: { _type: "reference", _ref: vehicle._id },
            label: newVehicleLabel,
            color: vehicle.color,
            pricePerDay: vehicle.pricePerDay,
            pricePerWeek: vehicle.pricePerWeek,
            selectedRate: "week",
            selectedRatePrice: vehicle.pricePerWeek,
          },
          // The original `agreement` (real customer signature + real accepted
          // date) is never touched. Each vehicle change instead produces its
          // own new agreement here, reflecting the vehicle at the time.
          currentAgreement: {
            vehicleLabel: newVehicleLabel,
            generatedAt: now,
            renderedHtml: agreement.renderedHtml,
            plainText: agreement.plainText,
            pdf: { _type: "file", asset: { _type: "reference", _ref: pdfAssetId } },
          },
        },
      },
    },
  ])

  revalidatePath("/applications")
  revalidatePath(`/applications/${applicationId}`)

  return { ok: true as const }
}
