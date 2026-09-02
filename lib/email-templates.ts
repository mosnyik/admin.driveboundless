import "server-only"

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
  return `<a href="${href}" style="display:inline-block;background-color:#000000;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;">${escapeHtml(label)}</a>`
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
      <tr><td style="padding:6px 0;color:#8a8375;">Renter</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtml(input.renterName || "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8375;">Email</td><td style="padding:6px 0;text-align:right;">${escapeHtml(input.renterEmail || "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8375;">Phone</td><td style="padding:6px 0;text-align:right;">${escapeHtml(input.renterPhone || "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8375;">Vehicle</td><td style="padding:6px 0;text-align:right;">${escapeHtml(input.vehicleLabel || "Not selected")}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8375;">Dates</td><td style="padding:6px 0;text-align:right;">${escapeHtml(dateRange)}</td></tr>
    </table>
    ${button("View application", detailUrl)}
  `)

  const text = [
    "New rental application",
    "",
    `Renter: ${input.renterName || "—"}`,
    `Email: ${input.renterEmail || "—"}`,
    `Phone: ${input.renterPhone || "—"}`,
    `Vehicle: ${input.vehicleLabel || "Not selected"}`,
    `Dates: ${dateRange}`,
    "",
    `View application: ${detailUrl}`,
  ].join("\n")

  return {
    subject: `New rental application — ${input.renterName || "Untitled applicant"}`,
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
    <p style="margin:0 0 20px;color:#5b5548;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
      Hi ${escapeHtml(input.renterName || "there")}, attached is your current rental agreement${
        input.vehicleLabel ? ` for the ${escapeHtml(input.vehicleLabel)}` : ""
      }. Please keep a copy for your records. If anything looks off, just reply to this email.
    </p>
  `)

  const text = `Hi ${input.renterName || "there"},\n\nAttached is your current rental agreement${
    input.vehicleLabel ? ` for the ${input.vehicleLabel}` : ""
  }. Please keep a copy for your records. If anything looks off, just reply to this email.`

  return {
    subject: "Your Drive Boundless rental agreement",
    html,
    text,
  }
}
