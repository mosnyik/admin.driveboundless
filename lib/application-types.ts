export type ApplicationStatus = "new" | "contacted" | "approved" | "declined"

export const APPLICATION_STATUSES: ApplicationStatus[] = ["new", "contacted", "approved", "declined"]

export type ApplicationBucket = "needs-attention" | "in-progress" | "completed"

export function bucketForStatus(status: ApplicationStatus): ApplicationBucket {
  if (status === "new") return "needs-attention"
  if (status === "contacted") return "in-progress"
  return "completed"
}

/** Applications sitting in a non-terminal status longer than this are flagged as waiting. */
export const WAITING_THRESHOLD_HOURS = 48

export function isTerminalStatus(status: ApplicationStatus) {
  return status === "approved" || status === "declined"
}

export function getWaitingHours(referenceDate: string | null) {
  if (!referenceDate) return null
  const ms = Date.now() - new Date(referenceDate).getTime()
  if (Number.isNaN(ms) || ms < 0) return null
  return ms / (1000 * 60 * 60)
}

export interface ApplicationListItem {
  id: string
  status: ApplicationStatus
  submittedAt: string | null
  statusUpdatedAt: string | null
  renterName: string
  renterEmail: string
  renterPhone: string
  vehicleLabel: string | null
  startDate: string | null
  endDate: string | null
}

export interface StatusHistoryEntry {
  from: ApplicationStatus | null
  to: ApplicationStatus
  changedAt: string
  changedBy: string
}

export interface VehicleChangeEntry {
  changedAt: string
  changedBy: string
  reason: string
  previousVehicleLabel: string | null
  newVehicleLabel: string
  previousAgreementPdfUrl: string | null
}

export interface AgreementEmailEntry {
  sentAt: string
  sentBy: string
  sentTo: string
}

export interface ApplicationDetail {
  id: string
  status: ApplicationStatus
  submittedAt: string | null
  statusUpdatedAt: string | null
  statusHistory: StatusHistoryEntry[]
  vehicleChangeHistory: VehicleChangeEntry[]
  agreementEmailHistory: AgreementEmailEntry[]
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
