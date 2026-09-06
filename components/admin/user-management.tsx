"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { KeyRound, Plus, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { createUser, resetUserPassword, setUserActive, setUserCompany } from "@/lib/actions/users"
import type { AppUser, AppUserRole } from "@/lib/user-types"
import type { Company } from "@/lib/company-types"

function AddUserDialog({ companies }: { companies: Company[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<AppUserRole>("admin")
  const [companyId, setCompanyId] = useState("")
  const [initialPassword, setInitialPassword] = useState("")
  const [pending, startTransition] = useTransition()

  const canSubmit =
    email.trim().length > 0 &&
    initialPassword.length >= 8 &&
    (role !== "owner" || companyId.length > 0) &&
    !pending

  function handleSubmit() {
    if (!canSubmit) return

    startTransition(async () => {
      try {
        await createUser({ email, role, initialPassword, companyId: role === "owner" ? companyId : null })
        toast.success(`Account created for ${email}`)
        setOpen(false)
        setEmail("")
        setRole("admin")
        setCompanyId("")
        setInitialPassword("")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't create the account.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add person
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a person</DialogTitle>
          <DialogDescription>
            They&apos;ll sign in with this email and password, and are asked to set their own
            password on first login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-user-email">Email</Label>
            <Input
              id="new-user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-user-role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppUserRole)}>
              <SelectTrigger id="new-user-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "owner" && (
            <div className="space-y-2">
              <Label htmlFor="new-user-company">Company</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger id="new-user-company" className="w-full">
                  <SelectValue placeholder="Select the company they own" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-user-password">Initial password</Label>
            <Input
              id="new-user-password"
              type="text"
              value={initialPassword}
              onChange={(event) => setInitialPassword(event.target.value)}
              placeholder="Share this with them directly"
              disabled={pending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {pending ? (
              <>
                <Spinner />
                Creating…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({ userId, email }: { userId: string; email: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [pending, startTransition] = useTransition()

  const canSubmit = newPassword.length >= 8 && !pending

  function handleSubmit() {
    if (!canSubmit) return

    startTransition(async () => {
      try {
        await resetUserPassword(userId, newPassword)
        toast.success(`Password reset for ${email}`)
        setOpen(false)
        setNewPassword("")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't reset the password.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="size-4" />
          Reset password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {email}</DialogTitle>
          <DialogDescription>
            They&apos;ll be asked to set their own password the next time they sign in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            type="text"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Share this with them directly"
            disabled={pending}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {pending ? (
              <>
                <Spinner />
                Resetting…
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CompanyReassign({ userId, companyId, companies }: { userId: string; companyId: string | null; companies: Company[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleChange(value: string) {
    startTransition(async () => {
      try {
        await setUserCompany(userId, value)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't reassign this owner.")
      }
    })
  }

  return (
    <Select value={companyId ?? ""} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-auto">
        <SelectValue placeholder="No company" />
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function UserRow({ user, isSelf, companies }: { user: AppUser; isSelf: boolean; companies: Company[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleActiveChange(active: boolean) {
    startTransition(async () => {
      try {
        await setUserActive(user.id, active)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't update this account.")
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {user.email}
          {isSelf && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <Badge variant="outline" className="gap-1 text-xs capitalize">
            {user.role === "admin" && <ShieldCheck className="size-3" />}
            {user.role}
          </Badge>
          {user.mustChangePassword && (
            <Badge variant="secondary" className="text-xs">
              Password not yet set
            </Badge>
          )}
        </div>
      </div>

      {user.role === "owner" && (
        <CompanyReassign userId={user.id} companyId={user.companyId} companies={companies} />
      )}

      <ResetPasswordDialog userId={user.id} email={user.email} />

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Active</span>
        <Switch
          checked={user.active}
          onCheckedChange={handleActiveChange}
          disabled={pending || isSelf}
        />
      </div>
    </div>
  )
}

export function UserManagement({
  users,
  currentUserId,
  companies,
}: {
  users: AppUser[]
  currentUserId: string
  companies: Company[]
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} account(s)</p>
        <AddUserDialog companies={companies} />
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} companies={companies} />
        ))}
      </div>
    </div>
  )
}
