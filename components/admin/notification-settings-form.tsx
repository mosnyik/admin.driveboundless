"use client"

import { useState, useTransition, type KeyboardEvent } from "react"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { updateAlertRecipients } from "@/lib/actions/settings"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function NotificationSettingsForm({ initialRecipients }: { initialRecipients: string[] }) {
  const [recipients, setRecipients] = useState(initialRecipients)
  const [draft, setDraft] = useState("")
  const [pending, startTransition] = useTransition()
  const dirty = JSON.stringify(recipients) !== JSON.stringify(initialRecipients)

  function addDraft() {
    const email = draft.trim().toLowerCase()
    if (!email) return

    if (!EMAIL_PATTERN.test(email)) {
      toast.error(`"${email}" doesn't look like a valid email address.`)
      return
    }

    if (recipients.includes(email)) {
      setDraft("")
      return
    }

    setRecipients((current) => [...current, email])
    setDraft("")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addDraft()
    }
  }

  function removeRecipient(email: string) {
    setRecipients((current) => current.filter((value) => value !== email))
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const result = await updateAlertRecipients(recipients)
        setRecipients(result.alertRecipients)
        toast.success("Alert recipients updated")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't save recipients.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-input p-2">
        {recipients.length === 0 && (
          <span className="px-1 text-sm text-muted-foreground/70">No recipients yet</span>
        )}
        {recipients.map((email) => (
          <Badge key={email} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5 text-sm">
            {email}
            <button
              type="button"
              onClick={() => removeRecipient(email)}
              className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground"
              aria-label={`Remove ${email}`}
            >
              <X className="size-3.5" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="name@example.com"
          type="email"
        />
        <Button type="button" variant="outline" onClick={addDraft} disabled={!draft.trim()}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <Button onClick={handleSave} disabled={!dirty || pending}>
        {pending ? (
          <>
            <Spinner />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </div>
  )
}
