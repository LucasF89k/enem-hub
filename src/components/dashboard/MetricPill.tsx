import type { LucideIcon } from "lucide-react"

/** Cápsula ícone + valor + label, usada abaixo do gauge (estilo Opal). */
export function MetricPill({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon
  value: string | number
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="opal-glass-card flex items-center gap-1.5 rounded-full px-4 py-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}
