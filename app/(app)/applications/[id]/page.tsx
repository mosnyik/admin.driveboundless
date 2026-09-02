import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format, formatDistanceToNowStrict } from "date-fns"
import { ArrowLeft, ArrowRight, Download, FileCheck2, FileX2 } from "lucide-react"
import { getApplicationById } from "@/lib/applications"
import { getVehicleOptions } from "@/lib/vehicles"
import { STATUS_CONFIG } from "@/components/admin/status-badge"
import { StatusMenu } from "@/components/admin/status-menu"
import { WaitingFlag } from "@/components/admin/waiting-flag"
import { VehicleChangeDialog } from "@/components/admin/vehicle-change-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Application detail",
}

function formatDate(value: string | null | undefined, pattern = "MMMM d, yyyy") {
  if (!value) return "—"
  try {
    return format(new Date(value), pattern)
  } catch {
    return value
  }
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value || "—"}</p>
    </div>
  )
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [application, vehicles] = await Promise.all([getApplicationById(id), getVehicleOptions()])

  if (!application) {
    notFound()
  }

  const { renter, license, insurance, rental, selectedVehicle, additionalDrivers, agreement } = application

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to applications
      </Link>

      <div className="mt-4 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            {renter.fullName || "Untitled applicant"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Submitted {formatDate(application.submittedAt, "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusMenu applicationId={application.id} status={application.status} />
          <WaitingFlag status={application.status} since={application.statusUpdatedAt} />
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {application.statusHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No status changes yet — this application is still {STATUS_CONFIG[application.status].label}.
              </p>
            ) : (
              <ul className="space-y-3">
                {application.statusHistory.map((entry, index) => (
                  <li key={index} className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-foreground">
                      {entry.from ? (
                        <>
                          <span className="text-muted-foreground">{STATUS_CONFIG[entry.from].label}</span>
                          <ArrowRight className="size-3.5 text-muted-foreground" />
                        </>
                      ) : null}
                      <span className="font-medium">{STATUS_CONFIG[entry.to].label}</span>
                      <span className="text-muted-foreground">by {entry.changedBy}</span>
                    </span>
                    <span
                      className="shrink-0 text-xs text-muted-foreground"
                      title={formatDate(entry.changedAt, "MMMM d, yyyy 'at' h:mm a")}
                      suppressHydrationWarning
                    >
                      {formatDistanceToNowStrict(new Date(entry.changedAt), { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Renter</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={renter.fullName} />
            <Field label="Email" value={renter.email} />
            <Field label="Phone" value={renter.phone} />
            <Field
              label="Address"
              value={
                [renter.address?.street, renter.address?.city, renter.address?.state, renter.address?.zip]
                  .filter(Boolean)
                  .join(", ") || null
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Driver&apos;s license</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="License number" value={license.number} />
            <Field label="Issuing state" value={license.state} />
            <Field label="Expiration" value={formatDate(license.expiry)} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Uploaded copy</p>
              {license.fileUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1.5 h-auto w-full justify-start px-4 py-2.5 text-left whitespace-normal sm:w-auto"
                  asChild
                >
                  <a href={license.fileUrl} target="_blank" rel="noreferrer">
                    <Download className="size-4 shrink-0" />
                    {license.fileName || "Download license"}
                  </a>
                </Button>
              ) : (
                <p className="mt-0.5 text-sm text-foreground">Not provided</p>
              )}
            </div>
            {(insurance?.carrier || insurance?.policyNumber) && (
              <>
                <Field label="Insurance carrier" value={insurance.carrier} />
                <Field label="Policy number" value={insurance.policyNumber} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Rental details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Purpose" value={rental.purpose} />
            <Field
              label="Pick-up"
              value={rental.startDate ? `${formatDate(rental.startDate, "MMM d, yyyy")} at ${rental.startTime}` : null}
            />
            <Field
              label="Return"
              value={rental.endDate ? `${formatDate(rental.endDate, "MMM d, yyyy")} at ${rental.endTime}` : null}
            />
            <Field label="Time zone" value={rental.visitorTimeZone} />
            <Field label="Rate selected" value={rental.rentalRate === "week" ? "Weekly" : "Daily"} />
            <Field label="Payment due day" value={rental.paymentDueDay} />
            <Field label="Mileage allowance" value={rental.mileageAllowance} />
            {rental.additionalNotes && (
              <div className="sm:col-span-2">
                <Field label="Additional notes" value={rental.additionalNotes} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="font-serif text-lg">Selected vehicle</CardTitle>
              <VehicleChangeDialog
                applicationId={application.id}
                currentVehicleLabel={selectedVehicle?.label ?? null}
                vehicles={vehicles}
              />
            </div>
          </CardHeader>
          <CardContent>
            {selectedVehicle ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Vehicle" value={selectedVehicle.label} />
                <Field label="Color" value={selectedVehicle.color} />
                <Field
                  label="Rate at time of booking"
                  value={
                    selectedVehicle.selectedRatePrice
                      ? `$${selectedVehicle.selectedRatePrice.toLocaleString()} / ${selectedVehicle.selectedRate}`
                      : null
                  }
                />
                <Field
                  label="Standard pricing"
                  value={`$${selectedVehicle.pricePerDay?.toLocaleString() ?? "—"}/day · $${selectedVehicle.pricePerWeek?.toLocaleString() ?? "—"}/week`}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No vehicle on record for this application.</p>
            )}
          </CardContent>
        </Card>

        {application.vehicleChangeHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Vehicle history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.vehicleChangeHistory.map((entry, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex flex-wrap items-center gap-1.5 text-sm text-foreground">
                        {entry.previousVehicleLabel ? (
                          <>
                            <span className="text-muted-foreground">{entry.previousVehicleLabel}</span>
                            <ArrowRight className="size-3.5 text-muted-foreground" />
                          </>
                        ) : null}
                        <span className="font-medium">{entry.newVehicleLabel}</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{entry.reason}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        by {entry.changedBy} ·{" "}
                        <span
                          title={formatDate(entry.changedAt, "MMMM d, yyyy 'at' h:mm a")}
                          suppressHydrationWarning
                        >
                          {formatDistanceToNowStrict(new Date(entry.changedAt), { addSuffix: true })}
                        </span>
                      </p>
                    </div>
                    {entry.previousAgreementPdfUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto w-full justify-start px-4 py-2.5 text-left whitespace-normal sm:w-auto sm:shrink-0"
                        asChild
                      >
                        <a href={entry.previousAgreementPdfUrl} target="_blank" rel="noreferrer">
                          <Download className="size-4 shrink-0" />
                          Previous agreement
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {additionalDrivers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Additional drivers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {additionalDrivers.map((driver, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Name" value={driver.name} />
                    <Field label="License number" value={driver.licenseNumber} />
                    <Field label="License state" value={driver.licenseState} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Signed agreement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              {agreement.accepted ? (
                <>
                  <FileCheck2 className="size-4 text-success" />
                  <span className="text-foreground">
                    Accepted {formatDate(agreement.acceptedAt, "MMMM d, yyyy 'at' h:mm a")}
                  </span>
                </>
              ) : (
                <>
                  <FileX2 className="size-4 text-destructive" />
                  <span className="text-foreground">Not accepted</span>
                </>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Renter signature" value={agreement.renterSignature} />
              <Field label="Owner signature" value={agreement.ownerSignature} />
            </div>
            {agreement.pdfUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-auto w-full justify-start px-4 py-2.5 text-left whitespace-normal sm:w-auto"
                asChild
              >
                <a href={agreement.pdfUrl} target="_blank" rel="noreferrer">
                  <Download className="size-4 shrink-0" />
                  Download signed agreement (PDF)
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
