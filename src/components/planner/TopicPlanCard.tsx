"use client"

import Link from "next/link"
import { BookOpen, HelpCircle, Brain, ClipboardList, PenLine, Check, ChevronRight, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PlanItemWithType {
  id: string
  title: string
  type: string
  duration: number
  completed: boolean
  href: string
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; tint: string }> = {
  CONTENT: { label: "Teoria", icon: <BookOpen className="h-3.5 w-3.5" />, tint: "bg-primary/15 text-primary" },
  QUESTIONS: { label: "Questões", icon: <HelpCircle className="h-3.5 w-3.5" />, tint: "bg-accent/15 text-accent" },
  FLASHCARDS: { label: "Flashcards", icon: <Brain className="h-3.5 w-3.5" />, tint: "bg-purple-500/15 text-purple-500" },
  SIMULADO: { label: "Simulado", icon: <ClipboardList className="h-3.5 w-3.5" />, tint: "bg-orange-500/15 text-orange-500" },
  REDACAO: { label: "Redação", icon: <PenLine className="h-3.5 w-3.5" />, tint: "bg-pink-500/15 text-pink-500" },
  REVISION: { label: "Revisão", icon: <Brain className="h-3.5 w-3.5" />, tint: "bg-yellow-500/15 text-yellow-500" },
}

export function TopicPlanCard({
  topicName,
  subjectName,
  items,
  onToggle,
  onEdit,
  onDelete,
}: {
  topicName: string
  subjectName: string
  items: PlanItemWithType[]
  onToggle: (id: string) => void
  onEdit?: (item: PlanItemWithType) => void
  onDelete?: (id: string) => void
}) {
  const editable = !!onEdit || !!onDelete
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="px-4 pb-2.5 pt-3.5">
        <p className="text-sm font-medium leading-tight">{topicName}</p>
        {subjectName && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{subjectName}</p>}
      </div>

      {items.map((item) => {
        const meta = TYPE_META[item.type] ?? {
          label: item.type,
          icon: <BookOpen className="h-3.5 w-3.5" />,
          tint: "bg-muted text-muted-foreground",
        }
        return (
          <div key={item.id} className="flex items-center gap-3 border-t px-4 py-2.5">
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              aria-label={item.completed ? "Desmarcar" : "Concluir"}
              className={cn(
                "flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
                item.completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/50 hover:border-primary",
              )}
            >
              {item.completed && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>

            <Link href={item.href} className="flex flex-1 items-center gap-3 min-w-0">
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", meta.tint)}>
                {meta.icon}
              </span>
              <span
                className={cn(
                  "flex-1 truncate text-[13px]",
                  item.completed ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {item.title || meta.label}
                <span className="ml-1.5 text-[11px] text-muted-foreground">{item.duration}min</span>
              </span>
              {!editable && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </Link>

            {editable && (
              <div className="flex shrink-0 items-center gap-0.5">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    aria-label="Editar atividade"
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    aria-label="Remover atividade"
                    className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
