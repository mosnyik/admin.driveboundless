# Drive Boundless — Admin Dashboard

Internal admin app for Drive Boundless Auto Solutions. It reads and writes the
same [Sanity](https://sanity.io) dataset that powers the public
`drive-boundless` marketing site, giving staff a single place to review rental
applications, manage the fleet, and handle agreements — without touching
Sanity Studio directly.

Built with Next.js (App Router), Server Actions, and Sanity as the content
store. No separate database — Sanity *is* the database.

## What it does

### Authentication
Email + password login gated behind a signed session cookie. Accounts (role
`admin` or `owner`) are `appUser` documents in Sanity — no public sign-up;
accounts are created from Settings > Team by an existing admin, with a
password they can change from Settings themselves afterward. Every route
outside `/login` is protected by middleware (`proxy.ts` in Next.js 16) and,
for the active/deactivated check, a second server-side check in
`app/(app)/layout.tsx`.

### Applications dashboard
Lists every rental application submitted through the public site, with
search and status filtering. Each application has a detail page showing the
renter's info, license, insurance, selected vehicle, additional drivers, and
full agreement history.

### Status workflow
Applications move through `new → contacted → approved → declined`. Status
changes are a single click from the list or detail view and are persisted
straight to Sanity.

### Vehicle changes & agreement history
If a customer's assigned vehicle changes after their agreement was signed,
staff can reassign the vehicle and the system regenerates the rental
agreement PDF automatically. Critically, **the original signed agreement is
never overwritten** — it stays exactly as the customer signed it. Each
vehicle change produces its own new agreement instead, and every change is
recorded in a visible history (old vehicle, new vehicle, reason, who made the
change, and a link to the agreement PDF that was active at the time). The
"send to customer" and "download" actions always use the most recent
agreement.

### Email alerts
- **New application alerts** — a Sanity webhook fires when a new rental
  application is created, and this app emails the admin team immediately.
  Recipients are configurable in Settings, with a sensible default if none
  are set.
- **Agreement delivery** — staff can email a signed/regenerated agreement
  PDF directly to the customer from the application detail page, with the
  send recorded in that application's history.
- Outgoing mail is sent via [Resend](https://resend.com), with a distinct
  display name per email type (e.g. "New Rental Alert" for internal alerts vs.
  "Drive Boundless" for customer-facing mail).

### Fleet management
Full CRUD for the vehicle fleet — add, edit, and manage vehicles (photos,
pricing, availability) that feed the "selected vehicle" picker used across
applications and vehicle changes.

### Dashboard analytics
The home page surfaces at-a-glance operational metrics instead of a raw data
table: application counts by status (new / contacted / approved / declined),
best-performing vehicles (most approved applications), and vehicles most
frequently swapped out after signing — a signal for reliability or demand
mismatches. Rankings are shown as simple bar-list visualizations that stay
readable on any screen size.

### Settings
- Notification recipient management (who gets new-application alerts)
- Theme preference (light / dark / follows system by default)

## Tech stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **React 19**
- **Sanity** as the content store — accessed via direct HTTP calls to
  Sanity's HTTP API (query + mutate), no SDK dependency
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives) for the UI
- **jose** for signed session cookies, **bcryptjs** for password hashing
- **Resend** for transactional email
- **@sanity/webhook** for verifying inbound webhook signatures
- **Vercel Analytics**

## Project structure

```
app/(app)/          Authenticated admin routes (dashboard, applications, fleet, settings)
app/login/          Login page
app/api/auth/       Login/logout route handlers
app/api/webhooks/   Inbound Sanity webhook (new-application alert trigger)
lib/                Sanity access, business logic, server actions, email
components/admin/   Admin-specific UI (sidebar, status controls, vehicle forms, etc.)
components/ui/      shadcn/ui primitives
proxy.ts            Auth middleware (Next.js 16's renamed middleware.ts)
```

## Getting started

```bash
pnpm install
cp .example.env .env.local          # fill in the values described below
pnpm hash-password "your password"  # generates ADMIN_PASSWORD_HASH
pnpm seed-admin-user                # creates the first appUser from ADMIN_EMAIL/ADMIN_PASSWORD_HASH
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See `.example.env` for the full list with inline explanations. In
short, you'll need:

- Sanity project ID, dataset name, and a write-enabled API token
- An admin email + bcrypt password hash, used once by `pnpm seed-admin-user`
  to create the first account — not read at login time after that
- A random session-signing secret
- A Resend API key (and optionally a verified sender domain) for email
- A shared secret for the Sanity webhook that triggers new-application alerts

None of these values are committed to the repo — `.env.local` is gitignored,
and production values are configured separately in Vercel's environment
settings.

### Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run a production build |
| `pnpm lint` | Lint the codebase |
| `pnpm hash-password "<password>"` | Generate a bcrypt hash for `ADMIN_PASSWORD_HASH` |
| `pnpm seed-admin-user` | One-time: create the first `appUser` from `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` |

## Deployment

Deployed on Vercel, with a Sanity webhook pointed at this app's
`/api/webhooks/sanity-application` endpoint to trigger new-application
alerts. Environment variables (including production-only secrets, distinct
from local dev values) are set directly in the Vercel project settings, not
in any file in this repo.
