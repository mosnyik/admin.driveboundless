"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { sendAgreementToCustomer } from "@/lib/actions/send-agreement"

export function SendAgreementButton({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await sendAgreementToCustomer(applicationId)
        toast.success(`Agreement sent to ${result.sentTo}`)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't send the agreement.")
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className="h-auto w-full justify-start px-4 py-2.5 text-left whitespace-normal sm:w-auto"
    >
      {pending ? <Spinner /> : <Send className="size-4 shrink-0" />}
      {pending ? "Sending…" : "Send agreement to customer"}
    </Button>
  )
}
