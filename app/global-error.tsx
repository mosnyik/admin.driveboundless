"use client"

import { useEffect } from "react"
import "./globals.css"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Root layout itself failed to render. Full message + stack land in the
    // server terminal / Vercel function logs; only the digest is shown below.
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              The app failed to load. Try again, or come back in a moment.
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-muted-foreground">
                Reference: <span className="select-all">{error.digest}</span>
              </p>
            )}
          </div>
          <button
            onClick={reset}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
