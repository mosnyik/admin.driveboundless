import "server-only"

const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"
const apiVersion = process.env.SANITY_API_VERSION ?? "2025-05-16"
const apiPathVersion = apiVersion.startsWith("v") ? apiVersion : `v${apiVersion}`

interface SanityQueryResponse<T> {
  result?: T
  error?: {
    description?: string
    type?: string
  }
}

export async function sanityFetch<T>(query: string, params: Record<string, string | number | boolean> = {}) {
  if (!projectId || !dataset) {
    return null
  }

  const url = new URL(`https://${projectId}.api.sanity.io/${apiPathVersion}/data/query/${dataset}`)
  url.searchParams.set("query", query)

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value))
  }

  const response = await fetch(url, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Sanity request failed: ${response.status} ${response.statusText}`)
  }

  const body = (await response.json()) as SanityQueryResponse<T>

  if (body.error) {
    throw new Error(body.error.description ?? body.error.type ?? "Sanity query failed")
  }

  return body.result ?? null
}

type SanityMutation = Record<string, unknown>

export async function sanityMutate(mutations: SanityMutation[]) {
  const token = process.env.SANITY_API_WRITE_TOKEN

  if (!projectId || !dataset) {
    throw new Error("Missing SANITY_PROJECT_ID or SANITY_DATASET environment variable.")
  }

  if (!token) {
    throw new Error("Missing SANITY_API_WRITE_TOKEN environment variable.")
  }

  const url = `https://${projectId}.api.sanity.io/${apiPathVersion}/data/mutate/${dataset}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mutations }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Sanity mutation failed: ${response.status} ${response.statusText} ${text}`)
  }

  return response.json()
}

export async function uploadSanityFile(file: Uint8Array, contentType: string, filename: string) {
  const token = process.env.SANITY_API_WRITE_TOKEN

  if (!projectId || !dataset) {
    throw new Error("Missing SANITY_PROJECT_ID or SANITY_DATASET environment variable.")
  }

  if (!token) {
    throw new Error("Missing SANITY_API_WRITE_TOKEN environment variable.")
  }

  const url = new URL(`https://${projectId}.api.sanity.io/${apiPathVersion}/assets/files/${dataset}`)
  url.searchParams.set("filename", filename)

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: Buffer.from(file),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Sanity file upload failed: ${response.status} ${response.statusText} ${text}`)
  }

  const body = (await response.json()) as { document?: { _id?: string } }

  if (!body.document?._id) {
    throw new Error("Sanity file upload did not return an asset id.")
  }

  return body.document._id
}
