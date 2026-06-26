"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-background text-foreground font-sans">
        <div className="text-5xl">⚠️</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Algo deu errado</h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Ocorreu um erro inesperado. Nosso time foi notificado.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">ID: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={reset}>Tentar novamente</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
            Ir para o início
          </Button>
        </div>
      </body>
    </html>
  )
}
