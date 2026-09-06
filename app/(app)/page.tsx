import Link from "next/link"
import { getCallerScope, getSession } from "@/lib/auth"
import { getDashboardAnalytics } from "@/lib/analytics"
import { getAdminVehicles } from "@/lib/vehicles"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle2,
  MessagesSquare,
  Trophy,
  XCircle,
} from "lucide-react"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function StatusTile({
  icon: Icon,
  label,
  value,
  colorClassName,
}: {
  icon: typeof AlertCircle
  label: string
  value: number
  colorClassName: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <Icon className={`size-5 shrink-0 ${colorClassName}`} />
        <div>
          <p className={`font-serif text-2xl font-semibold ${colorClassName}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/** Ranked bar-list: label + value on top, a proportional bar underneath — sized
 * relative to the top item, so relative magnitude reads at a glance. */
function VehicleBarList({
  items,
  emptyMessage,
  countLabel,
  barColorClassName,
}: {
  items: { label: string; count: number }[]
  emptyMessage: string
  countLabel: (count: number) => string
  barColorClassName: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  const max = Math.max(...items.map((item) => item.count))

  return (
    <ul className="space-y-4">
      {items.map((item, index) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{item.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {countLabel(item.count)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${barColorClassName}`}
              style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default async function DashboardPage() {
  const [session, scope] = await Promise.all([getSession(), getCallerScope()])
  // A sentinel, never-matching id when an owner has no company yet, so a
  // misconfigured account sees nothing rather than accidentally everything.
  const companyId = scope?.role === "owner" ? scope.companyId ?? "no-company-assigned" : undefined
  const [analytics, vehicles] = await Promise.all([
    getDashboardAnalytics(companyId),
    getAdminVehicles(companyId),
  ])
  const { statusCounts, totalApplications, topPerformingVehicles, mostChangedVehicles } = analytics

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          {getGreeting()}
          {session?.email ? `, ${session.email.split("@")[0]}` : ""}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {totalApplications} application{totalApplications === 1 ? "" : "s"} on record ·{" "}
          {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} in the fleet
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Applications</h2>
        <Link href="/applications" className="text-sm text-accent transition-colors hover:underline">
          View all
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusTile
          icon={AlertCircle}
          label="Needs attention"
          value={statusCounts.new}
          colorClassName="text-amber-700 dark:text-amber-400"
        />
        <StatusTile
          icon={MessagesSquare}
          label="In progress"
          value={statusCounts.contacted}
          colorClassName="text-accent"
        />
        <StatusTile
          icon={CheckCircle2}
          label="Approved"
          value={statusCounts.approved}
          colorClassName="text-success"
        />
        <StatusTile
          icon={XCircle}
          label="Declined"
          value={statusCounts.declined}
          colorClassName="text-destructive dark:text-destructive-foreground"
        />
      </div>

      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Trophy className="size-4 text-muted-foreground" />
              Best performing vehicles
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <VehicleBarList
              items={topPerformingVehicles}
              emptyMessage="No approved rentals yet."
              countLabel={(count) => `${count} approved`}
              barColorClassName="bg-accent"
            />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <ArrowLeftRight className="size-4 text-muted-foreground" />
              Most frequently changed
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <VehicleBarList
              items={mostChangedVehicles}
              emptyMessage="No vehicle changes recorded yet."
              countLabel={(count) => `${count} time${count === 1 ? "" : "s"} swapped out`}
              barColorClassName="bg-amber-500"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
