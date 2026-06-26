"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error("[AppError]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold">Algo deu errado</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ocorreu um erro ao carregar esta página. Tente novamente.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono mt-2">ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={unstable_retry}>Tentar novamente</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          Ir para o início
        </Button>
      </div>
    </div>
  )
}
