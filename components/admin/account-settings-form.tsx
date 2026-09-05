"use client"

import { useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { changeOwnPassword } from "@/lib/actions/users"

export function AccountSettingsForm({ mustChangePassword }: { mustChangePassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation don't match.")
      return
    }

    startTransition(async () => {
      try {
        await changeOwnPassword(currentPassword, newPassword)
        toast.success("Password updated")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't update your password.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mustChangePassword && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          Your password was set by an administrator. Please choose a new one.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={pending}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Spinner />
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  )
}
