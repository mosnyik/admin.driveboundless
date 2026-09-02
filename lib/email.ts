import "server-only"

import { Resend } from "resend"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Drive Boundless <onboarding@resend.dev>"

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
  attachments?: Array<{ filename: string; content: Buffer }>
}

export async function sendEmail({ to, subject, html, text, attachments }: SendEmailInput) {
  const resend = getClient()

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
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
