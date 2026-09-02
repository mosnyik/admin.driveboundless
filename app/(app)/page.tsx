import Link from "next/link"
import { getSession } from "@/lib/auth"
import { sanityFetch } from "@/lib/sanity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Car, CircleCheck, CircleAlert } from "lucide-react"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

async function getCounts() {
  try {
    const [applications, needsAttention, vehicles] = await Promise.all([
      sanityFetch<number>(`count(*[_type == "rentalApplication"])`),
      sanityFetch<number>(`count(*[_type == "rentalApplication" && status == "new"])`),
      sanityFetch<number>(`count(*[_type == "vehicle"])`),
    ])

    return { applications, needsAttention, vehicles, connected: true as const }
  } catch {
    return { applications: null, needsAttention: null, vehicles: null, connected: false as const }
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  const { applications, needsAttention, vehicles, connected } = await getCounts()

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          {getGreeting()}
          {session?.email ? `, ${session.email.split("@")[0]}` : ""}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Here&apos;s the current state of your Drive Boundless data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/applications">
          <Card className="transition-colors hover:border-accent/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rental applications
              </CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-serif text-3xl font-semibold text-foreground">
                {applications ?? "—"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {needsAttention ? `${needsAttention} need attention` : "Total on record"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fleet</CardTitle>
            <Car className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-semibold text-foreground">
              {vehicles ?? "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Vehicles in the catalog</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardContent className="flex items-center gap-3 py-4">
          {connected ? (
            <>
              <CircleCheck className="size-4 text-success" />
              <p className="text-sm text-foreground">
                Connected to the Drive Boundless Sanity dataset.
              </p>
            </>
          ) : (
            <>
              <CircleAlert className="size-4 text-destructive" />
              <p className="text-sm text-foreground">
                Could not reach the Sanity dataset. Check your environment variables.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
