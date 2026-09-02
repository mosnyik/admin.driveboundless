"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNowStrict } from "date-fns"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusMenu } from "@/components/admin/status-menu"
import { WaitingFlag } from "@/components/admin/waiting-flag"
import { bucketForStatus, type ApplicationBucket, type ApplicationListItem } from "@/lib/application-types"

const BUCKETS: { value: ApplicationBucket; label: string }[] = [
  { value: "needs-attention", label: "Needs attention" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
]

function matchesSearch(application: ApplicationListItem, query: string) {
  if (!query) return true
  const haystack = [
    application.renterName,
    application.renterEmail,
    application.renterPhone,
    application.vehicleLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(query.toLowerCase())
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start || !end) return "—"
  try {
    return `${format(new Date(start), "MMM d")} – ${format(new Date(end), "MMM d, yyyy")}`
  } catch {
    return "—"
  }
}

function formatSubmitted(submittedAt: string | null) {
  if (!submittedAt) return "—"
  try {
    return formatDistanceToNowStrict(new Date(submittedAt), { addSuffix: true })
  } catch {
    return "—"
  }
}

export function ApplicationsView({ applications }: { applications: ApplicationListItem[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<ApplicationBucket>("needs-attention")

  const counts = useMemo(() => {
    const result: Record<ApplicationBucket, number> = {
      "needs-attention": 0,
      "in-progress": 0,
      completed: 0,
    }
    for (const application of applications) {
      result[bucketForStatus(application.status)] += 1
    }
    return result
  }, [applications])

  const filtered = useMemo(() => {
    return applications
      .filter((application) => bucketForStatus(application.status) === tab)
      .filter((application) => matchesSearch(application, search))
  }, [applications, tab, search])

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as ApplicationBucket)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <TabsList className="grid h-auto w-full grid-cols-3 lg:inline-flex lg:h-9 lg:w-fit">
          {BUCKETS.map((bucket) => (
            <TabsTrigger
              key={bucket.value}
              value={bucket.value}
              className="h-auto flex-col gap-0.5 px-1.5 py-1.5 text-center text-xs leading-tight whitespace-normal lg:h-[calc(100%-1px)] lg:flex-row lg:gap-1.5 lg:px-2 lg:py-1 lg:text-sm lg:whitespace-nowrap"
            >
              <span>{bucket.label}</span>
              <span className="text-[11px] text-muted-foreground lg:text-xs">{counts[bucket.value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone…"
            className="pl-9"
          />
        </div>
      </div>

      {BUCKETS.map((bucket) => (
        <TabsContent key={bucket.value} value={bucket.value} className="mt-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                {search ? "No applications match your search" : "Nothing here"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search ? "Try a different name, email, or phone number." : "New submissions will show up here."}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile & tablet: stacked cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                {filtered.map((application) => (
                  <div
                    key={application.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/applications/${application.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        router.push(`/applications/${application.id}`)
                      }
                    }}
                    className="w-full cursor-pointer rounded-lg border bg-card p-4 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate font-medium text-foreground">
                        {application.renterName || "Untitled applicant"}
                      </p>
                      <StatusMenu
                        applicationId={application.id}
                        status={application.status}
                        className="shrink-0"
                      />
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {application.renterEmail || application.renterPhone || "—"}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="truncate">{application.vehicleLabel || "—"}</span>
                      <span className="shrink-0" suppressHydrationWarning>
                        {formatSubmitted(application.submittedAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateRange(application.startDate, application.endDate)}
                    </p>
                    <WaitingFlag
                      status={application.status}
                      since={application.statusUpdatedAt}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden overflow-hidden rounded-lg border lg:block">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[16%]">Renter</TableHead>
                      <TableHead className="w-[22%]">Contact</TableHead>
                      <TableHead className="w-[16%]">Vehicle</TableHead>
                      <TableHead className="w-[14%]">Rental dates</TableHead>
                      <TableHead className="w-[17%]">Status</TableHead>
                      <TableHead className="w-[15%] text-right">Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((application) => (
                      <TableRow
                        key={application.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/applications/${application.id}`)}
                      >
                        <TableCell
                          className="truncate font-medium text-foreground"
                          title={application.renterName || undefined}
                        >
                          {application.renterName || "Untitled applicant"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="truncate" title={application.renterEmail || undefined}>
                            {application.renterEmail || "—"}
                          </div>
                          <div className="truncate text-xs">{application.renterPhone}</div>
                        </TableCell>
                        <TableCell
                          className="truncate text-muted-foreground"
                          title={application.vehicleLabel || undefined}
                        >
                          {application.vehicleLabel || "—"}
                        </TableCell>
                        <TableCell className="truncate text-muted-foreground">
                          {formatDateRange(application.startDate, application.endDate)}
                        </TableCell>
                        <TableCell>
                          <StatusMenu applicationId={application.id} status={application.status} />
                          <WaitingFlag
                            status={application.status}
                            since={application.statusUpdatedAt}
                            className="mt-1"
                          />
                        </TableCell>
                        <TableCell
                          className="truncate text-right text-muted-foreground"
                          suppressHydrationWarning
                        >
                          {formatSubmitted(application.submittedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
