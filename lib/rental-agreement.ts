import "server-only"

// Kept in sync with the same template in the public drive-boundless site's
// lib/rental-agreement.ts, since both must produce the identical legal document.
type RentalRate = "week"

export interface RentalAgreementFormData {
  fullName: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  licenseNumber: string
  licenseState: string
  licenseExpiry: string
  insuranceCarrier?: string
  insurancePolicyNumber?: string
  rentalPurpose: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  rentalRate: RentalRate
  paymentDueDay: string
  mileageAllowance: string
  additionalNotes?: string
}

export interface RentalAgreementVehicle {
  id: string
  make: string
  model: string
  year: number
  color: string
  pricePerDay: number
  pricePerWeek: number
  deliveryFee?: number
}

export interface RentalAgreementAdditionalDriver {
  name: string
  licenseNumber: string
  licenseState: string
}

interface BuildRentalAgreementInput {
  formData: RentalAgreementFormData
  selectedVehicle: RentalAgreementVehicle | null
  additionalDrivers: RentalAgreementAdditionalDriver[]
  acceptedAt: string
}

export interface RentalAgreementSnapshot {
  acceptedAt: string
  signedDate: string
  renterSignature: string
  ownerSignature: string
  renderedHtml: string
  plainText: string
}

const ownerSignature = "Turchese Solutions LLC"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function valueOrPlaceholder(value: string | number | undefined | null, fallback = "_______________") {
  if (value === undefined || value === null || value === "") return fallback
  return String(value)
}

