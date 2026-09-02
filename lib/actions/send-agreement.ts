"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { sanityFetch, sanityMutate } from "@/lib/sanity"
import { sendEmail } from "@/lib/email"
import { agreementEmail } from "@/lib/email-templates"

interface ApplicationForEmail {
  renter: { fullName: string; email: string } | null
  selectedVehicle: { label: string } | null
  agreement: { pdfUrl: string | null } | null
}

const applicationQuery = `*[_id == $id][0]{
  renter,
  "selectedVehicle": selectedVehicle{label},
  "agreement": {"pdfUrl": agreement.pdf.asset->url}
}`

export async function sendAgreementToCustomer(applicationId: string) {
  const session = await getSession()

  if (!session) {
    throw new Error("You must be signed in to do that.")
  }

  const application = await sanityFetch<ApplicationForEmail>(applicationQuery, { id: applicationId })

  if (!application) {
    throw new Error("Application not found.")
  }

  const recipientEmail = application.renter?.email

  if (!recipientEmail) {
    throw new Error("This application doesn't have an email address on file.")
  }

  const pdfUrl = application.agreement?.pdfUrl

  if (!pdfUrl) {
    throw new Error("There's no agreement on file to send yet.")
  }

  const pdfResponse = await fetch(pdfUrl)

  if (!pdfResponse.ok) {
    throw new Error("Couldn't retrieve the agreement PDF.")
  }

  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())

  const email = agreementEmail({
    renterName: application.renter?.fullName ?? "",
    vehicleLabel: application.selectedVehicle?.label ?? null,
  })

  await sendEmail({
    to: recipientEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: [{ filename: "rental-agreement.pdf", content: pdfBuffer }],
  })

  const now = new Date().toISOString()

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

  return { ok: true as const, sentTo: recipientEmail }
}
