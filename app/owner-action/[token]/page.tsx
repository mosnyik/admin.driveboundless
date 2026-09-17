import type { Metadata } from "next"
import Image from "next/image"
import { format } from "date-fns"
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { needsInsuranceProof } from "@/lib/application-types"
import {
  getByOwnerApprovalToken,
  isOwnerApprovalTokenExpired,
  isOwnerApprovalTokenSettled,
} from "@/lib/owner-approval"
import { submitOwnerDecision } from "@/lib/actions/owner-approval"
import { STATUS_CONFIG } from "@/components/admin/status-badge"

export const metadata: Metadata = {
  title: "Rental request",
}

function formatDate(value: string | null, pattern = "MMMM d, yyyy") {
  if (!value) return "—"
  try {
    return format(new Date(value), pattern)
  } catch {
    return value
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/images/logo.png"
            alt="Drive Boundless"
            width={72}
            height={66}
            priority
            className="h-[66px] w-[72px]"
          />
          <span className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Drive Boundless
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

function StatusCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        {icon}
        <h1 className="font-serif text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default async function OwnerActionPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const record = await getByOwnerApprovalToken(token)

  if (!record) {
    return (
      <Shell>
        <StatusCard
          icon={<XCircle className="size-10 text-muted-foreground" />}
          title="This link isn't valid"
          description="It may have been superseded by a newer alert, or the address was copied incorrectly. Contact Drive Boundless if you think this is a mistake."
        />
      </Shell>
    )
  }

  if (isOwnerApprovalTokenExpired(record) && !isOwnerApprovalTokenSettled(record)) {
    return (
      <Shell>
        <StatusCard
          icon={<Clock className="size-10 text-muted-foreground" />}
          title="This link has expired"
          description="Sign in to the dashboard to respond, or contact Drive Boundless to have the alert resent."
        />
      </Shell>
    )
  }

  if (isOwnerApprovalTokenSettled(record)) {
    const decided = record.usedVia ?? record.status
    const isApproved = decided === "approved"

    return (
      <Shell>
        <StatusCard
          icon={
            isApproved ? (
              <CheckCircle2 className="size-10 text-success" />
            ) : (
              <XCircle className="size-10 text-destructive" />
            )
          }
          title={`Booking ${STATUS_CONFIG[decided].label.toLowerCase()}`}
          description={
            record.usedAt
              ? `Recorded on ${formatDate(record.usedAt, "MMMM d, yyyy 'at' h:mm a")}. No further action is needed.`
              : "This decision has already been recorded. No further action is needed."
          }
        />
      </Shell>
    )
  }

  const dateRange =
    record.startDate && record.endDate
      ? `${formatDate(record.startDate)} – ${formatDate(record.endDate)}`
      : "Not specified"
  const insurancePending = needsInsuranceProof(record.insurance)

  return (
    <Shell>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Rental request</CardTitle>
          <p className="text-sm text-muted-foreground">
            {record.companyName ? `Booking a vehicle owned by ${record.companyName}` : "Booking request"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Renter</dt>
              <dd className="font-medium text-foreground">{record.renterName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Vehicle</dt>
              <dd className="font-medium text-foreground">{record.vehicleLabel || "Not selected"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Dates</dt>
              <dd className="font-medium text-foreground">{dateRange}</dd>
            </div>
          </dl>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <form action={submitOwnerDecision.bind(null, token, "declined")}>
              <Button type="submit" variant="outline" className="w-full text-destructive hover:text-destructive">
                Decline
              </Button>
            </form>
            {insurancePending ? (
              <Button type="button" disabled className="w-full">
                Approve
              </Button>
            ) : (
              <form action={submitOwnerDecision.bind(null, token, "approved")}>
                <Button type="submit" className="w-full bg-success text-success-foreground hover:bg-success/90">
                  Approve
                </Button>
              </form>
            )}
          </div>

          {insurancePending && (
            <p className="text-center text-xs text-muted-foreground">
              This booking can&apos;t be approved yet — Drive Boundless is still waiting on the renter&apos;s
              insurance verification.
            </p>
          )}

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Single-use link — no login required
          </p>
        </CardContent>
      </Card>
    </Shell>
  )
}
