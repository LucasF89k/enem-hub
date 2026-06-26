"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Play, Loader2 } from "lucide-react"
import { startSimuladoAndRedirect } from "@/app/actions/simulado.actions"

interface StartSimuladoButtonProps {
  simuladoId: string
  label: string
  variant?: "default" | "outline"
}

export function StartSimuladoButton({
  simuladoId,
  label,
  variant = "default",
}: StartSimuladoButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await startSimuladoAndRedirect(simuladoId)
    })
  }

  return (
    <Button
      className="w-full gap-2"
      size="lg"
      variant={variant}
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4 fill-current" />
      )}
      {isPending ? "Iniciando…" : label}
    </Button>
  )
}
