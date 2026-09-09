"use client"

import { useMemo, useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, ChevronDown, Zap, RotateCcw, HelpCircle, Shuffle, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { answerQuestion } from "@/app/actions/question.actions"
import { StreakFlameOverlay } from "@/components/study/StreakFlameOverlay"

interface Option {
  id: string
  letter: string
  text: string
}
export interface InlineQuestion {
  id: string
  statement: string
  difficulty: string
  images: string[]
  explanation: string
  correctId: string | null
  options: Option[]
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Fácil",
  MEDIUM: "Médio",
  HARD: "Difícil",
  VERY_HARD: "Muito difícil",
}
const DIFFICULTY_CLASS: Record<string, string> = {
  EASY: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  MEDIUM: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  HARD: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  VERY_HARD: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
}

type Filter = "all" | "EASY" | "MEDIUM" | "HARD" | "shuffle" | "wrong"

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Aviso discreto: questões deste tópico que existem mas ficaram de fora da
 *  lista (sem gabarito cadastrado — tipicamente aguardando a imagem/gráfico
 *  do PDF original) não aparecem no quiz pra não deixar o aluno responder
 *  algo que nunca vai corrigir certo. */
function ManutencaoNotice({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
      <Wrench className="h-4 w-4 shrink-0" />
      <span>
        {count === 1
          ? "1 questão deste tópico está em manutenção (aguardando material) e não aparece aqui."
          : `${count} questões deste tópico estão em manutenção (aguardando material) e não aparecem aqui.`}
      </span>
    </div>
  )
}

export function TopicQuestionsInline({
  questions,
  wrongIds = [],
  pendingQuestionsCount = 0,
}: {
  questions: InlineQuestion[]
  wrongIds?: string[]
  /** questões do tópico que existem mas foram filtradas por falta de gabarito */
  pendingQuestionsCount?: number
}) {
  const [filter, setFilter] = useState<Filter>("all")
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [index, setIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<{ isCorrect: boolean; correctId: string; explanation: string } | null>(null)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [startTime, setStartTime] = useState(() => Date.now())
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [flame, setFlame] = useState<{ streakIncreased: boolean; streak: number } | null>(null)

  const wrongSet = useMemo(() => new Set(wrongIds), [wrongIds])
  const counts = useMemo(() => {
    let easy = 0, medium = 0, hard = 0
    for (const q of questions) {
      if (q.difficulty === "EASY") easy++
      else if (q.difficulty === "MEDIUM") medium++
      else hard++ // HARD e VERY_HARD
    }
    return { easy, medium, hard, wrong: questions.filter((q) => wrongSet.has(q.id)).length }
  }, [questions, wrongSet])

  // Lista ativa conforme o filtro escolhido
  const active = useMemo(() => {
    switch (filter) {
      case "EASY": return questions.filter((q) => q.difficulty === "EASY")
      case "MEDIUM": return questions.filter((q) => q.difficulty === "MEDIUM")
      case "HARD": return questions.filter((q) => q.difficulty === "HARD" || q.difficulty === "VERY_HARD")
      case "wrong": return questions.filter((q) => wrongSet.has(q.id))
      case "shuffle": return shuffleArr(questions)
      default: return questions
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [questions, filter, shuffleSeed, wrongSet])

  function resetProgress() {
    setIndex(0)
    setSelectedId(null)
    setConfirmed(false)
    setResult(null)
    setExplanationOpen(false)
    setCorrectCount(0)
    setAnsweredCount(0)
    setStartTime(Date.now())
  }

  function changeFilter(f: Filter) {
    if (f === "shuffle") setShuffleSeed((s) => s + 1)
    setFilter(f)
    resetProgress()
  }

  const FilterBar = () => {
    const chip = (f: Filter, label: string, extra?: string) => (
      <button
        key={f}
        onClick={() => changeFilter(f)}
        className={cn(
          "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors",
          filter === f ? "border-primary bg-primary/10 font-semibold text-primary" : "bg-background hover:bg-muted",
        )}
      >
        {label}{extra}
      </button>
    )
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {chip("all", "Todas")}
        {chip("shuffle", "Misturar")}
        {counts.easy > 0 && chip("EASY", "Fáceis", ` ${counts.easy}`)}
        {counts.medium > 0 && chip("MEDIUM", "Médias", ` ${counts.medium}`)}
        {counts.hard > 0 && chip("HARD", "Difíceis", ` ${counts.hard}`)}
        {counts.wrong > 0 && chip("wrong", "Revisar erradas", ` ${counts.wrong}`)}
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <ManutencaoNotice count={pendingQuestionsCount} />
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {pendingQuestionsCount > 0 ? "Nenhuma questão disponível no momento" : "Nenhuma questão neste tópico ainda"}
          </p>
        </div>
      </div>
    )
  }

  const finished = index >= active.length
  const q = finished ? null : active[index]

  function handleConfirm() {
    if (!q || !selectedId || confirmed || isPending) return
    const secs = Math.round((Date.now() - startTime) / 1000)
    startTransition(async () => {
      try {
        const res = await answerQuestion(q.id, selectedId, secs)
        setResult(res)
        setConfirmed(true)
        setExplanationOpen(!res.isCorrect)
        setAnsweredCount((n) => n + 1)
        if (res.isCorrect) {
          setCorrectCount((n) => n + 1)
          setFlame({ streakIncreased: res.streakIncreased, streak: res.newStreak })
        }
        setError(null)
      } catch {
        setError("Erro ao registrar resposta. Tente novamente.")
      }
    })
  }

  function next() {
    setIndex((i) => i + 1)
    setSelectedId(null)
    setConfirmed(false)
    setResult(null)
    setExplanationOpen(false)
    setStartTime(Date.now())
  }

  // Filtro sem questões (ex.: nenhuma difícil, ou nenhuma errada ainda)
  if (active.length === 0) {
    return (
      <div className="space-y-4">
        <ManutencaoNotice count={pendingQuestionsCount} />
        <FilterBar />
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <HelpCircle className="h-9 w-9 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {filter === "wrong"
              ? "Você ainda não errou nenhuma questão deste tópico. 🎉"
              : "Nenhuma questão neste filtro."}
          </p>
        </div>
      </div>
    )
  }

  if (finished) {
    const pct = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0
    return (
      <div className="space-y-4">
        <ManutencaoNotice count={pendingQuestionsCount} />
        <FilterBar />
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">Prática concluída!</p>
            <p className="text-sm text-muted-foreground">
              Você acertou <b className="text-foreground">{correctCount}</b> de {answeredCount} ({pct}%)
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetProgress} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Refazer
            </Button>
            <Button onClick={() => changeFilter("shuffle")} variant="outline" className="gap-2">
              <Shuffle className="h-4 w-4" />
              Misturar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  function optionClass(optId: string) {
    if (!confirmed) {
      return optId === selectedId
        ? "border-primary bg-primary/10 ring-1 ring-primary"
        : "border-border bg-card hover:bg-muted/50 cursor-pointer"
    }
    if (optId === result?.correctId) return "border-green-500 bg-green-500/12 ring-1 ring-green-500/50"
    if (optId === selectedId && !result?.isCorrect) return "border-red-500 bg-red-500/12 ring-1 ring-red-500/50"
    return "border-border bg-card opacity-50"
  }
  function letterClass(optId: string) {
    if (!confirmed) {
      return optId === selectedId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
    }
    if (optId === result?.correctId) return "bg-green-500 text-white"
    if (optId === selectedId && !result?.isCorrect) return "bg-red-500 text-white"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="space-y-4">
      <StreakFlameOverlay
        open={flame !== null}
        onClose={() => setFlame(null)}
        streakIncreased={flame?.streakIncreased ?? false}
        streak={flame?.streak ?? 0}
      />

      <ManutencaoNotice count={pendingQuestionsCount} />
      <FilterBar />

      {/* Progresso */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Questão {index + 1} de {active.length}
        </span>
        <div className="flex items-center gap-2">
          {answeredCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {correctCount}/{answeredCount} certas
            </span>
          )}
          {q!.difficulty && (
            <Badge variant="outline" className={cn("text-[10px]", DIFFICULTY_CLASS[q!.difficulty] ?? "")}>
              {DIFFICULTY_LABEL[q!.difficulty] ?? q!.difficulty}
            </Badge>
          )}
        </div>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(index / active.length) * 100}%` }}
        />
      </div>

      {/* Enunciado */}
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground">{q!.statement}</p>
      {q!.images?.length > 0 && (
        <div className="space-y-2">
          {q!.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="max-h-72 w-full rounded-lg border object-contain" />
          ))}
        </div>
      )}

      {/* Alternativas */}
      <div className="space-y-2">
        {q!.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => !confirmed && setSelectedId(opt.id)}
            disabled={confirmed}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
              optionClass(opt.id),
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                letterClass(opt.id),
              )}
            >
              {opt.letter}
            </span>
            <span className="flex-1 text-[14px] leading-snug">{opt.text}</span>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Confirmar */}
      {selectedId && !confirmed && (
        <Button className="w-full" onClick={handleConfirm} disabled={isPending}>
          {isPending ? "Verificando…" : "Confirmar resposta"}
        </Button>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {confirmed && result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3",
                result.isCorrect ? "border-green-500/30 bg-green-500/12" : "border-red-500/30 bg-red-500/12",
              )}
            >
              {result.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-red-500" />
              )}
              <p
                className={cn(
                  "flex items-center gap-1.5 font-semibold",
                  result.isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400",
                )}
              >
                {result.isCorrect ? "Correto!" : "Errado"}
                <span className="flex items-center gap-0.5 text-sm">
                  <Zap className="h-3.5 w-3.5 fill-current" />+{result.isCorrect ? 10 : 2} XP
                </span>
              </p>
            </div>

            {result.explanation && (
              <div className="overflow-hidden rounded-xl border">
                <button
                  onClick={() => setExplanationOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/40"
                >
                  <span>Explicação</span>
                  <ChevronDown
                    className={cn("h-4 w-4 text-muted-foreground transition-transform", explanationOpen && "rotate-180")}
                  />
                </button>
                {explanationOpen && (
                  <div className="border-t px-4 pb-4 pt-2 text-[14px] leading-relaxed text-muted-foreground">
                    {result.explanation}
                  </div>
                )}
              </div>
            )}

            <Button className="w-full" onClick={next}>
              {index + 1 < active.length ? "Próxima questão" : "Ver resultado"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
