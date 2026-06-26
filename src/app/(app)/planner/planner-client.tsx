"use client"

import { useState, useTransition } from "react"
import { format, addDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { completePlanItem, removePlanItem, generatePlan } from "@/app/actions/planner.actions"
import {
  BookOpen,
  HelpCircle,
  Brain,
  FileText,
  CheckCircle2,
  Circle,
  Trash2,
  Wand2,
  Loader2,
  CalendarDays,
} from "lucide-react"

const SESSION_ICON: Record<string, React.ReactNode> = {
  CONTENT: <BookOpen className="h-3.5 w-3.5" />,
  QUESTIONS: <HelpCircle className="h-3.5 w-3.5" />,
  FLASHCARDS: <Brain className="h-3.5 w-3.5" />,
  SIMULADO: <FileText className="h-3.5 w-3.5" />,
  REDACAO: <FileText className="h-3.5 w-3.5" />,
  REVISION: <Brain className="h-3.5 w-3.5" />,
}

const SESSION_COLOR: Record<string, string> = {
  CONTENT: "text-blue-500",
  QUESTIONS: "text-green-500",
  FLASHCARDS: "text-purple-500",
  SIMULADO: "text-orange-500",
  REDACAO: "text-pink-500",
  REVISION: "text-yellow-500",
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const ALL_WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6]

interface PlanItem {
  id: string
  title: string
  description: string | null
  type: string
  scheduledAt: string
  duration: number
  completed: boolean
  topicId: string | null
  topic: {
    name: string
    slug: string
    discipline: { slug: string; area: { slug: string } }
  } | null
}

interface PlannerClientProps {
  weekStart: string
  items: PlanItem[]
  hasPlan: boolean
  dailyGoal: number
}

export function PlannerClient({ weekStart, items, hasPlan, dailyGoal }: PlannerClientProps) {
  const weekStartDate = parseISO(weekStart)
  const [localItems, setLocalItems] = useState<PlanItem[]>(items)
  const [selectedItem, setSelectedItem] = useState<PlanItem | null>(null)
  const [showGenDialog, setShowGenDialog] = useState(!hasPlan)
  const [isGenerating, startGenerate] = useTransition()
  const [isCompleting, startComplete] = useTransition()

  // Group items by day of week
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i)
    const dateStr = format(date, "yyyy-MM-dd")
    const dayItems = localItems.filter((item) =>
      item.scheduledAt.startsWith(dateStr)
    )
    return { date, label: DAY_LABELS[i], items: dayItems }
  })

  function handleComplete(item: PlanItem) {
    const willComplete = !item.completed
    setLocalItems((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, completed: !p.completed } : p))
    )
    setSelectedItem(null)
    startComplete(async () => {
      try {
        await completePlanItem(item.id)
        if (willComplete) toast.success("Item marcado como concluído!")
      } catch {
        toast.error("Erro ao atualizar item")
      }
    })
  }

  function handleRemove(item: PlanItem) {
    setLocalItems((prev) => prev.filter((p) => p.id !== item.id))
    setSelectedItem(null)
    startComplete(async () => {
      try {
        await removePlanItem(item.id)
        toast.success("Item removido")
      } catch {
        toast.error("Erro ao remover item")
      }
    })
  }

  function handleGenerate(formData: FormData) {
    startGenerate(async () => {
      try {
        await generatePlan(formData)
        toast.success("Plano gerado com sucesso!")
        window.location.reload()
      } catch {
        toast.error("Erro ao gerar plano. Tente novamente.")
      }
    })
  }

  const GenerateDialog = () => (
    <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Wand2 className="h-4 w-4" />
          Gerar plano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar novo plano</DialogTitle>
        </DialogHeader>
        <form
          action={handleGenerate as unknown as string}
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleGenerate(formData)
          }}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="daysCount">Quantos dias?</Label>
            <Input id="daysCount" name="daysCount" type="number" defaultValue={14} min={1} max={90} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dailyGoalMinutes">Meta diária (minutos)</Label>
            <Input id="dailyGoalMinutes" name="dailyGoalMinutes" type="number" defaultValue={dailyGoal} min={30} max={720} />
          </div>
          <div className="space-y-2">
            <Label>Dias disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_WEEK_DAYS.map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-sm">
                  <Checkbox name="weekDays" value={String(d)} defaultChecked={d >= 1 && d <= 5} />
                  {DAY_LABELS[d]}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isGenerating} className="gap-1">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isGenerating ? "Gerando…" : "Gerar plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planejador</h1>
          <p className="text-sm text-muted-foreground">
            Semana de {format(weekStartDate, "dd MMM", { locale: ptBR })} a{" "}
            {format(addDays(weekStartDate, 6), "dd MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <GenerateDialog />
      </div>

      {!hasPlan && localItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/20 py-16 gap-3 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">Nenhum plano ativo</p>
          <p className="text-sm text-muted-foreground">
            Gere um plano personalizado para começar a estudar com estratégia
          </p>
          <Button onClick={() => setShowGenDialog(true)} className="mt-2 gap-1">
            <Wand2 className="h-4 w-4" />
            Gerar meu primeiro plano
          </Button>
        </div>
      ) : (
        /* Weekly calendar */
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {days.map(({ date, label, items: dayItems }) => {
            const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
            const completedCount = dayItems.filter((i) => i.completed).length
            const totalMins = dayItems.reduce((s, i) => s + i.duration, 0)

            return (
              <div
                key={label}
                className={cn(
                  "rounded-xl border bg-card p-2 space-y-1.5 min-h-[80px]",
                  isToday && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between px-1">
                  <span className={cn("text-xs font-semibold", isToday ? "text-primary" : "text-muted-foreground")}>
                    {label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(date, "dd/MM")}
                  </span>
                </div>
                {totalMins > 0 && (
                  <p className="text-[10px] text-muted-foreground px-1">
                    {completedCount}/{dayItems.length} · {totalMins}min
                  </p>
                )}

                {dayItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "w-full rounded-lg px-2 py-1.5 text-left transition-colors",
                      item.completed
                        ? "bg-muted/40 opacity-60"
                        : "bg-muted/60 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn("shrink-0", SESSION_COLOR[item.type] ?? "text-muted-foreground")}>
                        {SESSION_ICON[item.type]}
                      </span>
                      <span className="text-[11px] font-medium leading-tight line-clamp-2 flex-1">
                        {item.title}
                      </span>
                      {item.completed && <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.duration}min</p>
                  </button>
                ))}

                {dayItems.length === 0 && (
                  <p className="text-[10px] text-muted-foreground px-1">Dia livre</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Item detail sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          {selectedItem && (
            <>
              <SheetHeader className="pb-3">
                <SheetTitle className="flex items-center gap-2">
                  <span className={cn(SESSION_COLOR[selectedItem.type] ?? "")}>
                    {SESSION_ICON[selectedItem.type]}
                  </span>
                  {selectedItem.title}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{format(parseISO(selectedItem.scheduledAt), "EEEE, dd 'de' MMM", { locale: ptBR })}</span>
                  <span>{selectedItem.duration} minutos</span>
                </div>
                {selectedItem.description && (
                  <p className="text-muted-foreground">{selectedItem.description}</p>
                )}
              </div>
              <div className="flex gap-2 mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleRemove(selectedItem)}
                  disabled={isCompleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleComplete(selectedItem)}
                  disabled={isCompleting}
                >
                  {selectedItem.completed ? (
                    <>
                      <Circle className="h-3.5 w-3.5" />
                      Desmarcar
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Concluir
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
