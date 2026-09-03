import { NextResponse } from "next/server"
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook"
import { getApplicationById } from "@/lib/applications"
import { getAlertRecipients } from "@/lib/settings"
import { sendEmail } from "@/lib/email"
import { newApplicationAlertEmail } from "@/lib/email-templates"

interface WebhookPayload {
  _id?: string
}

export async function POST(request: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET

  if (!secret) {
    console.error("SANITY_WEBHOOK_SECRET is not configured.")
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get(SIGNATURE_HEADER_NAME)

  if (!signature || !(await isValidSignature(rawBody, signature, secret))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
  }

  let payload: WebhookPayload

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
  }

  if (!payload._id) {
    return NextResponse.json({ error: "Missing document id." }, { status: 400 })
  }

  const application = await getApplicationById(payload._id)

  if (!application) {
    // The document may have been deleted between the webhook firing and this request.
    return NextResponse.json({ ok: true, skipped: "not_found" })
  }

  const recipients = await getAlertRecipients()

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, skipped: "no_recipients" })
  }

  const email = newApplicationAlertEmail({
    applicationId: application.id,
    renterName: application.renter.fullName,
    renterEmail: application.renter.email,
    renterPhone: application.renter.phone,
    vehicleLabel: application.selectedVehicle?.label ?? null,
    startDate: application.rental.startDate || null,
    endDate: application.rental.endDate || null,
  })

  try {
    await sendEmail({
      to: recipients,
      subject: email.subject,
      html: email.html,
      text: email.text,
      fromName: "New Rental Alert",
    })
  } catch (error) {
    console.error("Failed to send new-application alert email", error)
    return NextResponse.json({ error: "Failed to send email." }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
