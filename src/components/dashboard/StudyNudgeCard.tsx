import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"

/** Card de sugestão/ação estilo "nudge" (Opal §4.4). */
export function StudyNudgeCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  ctaLabel,
  href,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
  href: string
}) {
  return (
    <div className="w-full rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h3 className="mt-2 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="mt-4 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {ctaLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
