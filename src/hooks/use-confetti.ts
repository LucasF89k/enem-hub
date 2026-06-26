"use client"

import { useCallback } from "react"

export function useConfetti() {
  const fire = useCallback(async (opts?: { origin?: { x: number; y: number } }) => {
    const confetti = (await import("canvas-confetti")).default
    confetti({
      particleCount: 120,
      spread: 80,
      origin: opts?.origin ?? { x: 0.5, y: 0.6 },
      colors: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#3b82f6"],
      disableForReducedMotion: true,
    })
  }, [])

  const fireSides = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default
    const base = { particleCount: 60, spread: 55, disableForReducedMotion: true }
    confetti({ ...base, origin: { x: 0, y: 0.6 }, angle: 60 })
    confetti({ ...base, origin: { x: 1, y: 0.6 }, angle: 120 })
  }, [])

  return { fire, fireSides }
}
