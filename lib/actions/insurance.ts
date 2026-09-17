"use server"

import { revalidatePath } from "next/cache"
import { getCallerScope, getSession } from "@/lib/auth"
import { sanityFetch, sanityMutate, uploadSanityFile } from "@/lib/sanity"
import {
  buildRentalAgreementSnapshot,
  type RentalAgreementCompany,
  type RentalAgreementFormData,
} from "@/lib/rental-agreement"
import { createAgreementPdf } from "@/lib/agreement-pdf"
import { sendEmail, RENTER_REPLY_TO_EMAIL } from "@/lib/email"
import { agreementUpdatedEmail } from "@/lib/email-templates"
import type { ApplicationInsurance } from "@/lib/application-types"

interface CurrentApplicationState {
  renter: {
    fullName: string
    phone: string
    email: string
    address: { street: string; city: string; state: string; zip: string }
  } | null
  license: { number: string; state: string; expiry: string } | null
  insurance: ApplicationInsurance | null
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
  vehicle: {
    _id: string
    make: string
    model: string
    year: number
    color: string
    pricePerDay: number
    pricePerWeek: number
    deliveryFee: number
    company: RentalAgreementCompany | null
  } | null
  companyId: string | null
}

const currentStateQuery = `*[_id == $id][0]{
  renter,
  license,
  insurance,
  rental,
  additionalDrivers,
  "selectedVehicleLabel": selectedVehicle.label,
  "vehicle": selectedVehicle.vehicle->{
    _id,
    make,
    model,
    year,
    color,
    "pricePerDay": coalesce(pricePerDay, round(coalesce(pricePerWeek, 0) / 7 / 0.9)),
    "pricePerWeek": coalesce(pricePerWeek, round(coalesce(pricePerDay, 0) * 7 * 0.9)),
    "deliveryFee": coalesce(deliveryFee, 0),
    "company": company->{"legalName": name, dbaName, address, phone, email}
  },
  "companyId": selectedVehicle.vehicle->company->_id
}`

/** Saves the carrier/policy number staff collect once a renter provides proof
 * of insurance (own policy, or the short-term RentalCover.com coverage they
 * said they'd get). Regenerates the rental agreement so it reflects the real
 * insurance on file, and emails the updated agreement to the renter — the
 * same "current agreement" mechanism vehicle changes use, so the original,
 * customer-signed agreement is never altered. */
export async function updateApplicationInsurance(
  applicationId: string,
  values: { carrier: string; policyNumber: string },
) {
  const [session, scope] = await Promise.all([getSession(), getCallerScope()])

  if (!session || !scope) {
    throw new Error("You must be signed in to do that.")
  }

  const carrier = values.carrier.trim()
  const policyNumber = values.policyNumber.trim()

  if (!carrier || !policyNumber) {
    throw new Error("Carrier and policy number are both required.")
  }

  const current = await sanityFetch<CurrentApplicationState>(currentStateQuery, { id: applicationId })

  if (!current) {
    throw new Error("Application not found.")
  }

  if (scope.role === "owner" && current.companyId !== scope.companyId) {
    throw new Error("You can only update bookings for your own company.")
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
    insuranceCarrier: carrier,
    insurancePolicyNumber: policyNumber,
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

  const vehicle = current.vehicle
  const vehicleLabel = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`.replace(/\s+/g, " ").trim()
    : current.selectedVehicleLabel

  const agreement = buildRentalAgreementSnapshot({
    formData,
    selectedVehicle: vehicle
      ? {
          id: vehicle._id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          pricePerDay: vehicle.pricePerDay,
          pricePerWeek: vehicle.pricePerWeek,
          deliveryFee: vehicle.deliveryFee,
        }
      : null,
    additionalDrivers: current.additionalDrivers ?? [],
    acceptedAt: now,
    company: vehicle?.company ?? undefined,
  })

  const safeName = (current.renter?.fullName || "renter").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()
  const pdfBytes = createAgreementPdf(agreement.plainText)
  const pdfAssetId = await uploadSanityFile(
    pdfBytes,
    "application/pdf",
    `${safeName || "renter"}-rental-agreement-updated.pdf`,
  )

  await sanityMutate([
    {
      patch: {
        id: applicationId,
        set: {
          "insurance.carrier": carrier,
          "insurance.policyNumber": policyNumber,
          currentAgreement: {
            vehicleLabel,
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

  const recipientEmail = current.renter?.email

  if (!recipientEmail) {
    return { ok: true as const, emailSent: false as const }
  }

  try {
    const pdfBuffer = Buffer.from(pdfBytes)
    const email = agreementUpdatedEmail({
      renterName: current.renter?.fullName ?? "",
      vehicleLabel,
    })

    await sendEmail({
      to: recipientEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: [{ filename: "rental-agreement-updated.pdf", content: pdfBuffer }],
      replyTo: RENTER_REPLY_TO_EMAIL,
    })

    await sanityMutate([
      {
        patch: {
          id: applicationId,
          setIfMissing: { agreementEmailHistory: [] },
          insert: {
            after: "agreementEmailHistory[-1]",
            items: [
              {
                _key: crypto.randomUUID(),
                sentAt: now,
                sentBy: session.email,
                sentTo: recipientEmail,
              },
            ],
          },
        },
      },
    ])

    revalidatePath(`/applications/${applicationId}`)

    return { ok: true as const, emailSent: true as const }
  } catch (error) {
    console.error("Failed to email the updated rental agreement", error)
    return {
      ok: true as const,
      emailSent: false as const,
      emailError: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
