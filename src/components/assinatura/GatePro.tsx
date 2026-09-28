"use client"

import Link from "next/link"
import { Crown, Lock } from "lucide-react"

interface Props {
  /** Título curto do recurso bloqueado (ex: "Mentor IA ilimitado") */
  recurso: string
  /** Texto complementar opcional */
  descricao?: string
  /** Se true, envolve o children com um overlay. Se false, substitui o conteúdo. */
  overlay?: boolean
  children?: React.ReactNode
}

/**
 * Bloqueia visualmente um recurso exclusivo do plano Pro.
 * Dois modos:
 *  - overlay=true  → mostra children esmaecidos com badge por cima
 *  - overlay=false → substitui o conteúdo completamente (padrão)
 */
export function GatePro({ recurso, descricao, overlay = false, children }: Props) {
  const cta = (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/30 p-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
        <Crown className="h-5 w-5 text-amber-400" />
      </div>
      <div>
        <p className="font-semibold text-zinc-100">{recurso}</p>
        {descricao && (
          <p className="mt-0.5 text-sm text-zinc-400">{descricao}</p>
        )}
      </div>
      <Link
        href="/assine"
        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
      >
        <Crown className="h-3.5 w-3.5" />
        Ver planos Pro
      </Link>
    </div>
  )

  if (!overlay) return cta

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xs">{cta}</div>
      </div>
    </div>
  )
}

/** Ícone de cadeado pequeno para badges em linha (ex: ao lado de um botão). */
export function BadgePro({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30 ${className}`}
    >
      <Crown className="h-3 w-3" />
      Pro
    </span>
  )
}
