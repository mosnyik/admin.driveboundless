"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Full message + stack land in the server terminal / Vercel function logs
    // whenever this was thrown during rendering (Next attaches `error.digest`
    // to that log line so it can be found from the digest shown below).
    // This console.error is what a developer sees in the browser console;
    // nothing here is rendered to the page in production.
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. Try again, or head back to the dashboard.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground">
            Reference: <span className="select-all">{error.digest}</span>
          </p>
        )}
      </div>

      {process.env.NODE_ENV === "development" && (
        <details className="w-full max-w-lg rounded-lg border border-dashed p-4 text-left" open>
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            {error.name}: {error.message}
          </summary>
          {error.stack && (
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {error.stack}
            </pre>
          )}
        </details>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <Button asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
