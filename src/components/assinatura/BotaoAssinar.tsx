"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { iniciarAssinatura } from "@/app/actions/assinatura.actions"
import { invalidarCachePlano } from "@/hooks/use-plano"
import type { PlanoId } from "@/lib/abacatepay"
import { Crown } from "lucide-react"

interface Props {
  planoId: PlanoId
  label?: string
  variant?: "amber" | "emerald"
}

export function BotaoAssinar({
  planoId,
  label = "Assinar agora",
  variant = "amber",
}: Props) {
  const router = useRouter()
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const cores =
    variant === "emerald"
      ? "bg-emerald-500 hover:bg-emerald-400 text-black"
      : "bg-amber-500 hover:bg-amber-400 text-black"

  function handleClick() {
    setErro(null)
    startTransition(async () => {
      const resultado = await iniciarAssinatura(planoId)
      if (resultado.ok && resultado.url) {
        invalidarCachePlano()
        // Redireciona para o checkout do AbacatePay
        window.location.href = resultado.url
      } else {
        setErro(resultado.erro ?? "Erro ao iniciar assinatura")
      }
    })
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={pending}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-colors disabled:opacity-60 ${cores}`}
      >
        <Crown className="h-4 w-4" />
        {pending ? "Aguarde..." : label}
      </button>
      {erro && <p className="text-center text-xs text-red-400">{erro}</p>}
    </div>
  )
}
