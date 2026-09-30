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
import { scheduleUpdatedEmail } from "@/lib/email-templates"
import {
  computeReturnSchedule,
  countRatePeriods,
  type ApplicationInsurance,
  type RentalRate,
} from "@/lib/application-types"

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
    rentalRate?: RentalRate
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
    vin?: string | null
    pricePerDay: number
    pricePerWeek: number
    deliveryFee: number
    company: RentalAgreementCompany | null
  } | null
  companyId: string | null
  /** Same "active agreement" coalesce vehicle-change.ts uses — retained on
   * the history entry so the pre-change agreement stays downloadable. */
  activeAgreementPdf: { _type: "file"; asset: { _type: "reference"; _ref: string } } | null
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
    vin,
    "pricePerDay": coalesce(pricePerDay, round(coalesce(pricePerWeek, 0) / 7 / 0.9)),
    "pricePerWeek": coalesce(pricePerWeek, round(coalesce(pricePerDay, 0) * 7 * 0.9)),
    "deliveryFee": coalesce(deliveryFee, 0),
    "company": company->{"legalName": name, dbaName, address, phone, email}
  },
  "companyId": selectedVehicle.vehicle->company->_id,
  "activeAgreementPdf": coalesce(currentAgreement.pdf, agreement.pdf)
}`

/** Moves the pick-up to a new date/time and derives the return from the
 * selected rate (same number of days/weeks as the original booking, back at
 * the pick-up time). Regenerates the rental agreement through the same
 * "current agreement" mechanism vehicle and insurance changes use — the
 * original, customer-signed agreement is never altered — and optionally
 * emails the renter the new times with the updated agreement attached. */
export async function updateRentalSchedule(
  applicationId: string,
  values: { startDate: string; startTime: string; notifyRenter: boolean },
) {
  const [session, scope] = await Promise.all([getSession(), getCallerScope()])

  if (!session || !scope) {
    throw new Error("You must be signed in to do that.")
  }

  const startDate = values.startDate.trim()
  const startTime = values.startTime.trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{2}:\d{2}$/.test(startTime)) {
    throw new Error("Please choose a valid pick-up date and time.")
  }

  const current = await sanityFetch<CurrentApplicationState>(currentStateQuery, { id: applicationId })

  if (!current) {
    throw new Error("Application not found.")
  }

  if (scope.role === "owner" && current.companyId !== scope.companyId) {
    throw new Error("You can only update bookings for your own company.")
  }

  const rate: RentalRate = current.rental?.rentalRate === "day" ? "day" : "week"
  const periods = countRatePeriods(current.rental?.startDate ?? "", current.rental?.endDate ?? "", rate)
  const schedule = computeReturnSchedule({ startDate, startTime, rate, periods })

  if (!schedule) {
    throw new Error("Please choose a valid pick-up date and time.")
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
    startDate,
    startTime,
    endDate: schedule.endDate,
    endTime: schedule.endTime,
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
          vin: vehicle.vin ?? undefined,
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
    `${safeName || "renter"}-rental-agreement-rescheduled.pdf`,
  )

  await sanityMutate([
    {
      patch: {
        id: applicationId,
        setIfMissing: { scheduleChangeHistory: [] },
        insert: {
          after: "scheduleChangeHistory[-1]",
          items: [
            {
              _key: crypto.randomUUID(),
              changedAt: now,
              changedBy: session.email,
              previousStartDate: current.rental?.startDate ?? null,
              previousStartTime: current.rental?.startTime ?? null,
              previousEndDate: current.rental?.endDate ?? null,
              previousEndTime: current.rental?.endTime ?? null,
              newStartDate: startDate,
              newStartTime: startTime,
              newEndDate: schedule.endDate,
              newEndTime: schedule.endTime,
              previousAgreementPdf: current.activeAgreementPdf ?? undefined,
            },
          ],
        },
        set: {
          "rental.startDate": startDate,
          "rental.startTime": startTime,
          "rental.endDate": schedule.endDate,
          "rental.endTime": schedule.endTime,
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

  if (!values.notifyRenter || !recipientEmail) {
    return { ok: true as const, ...schedule, emailSent: false as const, emailSkipped: true as const }
  }

  try {
    const email = scheduleUpdatedEmail({
      renterName: current.renter?.fullName ?? "",
      vehicleLabel,
      startDate,
      startTime,
      endDate: schedule.endDate,
      endTime: schedule.endTime,
      company: vehicle?.company ?? undefined,
    })

    await sendEmail({
      to: recipientEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: [{ filename: "rental-agreement-updated.pdf", content: Buffer.from(pdfBytes) }],
      replyTo: vehicle?.company?.email || RENTER_REPLY_TO_EMAIL,
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

    return { ok: true as const, ...schedule, emailSent: true as const, emailSkipped: false as const }
  } catch (error) {
    console.error("Failed to email the rescheduled rental agreement", error)
    return {
      ok: true as const,
      ...schedule,
      emailSent: false as const,
      emailSkipped: false as const,
      emailError: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
