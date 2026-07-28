"use client"

import { useState, useTransition } from "react"
import { format, addDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { completePlanItem, generatePlan, recalibratePlan } from "@/app/actions/planner.actions"
import {
  BookOpen,
  HelpCircle,
  Brain,
  FileText,
  PenLine,
  CheckCircle2,
  Circle,
  Wand2,
  Loader2,
  CalendarDays,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

const TYPE_ICON: Record<string, React.ReactNode> = {
  CONTENT: <BookOpen className="h-4 w-4" />,
  QUESTIONS: <HelpCircle className="h-4 w-4" />,
  FLASHCARDS: <Brain className="h-4 w-4" />,
  SIMULADO: <FileText className="h-4 w-4" />,
  REDACAO: <PenLine className="h-4 w-4" />,
  REVISION: <Brain className="h-4 w-4" />,
}

const TYPE_TINT: Record<string, string> = {
  CONTENT: "bg-blue-500/10 text-blue-500",
  QUESTIONS: "bg-green-500/10 text-green-500",
  FLASHCARDS: "bg-purple-500/10 text-purple-500",
  SIMULADO: "bg-orange-500/10 text-orange-500",
  REDACAO: "bg-pink-500/10 text-pink-500",
  REVISION: "bg-yellow-500/10 text-yellow-500",
}

const TYPE_LABEL: Record<string, string> = {
  CONTENT: "Teoria",
  QUESTIONS: "Questões",
  FLASHCARDS: "Flashcards",
  SIMULADO: "Simulado",
  REDACAO: "Redação",
  REVISION: "Revisão",
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const ALL_WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6]

interface PlanItem {
  id: string
  title: string
  description: string | null
  type: string
  scheduledAt: string
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
  recalibrateRecommended: boolean
}

/** Destino da atividade — abre direto a aba/matéria correspondente. */
function itemHref(item: PlanItem): string {
  const t = item.topic
  const base = t ? `/study/${t.discipline.area.slug}/${t.discipline.slug}/${t.slug}` : null
  switch (item.type) {
    case "CONTENT":
      return base ? `${base}?tab=teoria` : "/study"
    case "QUESTIONS":
      return base ? `${base}?tab=questoes` : "/study"
    case "FLASHCARDS":
      return base ? `${base}?tab=flashcards` : "/flashcards"
    case "SIMULADO":
      return "/simulados"
    case "REDACAO":
      return "/redacao"
    default:
      return base ?? "/study"
  }
}

export function PlannerClient({
  weekStart,
  items,
  hasPlan,
  dailyGoal,
  recalibrateRecommended,
}: PlannerClientProps) {
  const weekStartDate = parseISO(weekStart)
  const [localItems, setLocalItems] = useState<PlanItem[]>(items)
  const [showGenDialog, setShowGenDialog] = useState(!hasPlan)
  const [isGenerating, startGenerate] = useTransition()
  const [, startComplete] = useTransition()
  const [isRecalibrating, startRecalibrate] = useTransition()

  const todayStr = new Date().toISOString().slice(0, 10)

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i)
    const dateStr = date.toISOString().slice(0, 10)
    const dayItems = localItems.filter((item) => item.scheduledAt.startsWith(dateStr))
    return { date, dateStr, items: dayItems }
  })

  function toggleComplete(item: PlanItem) {
    const willComplete = !item.completed
    setLocalItems((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, completed: willComplete } : p)),
    )
    startComplete(async () => {
      try {
        await completePlanItem(item.id)
        if (willComplete) toast.success("Concluído! 🎉")
      } catch {
        toast.error("Erro ao atualizar item")
        setLocalItems((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, completed: !willComplete } : p)),
        )
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

  function handleRecalibrate() {
    if (!recalibrateRecommended) return
    startRecalibrate(async () => {
      try {
        const result = await recalibratePlan()
        if (result.success) {
          toast.success("Plano recalibrado com base no seu desempenho!")
          window.location.reload()
        } else {
          toast.error(result.error ?? "Erro ao recalibrar")
        }
      } catch {
        toast.error("Erro ao recalibrar plano.")
      }
    })
  }

  const GenerateDialog = () => (
    <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Wand2 className="h-4 w-4" />
          Gerar plano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar novo plano</DialogTitle>
        </DialogHeader>

        {/* Opção recomendada: montar com o Mentor */}
        <Link
          href="/mentor?planner=1"
          className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 transition-colors hover:bg-primary/10"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Montar com o Mentor</p>
            <p className="text-xs text-muted-foreground">
              Responda algumas perguntas e o Mentor cria a rotina ideal pra você
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
        </Link>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            ou gere manualmente
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleGenerate(new FormData(e.currentTarget))
          }}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="daysCount">Quantos dias?</Label>
            <Input id="daysCount" name="daysCount" type="number" defaultValue={14} min={1} max={90} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dailyGoalMinutes">Meta diária (minutos)</Label>
            <Input
              id="dailyGoalMinutes"
              name="dailyGoalMinutes"
              type="number"
              defaultValue={dailyGoal}
              min={30}
              max={720}
            />
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
            <Button type="submit" disabled={isGenerating} className="gap-1.5">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isGenerating ? "Gerando…" : "Gerar plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Planejador</h1>
          <p className="text-sm text-muted-foreground">
            Semana de {format(weekStartDate, "dd 'de' MMM", { locale: ptBR })} a{" "}
            {format(addDays(weekStartDate, 6), "dd 'de' MMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPlan && (
            <Button
              variant={recalibrateRecommended ? "default" : "outline"}
              size="sm"
              className={cn("gap-1.5", !recalibrateRecommended && "text-muted-foreground")}
              onClick={handleRecalibrate}
              disabled={!recalibrateRecommended || isRecalibrating}
              title={
                recalibrateRecommended
                  ? "O Mentor sugere recalibrar com base no seu desempenho recente"
                  : "Sem necessidade de recalibrar por enquanto"
              }
            >
              {isRecalibrating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Recalibrar</span>
            </Button>
          )}
          <GenerateDialog />
        </div>
      </div>

      {recalibrateRecommended && hasPlan && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-muted-foreground">
            O Mentor recomenda <b className="text-foreground">recalibrar</b> — seu desempenho recente
            mudou as prioridades.
          </span>
        </div>
      )}

      {!hasPlan && localItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/20 py-16 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">Nenhum plano ativo</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Gere um plano personalizado para começar a estudar com estratégia
          </p>
          <Button onClick={() => setShowGenDialog(true)} className="mt-2 gap-1.5">
            <Wand2 className="h-4 w-4" />
            Gerar meu primeiro plano
          </Button>
        </div>
      ) : (
        /* Agenda vertical por dia */
        <div className="space-y-5">
          {days.map(({ date, dateStr, items: dayItems }) => {
            const isToday = dateStr === todayStr
            const done = dayItems.filter((i) => i.completed).length
            const weekday = format(date, "EEEE", { locale: ptBR })
            const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1)

            return (
              <section key={dateStr} className="space-y-2">
                <div className="flex items-center gap-2 px-0.5">
                  <h2
                    className={cn(
                      "text-sm font-semibold",
                      isToday ? "text-primary" : "text-foreground",
                    )}
                  >
                    {weekdayCap}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {format(date, "dd/MM", { locale: ptBR })}
                  </span>
                  {isToday && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      Hoje
                    </Badge>
                  )}
                  {dayItems.length > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {done}/{dayItems.length}
                    </span>
                  )}
                </div>

                {dayItems.length === 0 ? (
                  <p className="rounded-xl border border-dashed px-3.5 py-3 text-xs text-muted-foreground">
                    Dia livre
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        {/* Marcar como concluído */}
                        <button
                          type="button"
                          onClick={() => toggleComplete(item)}
                          className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-primary"
                          aria-label={item.completed ? "Desmarcar" : "Concluir"}
                        >
                          {item.completed ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <Circle className="h-6 w-6" />
                          )}
                        </button>

                        {/* Abre direto a atividade */}
                        <Link
                          href={itemHref(item)}
                          className={cn(
                            "flex flex-1 items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40",
                            item.completed ? "bg-muted/20 opacity-60" : "bg-card",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              TYPE_TINT[item.type] ?? "bg-muted text-muted-foreground",
                            )}
                          >
                            {TYPE_ICON[item.type]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate text-sm font-medium",
                                item.completed && "line-through",
                              )}
                            >
                              {item.topic?.name ?? item.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {TYPE_LABEL[item.type] ?? item.type}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
