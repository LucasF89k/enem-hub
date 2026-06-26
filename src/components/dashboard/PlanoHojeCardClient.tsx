"use client"

import { useTransition } from "react"
import { markPlanItemDone } from "@/app/actions/planner.actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PlanItem {
  id: string
  title: string
  type: string
  duration: number
  topicName: string | null
}

const TYPE_LABEL: Record<string, string> = {
  CONTENT: "Teoria",
  FLASHCARDS: "Cards",
  QUESTIONS: "Questões",
  SIMULADO: "Simulado",
  REDACAO: "Redação",
  REVISION: "Revisão",
}

export function PlanoHojeCardClient({ items }: { items: PlanItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <PlanItemRow key={item.id} item={item} />
      ))}
    </ul>
  )
}

function PlanItemRow({ item }: { item: PlanItem }) {
  const [isPending, startTransition] = useTransition()

  function handleCheck() {
    startTransition(() => markPlanItemDone(item.id))
  }

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-md border px-3 py-2 transition-opacity",
        isPending && "opacity-50"
      )}
    >
      <Checkbox
        id={item.id}
        onCheckedChange={handleCheck}
        disabled={isPending}
        className="mt-0.5"
      />
      <label htmlFor={item.id} className="flex flex-1 flex-col gap-0.5 cursor-pointer">
        <span className="text-sm font-medium leading-tight">{item.title}</span>
        {item.topicName && (
          <span className="text-xs text-muted-foreground">{item.topicName}</span>
        )}
      </label>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge variant="secondary" className="text-[10px]">
          {TYPE_LABEL[item.type] ?? item.type}
        </Badge>
        <span className="text-[10px] text-muted-foreground">{item.duration}min</span>
      </div>
    </li>
  )
}
