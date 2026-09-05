import "server-only"

import { sanityFetch } from "@/lib/sanity"
import type { Company } from "@/lib/company-types"

export * from "@/lib/company-types"

const companyFields = `
  "id": _id,
  name,
  "dbaName": coalesce(dbaName, ""),
  address,
  phone,
  email,
  "notificationEmail": coalesce(notificationEmail, email),
  "active": coalesce(active, true),
  createdAt,
  updatedAt
`

export async function getCompanies(): Promise<Company[]> {
  const results = await sanityFetch<Company[]>(
    `*[_type == "company"] | order(name asc){ ${companyFields} }`,
  )
  return results ?? []
}

export async function getActiveCompanies(): Promise<Company[]> {
  const results = await sanityFetch<Company[]>(
    `*[_type == "company" && coalesce(active, true) == true] | order(name asc){ ${companyFields} }`,
  )
  return results ?? []
}

export async function getCompanyById(id: string): Promise<Company | null> {
  return sanityFetch<Company>(`*[_type == "company" && _id == $id][0]{ ${companyFields} }`, { id })
}
