// One-time migration: creates the first `appUser` Sanity document from the
// legacy ADMIN_EMAIL / ADMIN_PASSWORD_HASH env vars, so the existing admin
// keeps their current password after login switches from env vars to Sanity.
// Usage: node scripts/seed-admin-user.mjs
// Safe to re-run — it's a no-op if a user with that email already exists.

import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..")

function loadEnvFile(filename) {
  const path = join(rootDir, filename)
  if (!existsSync(path)) return

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const eq = trimmed.indexOf("=")
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    // Next.js expands $-prefixed sequences in .env files, so bcrypt hashes are
    // stored with every "$" escaped as "\$" — undo that here.
    value = value.replace(/\\\$/g, "$")

    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadEnvFile(".env.local")
loadEnvFile(".env")

const {
  ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH,
  SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_PROJECT_ID,
  SANITY_DATASET,
  NEXT_PUBLIC_SANITY_DATASET,
  SANITY_API_VERSION,
  SANITY_API_WRITE_TOKEN,
} = process.env

const projectId = SANITY_PROJECT_ID ?? NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = SANITY_DATASET ?? NEXT_PUBLIC_SANITY_DATASET ?? "production"
const apiVersion = SANITY_API_VERSION ?? "2025-05-16"
const apiPathVersion = apiVersion.startsWith("v") ? apiVersion : `v${apiVersion}`

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
  fail("ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be set (in .env.local or the environment).")
}
if (!projectId) fail("SANITY_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID) must be set.")
if (!SANITY_API_WRITE_TOKEN) fail("SANITY_API_WRITE_TOKEN must be set.")

const email = ADMIN_EMAIL.trim().toLowerCase()

async function main() {
  const queryUrl = new URL(`https://${projectId}.api.sanity.io/${apiPathVersion}/data/query/${dataset}`)
  queryUrl.searchParams.set("query", `*[_type == "appUser" && lower(email) == $email][0]{_id}`)
  queryUrl.searchParams.set("$email", JSON.stringify(email))

  const queryResponse = await fetch(queryUrl)
  if (!queryResponse.ok) {
    fail(`Sanity query failed: ${queryResponse.status} ${queryResponse.statusText}`)
  }
  const { result } = await queryResponse.json()

  if (result?._id) {
    console.log(`An appUser already exists for ${email} (${result._id}) — nothing to do.`)
    return
  }

  const now = new Date().toISOString()
  const mutateUrl = `https://${projectId}.api.sanity.io/${apiPathVersion}/data/mutate/${dataset}?returnIds=true`

  const mutateResponse = await fetch(mutateUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SANITY_API_WRITE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mutations: [
        {
          create: {
            _type: "appUser",
            email,
            passwordHash: ADMIN_PASSWORD_HASH,
            role: "admin",
            active: true,
            mustChangePassword: false,
            createdAt: now,
            updatedAt: now,
          },
        },
      ],
    }),
  })

  if (!mutateResponse.ok) {
    const text = await mutateResponse.text().catch(() => "")
    fail(`Sanity mutation failed: ${mutateResponse.status} ${mutateResponse.statusText} ${text}`)
  }

  const body = await mutateResponse.json()
  console.log(`Created appUser for ${email} (${body.results?.[0]?.id}).`)
}

main()
