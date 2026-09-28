"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cancelarAssinatura } from "@/app/actions/assinatura.actions"
import { invalidarCachePlano } from "@/hooks/use-plano"

export function BotaoCancelar() {
  const router = useRouter()
  const [confirmar, setConfirmar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleCancelar() {
    setErro(null)
    startTransition(async () => {
      const resultado = await cancelarAssinatura()
      if (resultado.ok) {
        invalidarCachePlano()
        router.refresh()
      } else {
        setErro(resultado.erro ?? "Erro ao cancelar")
        setConfirmar(false)
      }
    })
  }

  if (!confirmar) {
    return (
      <button
        onClick={() => setConfirmar(true)}
        className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
      >
        Cancelar assinatura
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-300">Tem certeza? Você voltará ao plano Grátis.</p>
      <div className="flex gap-2">
        <button
          onClick={handleCancelar}
          disabled={pending}
          className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
        >
          {pending ? "Cancelando..." : "Sim, cancelar"}
        </button>
        <button
          onClick={() => setConfirmar(false)}
          className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
        >
          Voltar
        </button>
      </div>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  )
}