function formatDate(date: string) {
  if (!date) return "_______________"

  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatAcceptedDate(acceptedAt: string) {
  const parsed = new Date(acceptedAt)
  if (Number.isNaN(parsed.getTime())) return formatDate(acceptedAt.slice(0, 10))

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(date: string, time: string) {
  return `${formatDate(date)} at ${valueOrPlaceholder(time, "__:__")}`
}

function vehicleLabel(vehicle: RentalAgreementVehicle | null) {
  if (!vehicle) return "No vehicle selected"
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.color})`
}

function htmlSection(title: string, body: string) {
  return `<section><h2>${escapeHtml(title)}</h2>${body}</section>`
}

function textSection(title: string, lines: string[]) {
  return [`${title}`, ...lines, ""].join("\n")
}

export function buildRentalAgreementSnapshot({
  formData,
  selectedVehicle,
  additionalDrivers,
  acceptedAt,
}: BuildRentalAgreementInput): RentalAgreementSnapshot {
  const signedDate = formatAcceptedDate(acceptedAt)
  const renterSignature = formData.fullName
  const renterAddress = formData.address
    ? `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`
    : "_______________"
  const insurance = `${formData.insuranceCarrier || "Not provided at submission"}${
    formData.insurancePolicyNumber ? ` - ${formData.insurancePolicyNumber}` : ""
  }`
  const selectedRatePrice = selectedVehicle?.pricePerWeek
  const additionalDriverLines = additionalDrivers
    .filter((driver) => driver.name || driver.licenseNumber || driver.licenseState)
    .map(
      (driver, index) =>
        `Approved Additional Driver ${index + 1}: ${valueOrPlaceholder(driver.name)} (License: ${valueOrPlaceholder(
          driver.licenseNumber,
          "___",
        )} / ${valueOrPlaceholder(driver.licenseState, "__")})`,
    )

  const sections = [
    {
      title: "Identification of the Rental Vehicle",
      lines: [
        "Owner hereby agrees to rent to Renter a passenger vehicle identified as follows:",
        `Vehicle: ${vehicleLabel(selectedVehicle)}`,
        "VIN: To be recorded at pickup",
        "License Plate: To be recorded at pickup",
        `This Car Rental Agreement is entered into between Turchese Solutions LLC DBA Boundless Autos and ${valueOrPlaceholder(
          formData.fullName,
          "Renter",
        )} and outlines the respective rights and obligations of the Parties relating to the rental of a vehicle. Renter is not Owner's agent for any purpose and may not assign, delegate, or transfer obligations under this Agreement.`,
      ],
    },
    {
      title: "1. Rental Term",
      lines: [
        `Estimated Start Date: ${formatDateTime(formData.startDate, formData.startTime)}`,
        `Estimated End Date: ${formatDateTime(formData.endDate, formData.endTime)}`,
        "The term begins at vehicle pickup and continues until the vehicle is returned to Owner and all Agreement terms have been completed by both Parties. If Client returns the rental vehicle before the rental week is complete, Client remains responsible for the full weekly payment. A refundable security deposit of $50 is due at initial pickup. Weekly payment is due by 5:00 PM, or a $50 late fee will apply.",
      ],
    },
    {
      title: "2. Rental Fees",
      lines: [
        `Weekly Rate: ${selectedRatePrice ? `$${selectedRatePrice} per week` : "To be selected"}`,
        "Security Deposit: $50",
        `Delivery Fee: $${selectedVehicle?.deliveryFee ?? 0}`,
        `Weekly payments are due by: 5:00 PM on ${formData.paymentDueDay} each week.`,
        "Late fee is $50 per day. On Day 2, the car may be repossessed.",
        "To receive an extension, half of the weekly payment must be paid on the due date. If payment is not received, the vehicle must be returned.",
        "Renter is responsible for a $1,000 deductible when damage is done to the vehicle if damages are under $1,000.",
        "If the vehicle is repossessed for missed payment or any other reason, the deposit will be forfeited.",
        "Vehicle is for in-state use only. If taken out of state, it may be reported stolen.",
        "Renter is responsible for any damage to the vehicle.",
        "If Renter terminates the agreement before the end date, Renter forfeits the deposit.",
        "The Parties may shorten or extend the estimated rental term by written mutual consent. If the agreement is shortened, the Renter remains liable for the full weekly payment.",
      ],
    },
    {
      title: "3. Deposit",
      lines: [
        "A deposit fee of $50 is required at the initial meeting for the rental vehicle. This deposit is fully refundable provided that the vehicle is returned in the same condition, no smoke or odor is present, no missed payment requires repossession, the vehicle is not excessively dirty, and the key is not misplaced.",
      ],
    },
    {
      title: "4. Mileage",
      lines: [
        `Mileage Allotted: ${
          formData.mileageAllowance === "unlimited" ? "Unlimited" : `${formData.mileageAllowance} miles per week`
        }`,
        `Rate for Extra Mileage: ${
          formData.mileageAllowance === "unlimited" ? "N/A" : "$0.25 per mile over allowance"
        }`,
      ],
    },
    {
      title: "5. Additional Charges and Conditions",
      lines: [
        "A reasonable fee of $60 will be charged for interior cleaning if stains, dirt, odor, or soiling attributable to Renter's use cannot be cleaned using standard post-rental procedures.",
        "If the key or key fob is not returned with the vehicle, a $300 replacement fee will apply.",
        "Smoking, including e-cigarettes, is prohibited in the vehicle. If the car smells of smoke or vapor residue, the full deposit will be forfeited.",
        "Renter and any third party billed for rental charges are jointly and severally responsible for payment of all charges.",
        "If the vehicle uses automatic toll payment capability, Renter will be charged the toll fee plus an administrative fee.",
        "Turchese Solutions LLC DBA Boundless Autos may rescind the Rental Agreement in the event of a manifest pricing or description error.",
      ],
    },
    {
      title: "6. Taxes, Surcharges & Fees",
      lines: [
        "Renter will pay all applicable taxes and any additional charges provided in the Rental Agreement that are above the base rental rate. These may include surcharges and recovery fees.",
      ],
    },
    {
      title: "7. Changes",
      lines: [
        "Any change to this Rental Agreement or Owner's rights must be in writing and signed by an authorized officer. Turchese Solutions LLC DBA Boundless Autos reserves the right to modify these Terms and Conditions upon written or electronic notice. Such changes apply only to future rentals after notice has been given.",
      ],
    },
    {
      title: "8. Who May Drive the Car",
      lines: [
        `Primary Renter: ${valueOrPlaceholder(formData.fullName)}`,
        "Renter's spouse or domestic partner, if approved by Owner.",
        "Employer or fellow employee under a corporate rental arrangement, if approved by Owner.",
        ...additionalDriverLines,
        "All permitted drivers must be at least 25 years old, hold a valid driver's license, and be approved by Owner. Any additional driver must sign an additional driver form. Renter remains financially responsible for the vehicle regardless of who operates it.",
      ],
    },
    {
      title: "9. Return of the Car",
      lines: [
        "Renter agrees to return the vehicle in the same condition received, ordinary wear and tear excepted, at the agreed date, time, and location. If returned late, additional rental fees and late return fees may apply. Extensions must be requested and approved before the return date.",
      ],
    },
    {
      title: "10. Repossessing the Car",
      lines: [
        "Turchese Solutions LLC DBA Boundless Autos may repossess the vehicle at any time for reasons including failure to return vehicle when due, missed payments, illegal use, violation of Rental Agreement, or abandonment.",
        "Renter agrees to reimburse all repossession costs and forfeit the security deposit if repossession occurs.",
      ],
    },
    {
      title: "11. Damage to / Loss of the Car",
      lines: [
        "Renter and/or Renter's insurance are responsible for all loss or damage to the vehicle regardless of cause. If the vehicle is damaged, stolen, or lost, Renter is responsible for repair costs, diminished value, fair market value, loss of use, administrative fees, towing, and storage fees.",
        "If using in-house insurance, Renter is responsible for a $1,000 deductible. Unauthorized repairs will not be reimbursed.",
      ],
    },
    {
      title: "12. Prohibited Use of the Car",
      lines: [
        "Unauthorized drivers, carrying passengers or property for hire, towing, racing, off-road driving, driving under the influence, illegal activity, reckless driving, driving into Mexico without permission, failure to report accidents, fraud or misrepresentation, leaving keys in unattended vehicle, and texting or handheld phone use while driving automatically terminate this Rental Agreement and void all liability protections.",
        "Violations make Renter liable for all related damages, penalties, legal fees, and recovery costs.",
      ],
    },
    {
      title: "13. Fuel Service Charge",
      lines: [
        "Most rentals include a full tank of fuel. Renter may avoid fuel service charges by returning the vehicle with the same fuel level and presenting a fuel receipt if requested. Only the correct fuel type may be used.",
      ],
    },
    {
      title: "14. Security Deposit",
      lines: [
        "Renter must provide a security deposit of $50. Owner may place a hold on a credit card instead. The deposit may be used toward damage repairs, smoking violations, late returns, and mechanical or physical damage.",
        "If damages exceed the deposit amount, Renter is responsible for the remaining balance. No exceptions.",
      ],
    },
    {
      title: "15. Property in the Car",
      lines: [
        "Turchese Solutions LLC DBA Boundless Autos is not responsible for loss, theft, or damage to personal property left in or on the vehicle or on company premises.",
      ],
    },
    {
      title: "16. Insurance",
      lines: [
        `Renter's Insurance: ${insurance}`,
        "Renter must provide proof of insurance covering damage to the Rental Vehicle, personal injury, passenger injuries, and property damage. Turchese Solutions LLC DBA Boundless Autos must be added to the insurance policy and notified of any policy changes. If using company insurance, Renter is responsible for a $1,000 deductible for at-fault accidents or damages. Failure to pay deductible within 7 days may result in legal action.",
      ],
    },
    {
      title: "17. Indemnification",
      lines: [
        "Renter agrees to indemnify and hold harmless the Owner from all claims, losses, damages, and legal actions arising from Renter's use of the Rental Vehicle. This includes attorney's fees, parking tickets, moving violations, and citations.",
      ],
    },
    {
      title: "18. Collections",
      lines: [
        "If Renter fails to pay amounts due under this Agreement, a late charge of 1.5% per month may apply. Renter agrees to pay court costs, attorney's fees, collection fees, and recovery costs. Renter authorizes contact with Renter or Renter's employer regarding collection of unpaid balances.",
      ],
    },
    {
      title: "19. Representations and Warranties",
      lines: [
        "Owner represents that the Rental Vehicle is in good condition and safe for operation. Renter represents that Renter is legally entitled to operate a motor vehicle and will not operate the vehicle unlawfully or negligently. Renter acknowledges inspection of the vehicle and is unaware of damage other than that listed in a separate Existing Damage document.",
      ],
    },
    {
      title: "20. Entire Agreement",
      lines: [
        "This Car Rental Agreement constitutes the entire agreement between the Parties. No modification may be made unless in writing and signed by both Parties. There are no refunds for cancellations once a vehicle is reserved or if the vehicle breaks down during the rental period. If mechanical failure occurs due to Owner negligence, reasonable efforts will be made to extend the rental or provide a substitute vehicle. Walk-around inspections and photographs will be conducted before and after rental. Renter is responsible for any damage occurring while the vehicle is in Renter's possession.",
      ],
    },
  ]

  const plainText = [
    "BOUNDLESS AUTO SOLUTIONS",
    "GEORGIA MOTOR VEHICLE RENTAL AGREEMENT",
    "Operated by Turchese Solutions LLC",
    "Email: info@turcheseconsulting.com",
    "Phone: +1 929-213-5106",
    "",
    "This Motor Vehicle Rental Agreement (\"Agreement\") is entered into between:",
    "",
    "Rental Company:",
    "Turchese Solutions LLC d/b/a Boundless Auto Solutions",
    "Address: To be communicated via text or email",
    "Phone: +1 929-213-5106",
    "info@turcheseconsulting.com",
    "(\"Owner\" or \"Company\")",
    "",
    "Renter:",
    `Name: ${valueOrPlaceholder(formData.fullName)}`,
    `License: ${valueOrPlaceholder(formData.licenseNumber)} / ${valueOrPlaceholder(formData.licenseState, "__")}`,
    `Address: ${renterAddress}`,
    `Phone: ${valueOrPlaceholder(formData.phone)}`,
    `Email: ${valueOrPlaceholder(formData.email)}`,
    `Insurance: ${insurance}`,
    "(\"Renter\")",
    "",
    ...sections.map((section) => textSection(section.title.toUpperCase(), section.lines)),
    "SIGNATURES",
    "RENTER",
    `Renter's Signature: ${renterSignature}`,
    "",
    "OWNER / COMPANY",
    `Date: ${signedDate}`,
    `Signature: ${ownerSignature}`,
  ].join("\n")

  const sectionHtml = sections
    .map((section) =>
      htmlSection(
        section.title,
        section.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join(""),
      ),
    )
    .join("")

  const renderedHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Georgia Motor Vehicle Rental Agreement</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.45; margin: 40px; }
    h1, h2, h3 { margin: 0 0 8px; }
    h1 { font-size: 20px; text-align: center; }
    h2 { font-size: 15px; margin-top: 20px; border-top: 1px solid #d1d5db; padding-top: 12px; }
    p { margin: 4px 0; }
    .center { text-align: center; }
    .muted { color: #4b5563; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 16px; }
    .underlined { display: inline-block; border-bottom: 1px solid #111827; min-width: 220px; padding: 0 6px 2px; }
  </style>
</head>
<body>
  <header class="center">
    <h1>BOUNDLESS AUTO SOLUTIONS</h1>
    <h1>GEORGIA MOTOR VEHICLE RENTAL AGREEMENT</h1>
    <p class="muted">Operated by Turchese Solutions LLC</p>
    <p class="muted">Email: info@turcheseconsulting.com</p>
    <p class="muted">Phone: +1 929-213-5106</p>
    <p class="muted">This Motor Vehicle Rental Agreement (&quot;Agreement&quot;) is entered into between:</p>
  </header>
  <div class="grid">
    <section>
      <h3>Rental Company:</h3>
      <p>Turchese Solutions LLC d/b/a Boundless Auto Solutions</p>
      <p>Address: To be communicated via text or email</p>
      <p>Phone: +1 929-213-5106</p>
      <p>info@turcheseconsulting.com</p>
      <p class="muted">(&quot;Owner&quot; or &quot;Company&quot;)</p>
    </section>
    <section>
      <h3>Renter:</h3>
      <p><strong>Name:</strong> ${escapeHtml(valueOrPlaceholder(formData.fullName))}</p>
      <p><strong>License:</strong> ${escapeHtml(valueOrPlaceholder(formData.licenseNumber))} / ${escapeHtml(
        valueOrPlaceholder(formData.licenseState, "__"),
      )}</p>
      <p><strong>Address:</strong> ${escapeHtml(renterAddress)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(valueOrPlaceholder(formData.phone))}</p>
      <p><strong>Email:</strong> ${escapeHtml(valueOrPlaceholder(formData.email))}</p>
      <p><strong>Insurance:</strong> ${escapeHtml(insurance)}</p>
      <p class="muted">(&quot;Renter&quot;)</p>
    </section>
  </div>
  ${sectionHtml}
  <section>
    <h2>SIGNATURES</h2>
    <div class="signature-grid">
      <div>
        <p><strong>RENTER</strong></p>
        <p>Renter's Signature: <span class="underlined">${escapeHtml(renterSignature)}</span></p>
      </div>
      <div>
        <p><strong>OWNER / COMPANY</strong></p>
        <p>Date: <span class="underlined">${escapeHtml(signedDate)}</span></p>
        <p>Signature: <span class="underlined">${escapeHtml(ownerSignature)}</span></p>
      </div>
    </div>
  </section>
</body>
</html>`

  return {
    acceptedAt,
    signedDate,
    renterSignature,
    ownerSignature,
    renderedHtml,
    plainText,
  }
}

