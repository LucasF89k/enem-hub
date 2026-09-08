import { differenceInDays } from "date-fns"

export type TrailType = "EXTENSIVA" | "SEMI_EXTENSIVA" | "INTENSIVA" | "SPRINT"

export interface TrailConfig {
  type: TrailType
  label: string
  description: string
  minDays: number   // minimum days before exam
  maxDays: number   // maximum days before exam (Infinity for EXTENSIVA)
  color: string     // Tailwind bg+text classes
  badgeColor: string
  // Time allocation ratios (must sum to 1)
  ratios: {
    content: number     // teoria
    questions: number   // questões
    flashcards: number  // revisão SM-2
    simulados: number   // simulados
  }
  // Minutes per block (content, questions blocks per topic)
  blockMinutes: {
    content: number
    questions: number
  }
  tip: string
}

export const TRAIL_CONFIGS: Record<TrailType, TrailConfig> = {
  EXTENSIVA: {
    type: "EXTENSIVA",
    label: "Extensiva",
    description: "9+ meses para o ENEM",
    minDays: 270,
    maxDays: Infinity,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    ratios: { content: 0.50, questions: 0.20, flashcards: 0.25, simulados: 0.05 },
    blockMinutes: { content: 45, questions: 15 },
    tip: "Foco em construir base sólida de teoria. Questões são para fixação, não pressão.",
  },
  SEMI_EXTENSIVA: {
    type: "SEMI_EXTENSIVA",
    label: "Semi-extensiva",
    description: "6-9 meses para o ENEM",
    minDays: 180,
    maxDays: 269,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    badgeColor: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    ratios: { content: 0.35, questions: 0.30, flashcards: 0.25, simulados: 0.10 },
    blockMinutes: { content: 35, questions: 20 },
    tip: "Equilíbrio entre teoria e prática. Aumente o número de questões semanais.",
  },
  INTENSIVA: {
    type: "INTENSIVA",
    label: "Intensiva",
    description: "3-6 meses para o ENEM",
    minDays: 90,
    maxDays: 179,
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    badgeColor: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
    ratios: { content: 0.25, questions: 0.40, flashcards: 0.20, simulados: 0.15 },
    blockMinutes: { content: 25, questions: 30 },
    tip: "Priorize questões e resolução de provas anteriores. Teoria só nos pontos críticos.",
  },
  SPRINT: {
    type: "SPRINT",
    label: "Sprint",
    description: "Menos de 3 meses para o ENEM",
    minDays: 0,
    maxDays: 89,
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
    badgeColor: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
    ratios: { content: 0.10, questions: 0.50, flashcards: 0.15, simulados: 0.25 },
    blockMinutes: { content: 15, questions: 40 },
    tip: "Foco total em simulados e revisão de erros. Estude apenas os tópicos de maior incidência.",
  },
}

/**
 * Detects the trail type based on days until the exam.
 * Falls back to EXTENSIVA if no exam date is set.
 */
export function detectTrail(examDate: Date | null | undefined): TrailType {
  if (!examDate) return "EXTENSIVA"
  const daysLeft = differenceInDays(examDate, new Date())
  if (daysLeft < 0) return "SPRINT"
  if (daysLeft < 90) return "SPRINT"
  if (daysLeft < 180) return "INTENSIVA"
  if (daysLeft < 270) return "SEMI_EXTENSIVA"
  return "EXTENSIVA"
}

export function getTrailConfig(trail: TrailType): TrailConfig {
  return TRAIL_CONFIGS[trail]
}
