import "server-only"

import { sanityFetch, sanityMutate } from "@/lib/sanity"
import { sendEmail, RENTER_REPLY_TO_EMAIL } from "@/lib/email"
import { bookingConfirmationEmail } from "@/lib/email-templates"
import type { ApplicationInsurance } from "@/lib/application-types"

interface ApplicationForConfirmation {
  renterName: string
  renterEmail: string
  renterPhone: string
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
  confirmationEmailSentAt: string | null
  /** The most recent vehicle change's agreement, or the original if there's
   * been no vehicle change — same source send-agreement.ts uses. */
  activeAgreementPdfUrl: string | null
}

const applicationQuery = `*[_id == $id][0]{
  "renterName": renter.fullName,
  "renterEmail": renter.email,
  "renterPhone": renter.phone,
  "renterAddress": renter.address,
  "vehicleLabel": selectedVehicle.label,
  "startDate": rental.startDate,
  "startTime": rental.startTime,
  "endDate": rental.endDate,
  "endTime": rental.endTime,
  "rentalPurpose": rental.purpose,
  "paymentDueDay": rental.paymentDueDay,
  "mileageAllowance": rental.mileageAllowance,
  insurance,
  additionalDrivers[]{name},
  confirmationEmailSentAt,
  "activeAgreementPdfUrl": coalesce(currentAgreement.pdf.asset->url, agreement.pdf.asset->url)
}`

/** Emails the renter once their application is approved, attaching the
 * signed rental agreement PDF when one is on file. Called from both places
 * that can record an "approved" decision (the admin/owner status menu and
 * the mailed one-click owner-approval link) so the two paths can't drift
 * apart. Idempotent via confirmationEmailSentAt, and never throws — a
 * failed send shouldn't block the approval itself, so callers can just
 * fire-and-await this without their own try/catch. */
export async function notifyRenterApproved(applicationId: string) {
  try {
    const application = await sanityFetch<ApplicationForConfirmation>(applicationQuery, {
      id: applicationId,
    })

    if (!application || application.confirmationEmailSentAt) {
      return { ok: true as const, skipped: true }
    }

    if (!application.renterEmail) {
      return { ok: true as const, skipped: true }
    }

    let attachments: Array<{ filename: string; content: Buffer }> | undefined

    if (application.activeAgreementPdfUrl) {
      const pdfResponse = await fetch(application.activeAgreementPdfUrl)
      if (pdfResponse.ok) {
        attachments = [
          { filename: "rental-agreement.pdf", content: Buffer.from(await pdfResponse.arrayBuffer()) },
        ]
      } else {
        console.error("Couldn't retrieve the agreement PDF for the confirmation email", pdfResponse.status)
      }
    }

    const email = bookingConfirmationEmail({
      renterName: application.renterName,
      renterPhone: application.renterPhone,
      renterEmail: application.renterEmail,
      renterAddress: application.renterAddress,
      vehicleLabel: application.vehicleLabel,
      startDate: application.startDate,
      startTime: application.startTime,
      endDate: application.endDate,
      endTime: application.endTime,
      rentalPurpose: application.rentalPurpose,
      paymentDueDay: application.paymentDueDay,
      mileageAllowance: application.mileageAllowance,
      insurance: application.insurance,
      additionalDrivers: application.additionalDrivers,
      agreementAttached: Boolean(attachments),
    })

    await sendEmail({
      to: application.renterEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: RENTER_REPLY_TO_EMAIL,
      attachments,
    })

    const now = new Date().toISOString()
    const patch: Record<string, unknown> = { confirmationEmailSentAt: now }

    const mutations: Array<Record<string, unknown>> = [{ patch: { id: applicationId, set: patch } }]

    if (attachments) {
      mutations.push({
        patch: {
          id: applicationId,
          setIfMissing: { agreementEmailHistory: [] },
          insert: {
            after: "agreementEmailHistory[-1]",
            items: [
              {
                _key: crypto.randomUUID(),
                sentAt: now,
                sentBy: "Drive Boundless (auto-sent on approval)",
                sentTo: application.renterEmail,
              },
            ],
          },
        },
      })
    }

    await sanityMutate(mutations)

    return { ok: true as const, skipped: false }
  } catch (error) {
    console.error("Failed to send renter booking-confirmation email", error)
    return { ok: false as const, error }
  }
}
