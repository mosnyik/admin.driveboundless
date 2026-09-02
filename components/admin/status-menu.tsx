"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Check, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge, STATUS_CONFIG } from "@/components/admin/status-badge"
import { updateApplicationStatus } from "@/lib/actions/application-status"
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/application-types"
import { cn } from "@/lib/utils"

export function StatusMenu({
  applicationId,
  status,
  className,
}: {
  applicationId: string
  status: ApplicationStatus
  className?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleSelect(next: ApplicationStatus) {
    if (next === status || pending) return

    startTransition(async () => {
      try {
        await updateApplicationStatus(applicationId, next)
        toast.success(`Marked as ${STATUS_CONFIG[next].label}`)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't update status.")
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        onClick={(event) => event.stopPropagation()}
        className={cn("inline-flex items-center gap-1 disabled:opacity-60", className)}
      >
        <StatusBadge status={status} className="cursor-pointer" />
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(event) => event.stopPropagation()}>
        {APPLICATION_STATUSES.map((value) => (
          <DropdownMenuItem key={value} onSelect={() => handleSelect(value)}>
            {value === status ? <Check className="size-4" /> : <span className="size-4" />}
            {STATUS_CONFIG[value].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
