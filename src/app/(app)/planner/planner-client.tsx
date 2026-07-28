"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { format, addDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { Wand2, Loader2, RefreshCw, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { WeekDayStrip, type DaySummary } from "@/components/planner/WeekDayStrip"
import { TopicPlanCard, type PlanItemWithType } from "@/components/planner/TopicPlanCard"

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
    discipline: { name: string; slug: string; area: { slug: string } }
  } | null
}

interface PlannerClientProps {
  weekStart: string
  items: PlanItem[]
  hasPlan: boolean
  dailyGoal: number
}

interface Verdict {
  recommend: boolean
  reason: string
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

export function PlannerClient({ weekStart, items, hasPlan, dailyGoal }: PlannerClientProps) {
  const weekStartDate = parseISO(weekStart)
  const [localItems, setLocalItems] = useState<PlanItem[]>(items)
  const [showGenDialog, setShowGenDialog] = useState(!hasPlan)
  const [isGenerating, startGenerate] = useTransition()
  const [, startComplete] = useTransition()
  const [isRecalibrating, startRecalibrate] = useTransition()

  const todayStr = new Date().toISOString().slice(0, 10)

  // 7 dias da semana
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i)),
    [weekStartDate],
  )

  // Dia selecionado — inicia em hoje (se estiver na semana), senão no 1º dia
  const [selectedStr, setSelectedStr] = useState<string>(() => {
    const inWeek = weekDates.find((d) => d.toISOString().slice(0, 10) === todayStr)
    return (inWeek ?? weekDates[0]).toISOString().slice(0, 10)
  })
  const selectedDate = parseISO(selectedStr)

  // Resumo por dia (para o strip) — recalcula com localItems (reflete conclusões)
  const days: DaySummary[] = weekDates.map((date) => {
    const ds = date.toISOString().slice(0, 10)
    const dayItems = localItems.filter((i) => i.scheduledAt.startsWith(ds))
    return {
      date,
      totalItems: dayItems.length,
      completedItems: dayItems.filter((i) => i.completed).length,
      isToday: ds === todayStr,
    }
  })

  // Itens do dia selecionado, agrupados por tópico
  const selectedDayItems = localItems.filter((i) => i.scheduledAt.startsWith(selectedStr))
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { topicName: string; subjectName: string; items: PlanItemWithType[] }
    >()
    for (const item of selectedDayItems) {
      const key = item.topicId ?? `solo-${item.id}`
      if (!map.has(key)) {
        map.set(key, {
          topicName: item.topic?.name ?? item.title,
          subjectName: item.topic?.discipline.name ?? "",
          items: [],
        })
      }
      map.get(key)!.items.push({
        id: item.id,
        type: item.type,
        duration: item.duration,
        completed: item.completed,
        href: itemHref(item),
      })
    }
    return [...map.values()]
  }, [selectedDayItems])

  const dayTotal = selectedDayItems.length
  const dayDone = selectedDayItems.filter((i) => i.completed).length
  const dayPct = dayTotal > 0 ? (dayDone / dayTotal) * 100 : 0
  const isTodaySelected = selectedStr === todayStr
  const weekdayLabel = format(selectedDate, "EEEE", { locale: ptBR })
  const weekdayCap = weekdayLabel.charAt(0).toUpperCase() + weekdayLabel.slice(1)

  // Análise do Mentor (recalibrar?)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [analyzing, setAnalyzing] = useState(hasPlan)
  useEffect(() => {
    if (!hasPlan) return
    let alive = true
    setAnalyzing(true)
    fetch("/api/planner/recalibration-check", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((v: Verdict | null) => {
        if (alive && v) setVerdict(v)
      })
      .catch(() => {})
      .finally(() => alive && setAnalyzing(false))
    return () => {
      alive = false
    }
  }, [hasPlan])
  const recalibrateRecommended = verdict?.recommend ?? false

  function toggleComplete(id: string) {
    const item = localItems.find((p) => p.id === id)
    if (!item) return
    const willComplete = !item.completed
    setLocalItems((prev) => prev.map((p) => (p.id === id ? { ...p, completed: willComplete } : p)))
    startComplete(async () => {
      try {
        await completePlanItem(id)
        if (willComplete) toast.success("Concluído! 🎉")
      } catch {
        toast.error("Erro ao atualizar item")
        setLocalItems((prev) =>
          prev.map((p) => (p.id === id ? { ...p, completed: !willComplete } : p)),
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
        <Button size="sm" className="flex-1 gap-1.5 sm:flex-none">
          <Wand2 className="h-4 w-4" />
          Gerar plano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar novo plano</DialogTitle>
        </DialogHeader>

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
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold">Planejador</h1>
        <p className="text-sm text-muted-foreground">
          Semana de {format(weekStartDate, "dd 'de' MMM", { locale: ptBR })} a{" "}
          {format(addDays(weekStartDate, 6), "dd 'de' MMM", { locale: ptBR })}
        </p>

        <div className="mt-4 flex gap-2">
          {hasPlan && (
            <Button
              variant={recalibrateRecommended ? "default" : "outline"}
              size="sm"
              className={cn("flex-1 gap-1.5 sm:flex-none", !recalibrateRecommended && "text-muted-foreground")}
              onClick={handleRecalibrate}
              disabled={!recalibrateRecommended || isRecalibrating || analyzing}
              title={
                analyzing
                  ? "O Mentor está analisando seu desempenho…"
                  : recalibrateRecommended
                    ? "O Mentor sugere recalibrar com base no seu desempenho recente"
                    : "Sem necessidade de recalibrar por enquanto"
              }
            >
              {isRecalibrating || analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {analyzing ? "Analisando…" : "Recalibrar"}
            </Button>
          )}
          <GenerateDialog />
        </div>
      </div>

      {recalibrateRecommended && hasPlan && verdict?.reason && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-muted-foreground">
            <b className="text-foreground">Mentor:</b> {verdict.reason}
          </span>
        </div>
      )}

      {!hasPlan && localItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/20 py-16 text-center">
          <Wand2 className="h-10 w-10 text-muted-foreground/40" />
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
        <>
          {/* Tira de dias */}
          <WeekDayStrip
            days={days}
            selectedDate={selectedDate}
            onSelectDay={(d) => setSelectedStr(d.toISOString().slice(0, 10))}
          />

          {/* Cabeçalho do dia + progresso */}
          <div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">
                {weekdayCap}
                {isTodaySelected && <span className="text-muted-foreground"> · Hoje</span>}
              </h2>
              {dayTotal > 0 && (
                <span className="text-xs text-muted-foreground">
                  <b className="font-medium text-primary">{dayDone}</b>/{dayTotal} concluído
                </span>
              )}
            </div>
            {dayTotal > 0 && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${dayPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Cards do dia */}
          {groups.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">
              Dia livre — aproveite para descansar ou revisar o que quiser. 🌿
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((g, i) => (
                <TopicPlanCard
                  key={i}
                  topicName={g.topicName}
                  subjectName={g.subjectName}
                  items={g.items}
                  onToggle={toggleComplete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
