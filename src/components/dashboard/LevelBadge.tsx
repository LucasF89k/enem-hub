/** Anel pequeno com o nível atual e progresso pro próximo (500 XP por nível). */
export function LevelBadge({ level, totalXP }: { level: number; totalXP: number }) {
  const base = (level - 1) * 500 // XP no início do nível atual (calcLevel: floor(xp/500)+1)
  const pct = Math.min(100, Math.max(0, Math.round(((totalXP - base) / 500) * 100)))

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div
        className="relative flex h-[32px] w-[32px] items-center justify-center rounded-full"
        style={{ background: `conic-gradient(var(--primary) ${pct}%, var(--border) 0)` }}
      >
        <span className="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-background text-[11px] font-medium text-primary">
          {level}
        </span>
      </div>
      {/* Texto só no desktop, no mobile mostra apenas o anel */}
      <div className="hidden leading-tight sm:block">
        <p className="text-[9.5px] tracking-wide text-muted-foreground">nível</p>
        <p className="text-[12.5px] text-foreground">{totalXP.toLocaleString("pt-BR")} XP</p>
      </div>
    </div>
  )
}
