"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/actions/users"
import { getCallerScope } from "@/lib/auth"
import { sanityMutate } from "@/lib/sanity"
import type { CompanyFormValues, OwnCompanyFormValues } from "@/lib/company-types"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateValues(values: CompanyFormValues) {
  if (!values.name.trim()) throw new Error("Legal name is required.")
  if (!values.phone.trim()) throw new Error("Phone is required.")
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    throw new Error(`"${values.email}" doesn't look like a valid email address.`)
  }
  if (values.notificationEmail.trim() && !EMAIL_PATTERN.test(values.notificationEmail.trim())) {
    throw new Error(`"${values.notificationEmail}" doesn't look like a valid email address.`)
  }
}

function buildFields(values: CompanyFormValues) {
  return {
    name: values.name.trim(),
    dbaName: values.dbaName.trim() || undefined,
    address: values.address.trim() || undefined,
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    notificationEmail: values.notificationEmail.trim().toLowerCase() || undefined,
    active: values.active,
  }
}

export async function createCompany(values: CompanyFormValues) {
  await requireAdmin()

  validateValues(values)

  const now = new Date().toISOString()

  const result = (await sanityMutate([
    { create: { _type: "company", ...buildFields(values), createdAt: now, updatedAt: now } },
  ])) as { results?: Array<{ id?: string }> }
  const newId = result.results?.[0]?.id

  revalidatePath("/companies")

  return { ok: true as const, id: newId }
}

export async function updateCompany(id: string, values: CompanyFormValues) {
  await requireAdmin()

  validateValues(values)

  await sanityMutate([
    {
      patch: {
        id,
        set: { ...buildFields(values), updatedAt: new Date().toISOString() },
        unset: [
          ...(values.dbaName.trim() ? [] : ["dbaName"]),
          ...(values.address.trim() ? [] : ["address"]),
          ...(values.notificationEmail.trim() ? [] : ["notificationEmail"]),
        ],
      },
    },
  ])

  revalidatePath("/companies")
  revalidatePath(`/companies/${id}`)

  return { ok: true as const }
}

export async function setCompanyActive(id: string, active: boolean) {
  await requireAdmin()

  await sanityMutate([{ patch: { id, set: { active, updatedAt: new Date().toISOString() } } }])

  revalidatePath("/companies")

  return { ok: true as const }
}

/** Owner self-service: limited to contact/notification details, never the
 * legal name/DBA (used on rental agreements) or the active flag. */
export async function updateOwnCompany(values: OwnCompanyFormValues) {
  const scope = await getCallerScope()
  if (!scope || scope.role !== "owner") {
    throw new Error("Only a company owner can do that.")
  }
  if (!scope.companyId) {
    throw new Error("Your account isn't linked to a company yet — contact an admin.")
  }

  if (!values.phone.trim()) throw new Error("Phone is required.")
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    throw new Error(`"${values.email}" doesn't look like a valid email address.`)
  }
  if (values.notificationEmail.trim() && !EMAIL_PATTERN.test(values.notificationEmail.trim())) {
    throw new Error(`"${values.notificationEmail}" doesn't look like a valid email address.`)
  }

  await sanityMutate([
    {
      patch: {
        id: scope.companyId,
        set: {
          address: values.address.trim() || undefined,
          phone: values.phone.trim(),
          email: values.email.trim().toLowerCase(),
          notificationEmail: values.notificationEmail.trim().toLowerCase() || undefined,
          updatedAt: new Date().toISOString(),
        },
        unset: [
          ...(values.address.trim() ? [] : ["address"]),
          ...(values.notificationEmail.trim() ? [] : ["notificationEmail"]),
        ],
      },
    },
  ])

  revalidatePath("/settings")

  return { ok: true as const }
}
