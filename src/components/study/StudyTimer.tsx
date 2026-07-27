"use client"

import { useEffect, useRef } from "react"
import { recordReadingMinutes } from "@/app/actions/study-time.actions"

/**
 * Cronômetro de leitura em tempo real. Conta apenas o tempo em que a página
 * está VISÍVEL e a aba em foco (relógio do dispositivo), e envia os minutos
 * ativos ao servidor (1x por minuto acumulado + flush ao sair). Assim o tempo
 * de estudo reflete o uso real, sem estimativas fixas.
 */
export function StudyTimer() {
  const activeSecondsRef = useRef(0)

  useEffect(() => {
    const flush = (mins: number) => {
      if (mins > 0) recordReadingMinutes(mins).catch(() => {})
    }

    const TICK = 5 // segundos
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return
      activeSecondsRef.current += TICK
      const whole = Math.floor(activeSecondsRef.current / 60)
      if (whole >= 1) {
        activeSecondsRef.current -= whole * 60
        flush(whole)
      }
    }, TICK * 1000)

    // Ao esconder a aba ou sair da página, grava o resto (>= 30s conta 1 min).
    const flushRemainder = () => {
      if (activeSecondsRef.current >= 30) {
        flush(1)
        activeSecondsRef.current = 0
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushRemainder()
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", flushRemainder)

    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", flushRemainder)
      flushRemainder()
    }
  }, [])

  return null
}
