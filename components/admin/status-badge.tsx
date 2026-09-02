import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ApplicationStatus } from "@/lib/application-types"

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  new: {
    label: "New",
    className: "border-warning/30 bg-warning/15 text-warning-foreground dark:text-warning",
  },
  contacted: {
    label: "Contacted",
    className: "border-accent/30 bg-accent/10 text-accent",
  },
  approved: {
    label: "Approved",
    className: "border-success/30 bg-success/15 text-success",
  },
  declined: {
    label: "Declined",
    className: "border-destructive/30 bg-destructive/10 text-destructive dark:text-destructive-foreground",
  },
}

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
