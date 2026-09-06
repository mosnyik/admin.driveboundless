import "server-only"

import { sanityFetch } from "@/lib/sanity"
import type { ApplicationDetail, ApplicationListItem } from "@/lib/application-types"

export * from "@/lib/application-types"

const listQuery = `*[_type == "rentalApplication"] | order(submittedAt desc) {
  "id": _id,
  status,
  submittedAt,
  "statusUpdatedAt": coalesce(statusUpdatedAt, submittedAt),
  "renterName": renter.fullName,
  "renterEmail": renter.email,
  "renterPhone": renter.phone,
  "vehicleLabel": selectedVehicle.label,
  "startDate": rental.startDate,
  "endDate": rental.endDate
}`

export async function getApplications() {
  const results = await sanityFetch<ApplicationListItem[]>(listQuery)
  return results ?? []
}

const detailQuery = `*[_type == "rentalApplication" && _id == $id][0]{
  "id": _id,
  status,
  submittedAt,
  "statusUpdatedAt": coalesce(statusUpdatedAt, submittedAt),
  "statusHistory": statusHistory[] | order(changedAt desc){
    from,
    to,
    changedAt,
    changedBy
  },
  "vehicleChangeHistory": vehicleChangeHistory[] | order(changedAt desc){
    changedAt,
    changedBy,
    reason,
    previousVehicleLabel,
    newVehicleLabel,
    "previousAgreementPdfUrl": previousAgreementPdf.asset->url
  },
  "agreementEmailHistory": agreementEmailHistory[] | order(sentAt desc){
    sentAt,
    sentBy,
    sentTo
  },
  renter,
  license{
    number,
    state,
    expiry,
    "fileUrl": file.asset->url,
    "fileName": file.asset->originalFilename
  },
  insurance,
  rental,
  selectedVehicle{
    label,
    color,
    pricePerDay,
    pricePerWeek,
    selectedRate,
    selectedRatePrice,
    "vehicleId": vehicle->_id,
    "vehicleImage": vehicle->image.asset->url
  },
  "ownerCompany": selectedVehicle.vehicle->company->{"id": _id, name, "notificationEmail": coalesce(notificationEmail, email)},
  additionalDrivers,
  agreementAccepted,
  agreement{
    accepted,
    acceptedAt,
    renterSignature,
    ownerSignature,
    ownerSignedDate,
    "pdfUrl": pdf.asset->url,
    renderedHtml,
    plainText
  },
  "currentAgreement": currentAgreement{
    "pdfUrl": pdf.asset->url,
    vehicleLabel,
    generatedAt
  }
}`

export async function getApplicationById(id: string) {
  const result = await sanityFetch<ApplicationDetail>(detailQuery, { id })
  if (!result) return null

  return {
    ...result,
    statusHistory: result.statusHistory ?? [],
    vehicleChangeHistory: result.vehicleChangeHistory ?? [],
    agreementEmailHistory: result.agreementEmailHistory ?? [],
    renter: result.renter ?? {
      fullName: "",
      phone: "",
      email: "",
      address: { street: "", city: "", state: "", zip: "" },
    },
    license: result.license ?? { number: "", state: "", expiry: "", fileUrl: null, fileName: null },
    insurance: result.insurance ?? {},
    rental: result.rental ?? {
      purpose: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      visitorTimeZone: "",
      rentalRate: "week",
      paymentDueDay: "",
      mileageAllowance: "",
    },
    additionalDrivers: result.additionalDrivers ?? [],
    agreement: result.agreement ?? {
      accepted: false,
      acceptedAt: null,
      renterSignature: "",
      ownerSignature: "",
      ownerSignedDate: "",
      pdfUrl: null,
      renderedHtml: null,
      plainText: null,
    },
  }
}
