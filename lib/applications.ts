import { sanityFetch } from "@/lib/sanity"

export type ApplicationStatus = "new" | "contacted" | "approved" | "declined"

export type ApplicationBucket = "needs-attention" | "in-progress" | "completed"

export function bucketForStatus(status: ApplicationStatus): ApplicationBucket {
  if (status === "new") return "needs-attention"
  if (status === "contacted") return "in-progress"
  return "completed"
}

export interface ApplicationListItem {
  id: string
  status: ApplicationStatus
  submittedAt: string | null
  renterName: string
  renterEmail: string
  renterPhone: string
  vehicleLabel: string | null
  startDate: string | null
  endDate: string | null
}

const listQuery = `*[_type == "rentalApplication"] | order(submittedAt desc) {
  "id": _id,
  status,
  submittedAt,
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

export interface ApplicationDetail {
  id: string
  status: ApplicationStatus
  submittedAt: string | null
  renter: {
    fullName: string
    phone: string
    email: string
    address: {
      street: string
      city: string
      state: string
      zip: string
    }
  }
  license: {
    number: string
    state: string
    expiry: string
    fileUrl: string | null
    fileName: string | null
  }
  insurance: {
    carrier?: string
    policyNumber?: string
  }
  rental: {
    purpose: string
    startDate: string
    startTime: string
    endDate: string
    endTime: string
    visitorTimeZone: string
    rentalRate: "day" | "week"
    paymentDueDay: string
    mileageAllowance: string
    additionalNotes?: string
  }
  selectedVehicle: {
    label: string
    color: string
    pricePerDay: number
    pricePerWeek: number
    selectedRate: "day" | "week"
    selectedRatePrice: number
    vehicleId: string | null
    vehicleImage: string | null
  } | null
  additionalDrivers: Array<{
    name: string
    licenseNumber: string
    licenseState: string
  }>
  agreementAccepted: boolean
  agreement: {
    accepted: boolean
    acceptedAt: string | null
    renterSignature: string
    ownerSignature: string
    ownerSignedDate: string
    pdfUrl: string | null
    renderedHtml: string | null
    plainText: string | null
  }
}

const detailQuery = `*[_type == "rentalApplication" && _id == $id][0]{
  "id": _id,
  status,
  submittedAt,
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
  }
}`

export async function getApplicationById(id: string) {
  return sanityFetch<ApplicationDetail>(detailQuery, { id })
}
