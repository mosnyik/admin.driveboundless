"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { setViewAsCompany } from "@/lib/actions/companies"

export function ViewAsButton({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        await setViewAsCompany(companyId)
        router.push("/")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't switch to that company.")
      }
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      <Eye className="size-4" />
      View as
    </Button>
  )
}
