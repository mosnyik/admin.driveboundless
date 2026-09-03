import "server-only"

import { Resend } from "resend"

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev"
const DEFAULT_FROM_NAME = "Drive Boundless"

let client: Resend | null = null

function getClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.")
  }

  if (!client) {
    client = new Resend(apiKey)
  }

  return client
}

interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  text: string
  /** Display name shown before the address, e.g. "New Rental Alert". Defaults to "Drive Boundless". */
  fromName?: string
  attachments?: Array<{ filename: string; content: Buffer }>
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
  fromName = DEFAULT_FROM_NAME,
}: SendEmailInput) {
  const resend = getClient()

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${FROM_ADDRESS}>`,
    to,
    subject,
    html,
    text,
    attachments,
  })

  if (error) {
    throw new Error(error.message || "Failed to send email.")
  }

  return data
}
