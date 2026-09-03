import "server-only"

import { sanityFetch } from "@/lib/sanity"
import type { ApplicationStatus } from "@/lib/application-types"

export interface VehicleStat {
  label: string
  count: number
}

export interface DashboardAnalytics {
  totalApplications: number
  statusCounts: Record<ApplicationStatus, number>
  topPerformingVehicles: VehicleStat[]
  mostChangedVehicles: VehicleStat[]
}

interface RawApplication {
  status: ApplicationStatus
  vehicleLabel: string | null
  changedFrom: Array<string | null> | null
}

const analyticsQuery = `*[_type == "rentalApplication"]{
  status,
  "vehicleLabel": selectedVehicle.label,
  "changedFrom": vehicleChangeHistory[].previousVehicleLabel
}`

function normalizeLabel(label: string | null | undefined) {
  if (!label) return null
  const trimmed = label.replace(/\s+/g, " ").trim()
  return trimmed || null
}

function topRanked(counts: Map<string, number>, limit = 5): VehicleStat[] {
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const applications = (await sanityFetch<RawApplication[]>(analyticsQuery)) ?? []

  const statusCounts: Record<ApplicationStatus, number> = {
    new: 0,
    contacted: 0,
    approved: 0,
    declined: 0,
  }
  const performanceCounts = new Map<string, number>()
  const changeCounts = new Map<string, number>()

  for (const application of applications) {
    if (application.status in statusCounts) {
      statusCounts[application.status] += 1
    }

    if (application.status === "approved") {
      const label = normalizeLabel(application.vehicleLabel)
      if (label) {
        performanceCounts.set(label, (performanceCounts.get(label) ?? 0) + 1)
      }
    }

    for (const previous of application.changedFrom ?? []) {
      const label = normalizeLabel(previous)
      if (label) {
        changeCounts.set(label, (changeCounts.get(label) ?? 0) + 1)
      }
    }
  }

  return {
    totalApplications: applications.length,
    statusCounts,
    topPerformingVehicles: topRanked(performanceCounts),
    mostChangedVehicles: topRanked(changeCounts),
  }
}
