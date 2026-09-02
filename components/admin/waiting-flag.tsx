import { formatDistanceToNowStrict } from "date-fns"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getWaitingHours,
  isTerminalStatus,
  WAITING_THRESHOLD_HOURS,
  type ApplicationStatus,
} from "@/lib/application-types"

export function WaitingFlag({
  status,
  since,
  className,
}: {
  status: ApplicationStatus
  since: string | null
  className?: string
}) {
  if (isTerminalStatus(status)) return null

  const hours = getWaitingHours(since)
  if (hours === null || hours < WAITING_THRESHOLD_HOURS) return null

  const label = formatDistanceToNowStrict(new Date(since as string))

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400",
        className,
      )}
    >
      <AlertCircle className="size-3" />
      Waiting {label}
    </span>
  )
}
