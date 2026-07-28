import { getTrailConfig, type TrailType } from "@/lib/trail"

/** Nota discreta com a trilha atual (usa as mensagens do TRAIL_CONFIGS). */
export function TrailNote({ trail }: { trail: TrailType }) {
  const config = getTrailConfig(trail)
  return (
    <p className="mx-auto mt-8 max-w-[260px] text-center text-[12.5px] leading-relaxed text-muted-foreground">
      Você está na trilha{" "}
      <b className="font-medium text-primary">{config.label.toLowerCase()}</b> — {config.description}.
    </p>
  )
}
