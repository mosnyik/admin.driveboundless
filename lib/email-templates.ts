import "server-only"

import { describeInsuranceChoice, type ApplicationInsurance } from "@/lib/application-types"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function getAppUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")
}

function wrapper(bodyHtml: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#f4f1ea;font-family:Georgia,'Times New Roman',serif;color:#1a1611;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e7e2d6;">
          <tr>
            <td style="background-color:#000000;padding:24px 32px;">
              <span style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#d4af37;font-family:Arial,sans-serif;">Drive Boundless</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#faf8f2;border-top:1px solid #e7e2d6;">
              <span style="font-size:12px;color:#8a8375;font-family:Arial,sans-serif;">Drive Boundless Auto Solutions &middot; Turchese Solutions LLC</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function button(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background-color:#AD524D;color:#FAF8F5;text-decoration:none;padding:12px 24px;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;">${escapeHtml(label)}</a>`
}

interface NewApplicationEmailInput {
  applicationId: string
  renterName: string
  renterEmail: string
  renterPhone: string
  vehicleLabel: string | null
  startDate: string | null
  endDate: string | null
}

export function newApplicationAlertEmail(input: NewApplicationEmailInput) {
  const detailUrl = `${getAppUrl()}/applications/${input.applicationId}`
  const dateRange =
    input.startDate && input.endDate ? `${input.startDate} – ${input.endDate}` : "Not specified"

  const html = wrapper(`
    <h1 style="margin:0 0 4px;font-size:22px;">New rental application</h1>
    <p style="margin:0 0 24px;color:#5b5548;font-family:Arial,sans-serif;font-size:14px;">
      A new application just came in and needs a response.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;color:#8a8375;">Renter</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtml(input.renterName || "N/A")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8375;">Email</td><td style="padding:6px 0;text-align:right;">${escapeHtml(input.renterEmail || "N/A")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8375;">Phone</td><td style="padding:6px 0;text-align:right;">${escapeHtml(input.renterPhone || "N/A")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8375;">Vehicle</td><td style="padding:6px 0;text-align:right;">${escapeHtml(input.vehicleLabel || "Not selected")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8375;">Dates</td><td style="padding:6px 0;text-align:right;">${escapeHtml(dateRange)}</td></tr>
    </table>
    ${button("View application", detailUrl)}
  `)

  const text = [
    "New rental application",
    "",
    `Renter: ${input.renterName || "N/A"}`,
    `Email: ${input.renterEmail || "N/A"}`,
    `Phone: ${input.renterPhone || "N/A"}`,
    `Vehicle: ${input.vehicleLabel || "Not selected"}`,
    `Dates: ${dateRange}`,
    "",
    `View application: ${detailUrl}`,
  ].join("\n")

  return {
    subject: `New rental application: ${input.renterName || "Untitled applicant"}`,
    html,
    text,
  }
}

interface OwnerApprovalEmailInput {
  token: string
  renterName: string
  vehicleLabel: string | null
  startDate: string | null
  endDate: string | null
}

export function ownerApprovalAlertEmail(input: OwnerApprovalEmailInput) {
  const reviewUrl = `${getAppUrl()}/owner-action/${input.token}`
  const dateRange =
    input.startDate && input.endDate ? `${input.startDate} – ${input.endDate}` : "Not specified"

  const html = wrapper(`
    <h1 style="margin:0 0 4px;font-size:22px;">New rental request</h1>
    <p style="margin:0 0 24px;color:#5b5548;font-family:Arial,sans-serif;font-size:14px;">
      A rental request for one of your vehicles is waiting on your decision.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;color:#8a8375;">Renter</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtml(input.renterName || "N/A")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8375;">Vehicle</td><td style="padding:6px 0;text-align:right;">${escapeHtml(input.vehicleLabel || "Not selected")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8375;">Dates</td><td style="padding:6px 0;text-align:right;">${escapeHtml(dateRange)}</td></tr>
    </table>
    ${button("Review & respond", reviewUrl)}
    <p style="margin:20px 0 0;color:#8a8375;font-family:Arial,sans-serif;font-size:12px;">
      No login needed: this link is unique to this request and expires once you've responded or after 14 days.
    </p>
  `)

  const text = [
    "New rental request",
    "",
    `Renter: ${input.renterName || "N/A"}`,
    `Vehicle: ${input.vehicleLabel || "Not selected"}`,
    `Dates: ${dateRange}`,
    "",
    `Review & respond: ${reviewUrl}`,
    "",
    "No login needed: this link is unique to this request and expires once you've responded or after 14 days.",
  ].join("\n")

  return {
    subject: `Rental request needs your decision: ${input.renterName || "Untitled applicant"}`,
    html,
    text,
  }
}

interface BookingConfirmationEmailInput {
  renterName: string
  renterPhone: string
  renterEmail: string
  renterAddress: { street: string; city: string; state: string; zip: string } | null
  vehicleLabel: string | null
  startDate: string | null
  startTime: string | null
  endDate: string | null
  endTime: string | null
  rentalPurpose: string | null
  paymentDueDay: string | null
  mileageAllowance: string | null
  insurance: ApplicationInsurance | null
  additionalDrivers: Array<{ name: string }> | null
  agreementAttached: boolean
}

function formatMileageAllowance(value: string | null) {
  if (!value) return "Not specified"
  return value === "unlimited" ? "Unlimited" : `${value} miles/week`
}

export function bookingConfirmationEmail(input: BookingConfirmationEmailInput) {
  const pickup = input.startDate ? `${input.startDate}${input.startTime ? ` at ${input.startTime}` : ""}` : "Not specified"
  const returnBy = input.endDate ? `${input.endDate}${input.endTime ? ` at ${input.endTime}` : ""}` : "Not specified"
  const address = input.renterAddress
    ? [input.renterAddress.street, input.renterAddress.city, input.renterAddress.state, input.renterAddress.zip]
        .filter(Boolean)
        .join(", ")
    : ""
  const insuranceSummary = describeInsuranceChoice(input.insurance)
  const driverNames = (input.additionalDrivers ?? []).map((driver) => driver.name).filter(Boolean)

  const rows: Array<[string, string]> = [
    ["Vehicle", input.vehicleLabel || "Not selected"],
    ["Pick-up", pickup],
    ["Return", returnBy],
    ["Rental purpose", input.rentalPurpose || "Not specified"],
    ["Payment due day", input.paymentDueDay || "Not specified"],
    ["Mileage allowance", formatMileageAllowance(input.mileageAllowance)],
    ["Insurance", insuranceSummary],
    ...(driverNames.length > 0 ? ([["Additional drivers", driverNames.join(", ")]] as Array<[string, string]>) : []),
    ["Renter", input.renterName || "Not provided"],
    ["Phone", input.renterPhone || "Not provided"],
    ["Email", input.renterEmail || "Not provided"],
    ...(address ? ([["Address", address]] as Array<[string, string]>) : []),
  ]

  const html = wrapper(`
    <h1 style="margin:0 0 4px;font-size:22px;">You're confirmed!</h1>
    <p style="margin:0 0 24px;color:#5b5548;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
      Hi ${escapeHtml(input.renterName || "there")}, your rental request has been approved. Here's a summary of your booking:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;margin-bottom:24px;">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:6px 0;color:#8a8375;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;text-align:right;">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}
    </table>
    <p style="margin:0 0 16px;color:#5b5548;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
      ${input.agreementAttached ? "Your rental agreement is attached." : "Your rental agreement will follow separately."} If you have any questions/concerns please reply to this email.
    </p>
    <p style="margin:0;color:#5b5548;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
      Thanks
    </p>
  `)

  const text = [
    "You're confirmed!",
    "",
    `Hi ${input.renterName || "there"}, your rental request has been approved. Here's a summary of your booking:`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `${input.agreementAttached ? "Your rental agreement is attached." : "Your rental agreement will follow separately."} If you have any questions/concerns please reply to this email.`,
    "",
    "Thanks",
  ].join("\n")

  return {
    subject: "You're confirmed: Drive Boundless rental",
    html,
    text,
  }
}

interface AgreementEmailInput {
  renterName: string
  vehicleLabel: string | null
}

export function agreementEmail(input: AgreementEmailInput) {
  const html = wrapper(`
    <h1 style="margin:0 0 4px;font-size:22px;">Your rental agreement</h1>
    <p style="margin:0 0 16px;color:#5b5548;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
      Hi ${escapeHtml(input.renterName || "there")}, your rental agreement is attached${
        input.vehicleLabel ? ` for the ${escapeHtml(input.vehicleLabel)}` : ""
      }. Please keep a copy for your records. If you have any questions/concerns please reply to this email.
    </p>
    <p style="margin:0;color:#5b5548;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
      Thanks
    </p>
  `)

  const text = `Hi ${input.renterName || "there"}, your rental agreement is attached${
    input.vehicleLabel ? ` for the ${input.vehicleLabel}` : ""
  }. Please keep a copy for your records. If you have any questions/concerns please reply to this email.\n\nThanks`

  return {
    subject: "Your Drive Boundless rental agreement",
    html,
    text,
  }
}

interface AgreementUpdatedEmailInput {
  renterName: string
  vehicleLabel: string | null
}

export function agreementUpdatedEmail(input: AgreementUpdatedEmailInput) {
  const html = wrapper(`
    <h1 style="margin:0 0 4px;font-size:22px;">Your rental agreement has been updated</h1>
    <p style="margin:0 0 16px;color:#5b5548;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
      Hi ${escapeHtml(input.renterName || "there")}, your rental agreement${
        input.vehicleLabel ? ` for the ${escapeHtml(input.vehicleLabel)}` : ""
      } has been updated to include your insurance information. The updated agreement is attached — please keep a copy for your records. If you have any questions/concerns please reply to this email.
    </p>
    <p style="margin:0;color:#5b5548;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
      Thanks
    </p>
  `)

  const text = `Hi ${input.renterName || "there"}, your rental agreement${
    input.vehicleLabel ? ` for the ${input.vehicleLabel}` : ""
  } has been updated to include your insurance information. The updated agreement is attached — please keep a copy for your records. If you have any questions/concerns please reply to this email.\n\nThanks`

  return {
    subject: "Your Drive Boundless rental agreement has been updated",
    html,
    text,
  }
}
