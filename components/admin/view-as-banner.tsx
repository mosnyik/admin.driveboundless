"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { setViewAsCompany } from "@/lib/actions/companies"

export function ViewAsBanner({ companyName }: { companyName: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleExit() {
    startTransition(async () => {
      try {
        await setViewAsCompany(null)
        router.push("/")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't exit \"View as\" mode.")
      }
    })
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-amber-500/15 px-4 py-2 text-sm text-amber-800 dark:text-amber-300">
      <Eye className="size-4 shrink-0" />
      <span>
        Viewing as <strong>{companyName}</strong>
      </span>
      <Button variant="ghost" size="sm" onClick={handleExit} disabled={pending} className="h-7 gap-1 px-2">
        <X className="size-3.5" />
        Exit
      </Button>
    </div>
  )
}
