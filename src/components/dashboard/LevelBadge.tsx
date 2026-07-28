/** Anel pequeno com o nível atual e progresso pro próximo (500 XP por nível). */
export function LevelBadge({ level, totalXP }: { level: number; totalXP: number }) {
  const base = (level - 1) * 500 // XP no início do nível atual (calcLevel: floor(xp/500)+1)
  const pct = Math.min(100, Math.max(0, Math.round(((totalXP - base) / 500) * 100)))

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full"
        style={{ background: `conic-gradient(var(--primary) ${pct}%, var(--border) 0)` }}
      >
        <span className="flex h-[27px] w-[27px] items-center justify-center rounded-full bg-background text-[11px] font-medium text-primary">
          {level}
        </span>
      </div>
      <div className="leading-tight">
        <p className="text-[9.5px] tracking-wide text-muted-foreground">nível</p>
        <p className="text-[12.5px] text-foreground">{totalXP.toLocaleString("pt-BR")} XP</p>
      </div>
    </div>
  )
}
