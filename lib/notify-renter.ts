import "server-only"

import { sanityFetch, sanityMutate } from "@/lib/sanity"
import { sendEmail, RENTER_REPLY_TO_EMAIL } from "@/lib/email"
import { bookingConfirmationEmail } from "@/lib/email-templates"

interface ApplicationForConfirmation {
  renterName: string
  renterEmail: string
  vehicleLabel: string | null
  startDate: string | null
  endDate: string | null
  confirmationEmailSentAt: string | null
}

const applicationQuery = `*[_id == $id][0]{
  "renterName": renter.fullName,
  "renterEmail": renter.email,
  "vehicleLabel": selectedVehicle.label,
  "startDate": rental.startDate,
  "endDate": rental.endDate,
  confirmationEmailSentAt
}`

/** Emails the renter once their application is approved. Called from both
 * places that can record an "approved" decision (the admin/owner status
 * menu and the mailed one-click owner-approval link) so the two paths can't
 * drift apart. Idempotent via confirmationEmailSentAt, and never throws —
 * a failed send shouldn't block the approval itself, so callers can just
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

    const email = bookingConfirmationEmail({
      renterName: application.renterName,
      vehicleLabel: application.vehicleLabel,
      startDate: application.startDate,
      endDate: application.endDate,
    })

    await sendEmail({
      to: application.renterEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: RENTER_REPLY_TO_EMAIL,
    })

    await sanityMutate([
      {
        patch: {
          id: applicationId,
          set: { confirmationEmailSentAt: new Date().toISOString() },
        },
      },
    ])

    return { ok: true as const, skipped: false }
  } catch (error) {
    console.error("Failed to send renter booking-confirmation email", error)
    return { ok: false as const, error }
  }
}
