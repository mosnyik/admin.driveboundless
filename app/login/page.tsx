"use client"

import { Suspense, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const ERROR_MESSAGES: Record<string, string> = {
  state: "That sign-in link expired. Please try again.",
  google: "Google sign-in failed. Please try again.",
  unverified: "That Google account's email isn't verified.",
  not_approved: "This Google account isn't approved for access. Contact an administrator.",
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.26a12 12 0 0 0 0 10.78l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

function GoogleAuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const message = error ? ERROR_MESSAGES[error] ?? "Something went wrong. Please try again." : null

  if (!message) return null

  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </div>
  )
}

function OwnerLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        setLoading(false)
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Could not reach the server. Please try again.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            disabled={loading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className={cn(
              "absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
            )}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button type="submit" variant="outline" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Spinner />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-black px-12 py-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(212,175,55,0.18) 0%, rgba(0,0,0,0) 70%)",
          }}
        />
        <div className="relative text-sm font-medium tracking-[0.2em] text-amber-200/70 uppercase">
          Drive Boundless Auto Solutions
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
          <Image
            src="/images/logo.png"
            alt="Drive Boundless"
            width={220}
            height={202}
            priority
            className="h-[202px] w-[220px]"
          />
          <p className="max-w-sm text-center font-serif text-lg text-neutral-300">
            The operations console behind every rental, from first inquiry to signed agreement.
          </p>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-neutral-500">
          <ShieldCheck className="size-4 text-amber-200/60" />
          Private &amp; restricted to approved accounts
        </div>
      </div>

      {/* Sign-in panel — pinned to the light palette regardless of theme */}
      <div className="light flex items-center justify-center bg-background px-6 py-16 text-foreground sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex flex-col items-center gap-4 lg:hidden">
            <Image
              src="/images/logo.png"
              alt="Drive Boundless"
              width={72}
              height={66}
              priority
              className="h-[66px] w-[72px]"
            />
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-2xl font-semibold text-foreground">Sign in</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Administrators sign in with Google.</p>
          </div>

          <div className="space-y-5">
            <Suspense fallback={null}>
              <GoogleAuthError />
            </Suspense>

            <a
              href="/api/auth/google"
              className="flex w-full items-center justify-center gap-3 rounded-md border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
            >
              <GoogleIcon />
              Continue with Google
            </a>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">Company owners</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <OwnerLoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
