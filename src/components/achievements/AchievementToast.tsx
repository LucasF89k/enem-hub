"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useConfetti } from "@/hooks/use-confetti"
import type { NewAchievement } from "@/lib/achievements"

interface Props {
  achievements: NewAchievement[]
}

export function AchievementToast({ achievements }: Props) {
  const { fireSides } = useConfetti()
  const firedRef = useRef(false)

  useEffect(() => {
    if (!achievements.length || firedRef.current) return
    firedRef.current = true

    achievements.forEach((a, i) => {
      setTimeout(() => {
        toast.custom(
          () => (
            <div className="flex items-center gap-3 bg-background border rounded-lg shadow-lg px-4 py-3 min-w-[280px]">
              <span className="text-3xl">{a.icon}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Conquista desbloqueada!
                </p>
                <p className="font-bold text-sm">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
                <p className="text-xs font-medium text-amber-500 mt-0.5">+{a.xpReward} XP</p>
              </div>
            </div>
          ),
          { duration: 5000 }
        )
        if (i === 0) fireSides()
      }, i * 800)
    })
  }, [achievements, fireSides])

  return null
}
