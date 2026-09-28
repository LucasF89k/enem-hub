"use client"

import { useState, useEffect, useTransition } from "react"
import { PlanoTipo } from "@prisma/client"
import { getPlanoAtual } from "@/app/actions/assinatura.actions"

export type InfoPlano = {
  plano: PlanoTipo
  pro: boolean
  periodoFim: Date | null
  carregando: boolean
}

const CACHE_MS = 60_000 // 1 minuto — não bate no banco a cada render

let cacheTimestamp = 0
let cacheValor: Omit<InfoPlano, "carregando"> | null = null

export function usePlano(): InfoPlano {
  const [info, setInfo] = useState<Omit<InfoPlano, "carregando">>({
    plano: PlanoTipo.FREE,
    pro: false,
    periodoFim: null,
  })
  const [carregando, startTransition] = useTransition()

  useEffect(() => {
    if (cacheValor && Date.now() - cacheTimestamp < CACHE_MS) {
      setInfo(cacheValor)
      return
    }

    startTransition(async () => {
      const resultado = await getPlanoAtual()
      cacheValor = resultado
      cacheTimestamp = Date.now()
      setInfo(resultado)
    })
  }, [])

  return { ...info, carregando }
}

/** Invalida o cache do plano (chamar após assinar ou cancelar). */
export function invalidarCachePlano() {
  cacheTimestamp = 0
  cacheValor = null
}
