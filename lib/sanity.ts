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
    next: { revalidate: 60 },
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
