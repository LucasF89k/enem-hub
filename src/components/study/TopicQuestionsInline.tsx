"use client"

import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, ChevronDown, Zap, RotateCcw, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { answerQuestion } from "@/app/actions/question.actions"

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

export function TopicQuestionsInline({ questions }: { questions: InlineQuestion[] }) {
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

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhuma questão neste tópico ainda</p>
      </div>
    )
  }

  const finished = index >= questions.length
  const q = finished ? null : questions[index]

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
        if (res.isCorrect) setCorrectCount((n) => n + 1)
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

  function restart() {
    setIndex(0)
    setSelectedId(null)
    setConfirmed(false)
    setResult(null)
    setExplanationOpen(false)
    setCorrectCount(0)
    setAnsweredCount(0)
    setStartTime(Date.now())
  }

  if (finished) {
    const pct = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0
    return (
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
        <Button onClick={restart} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Refazer
        </Button>
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
      {/* Progresso */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Questão {index + 1} de {questions.length}
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
          style={{ width: `${(index / questions.length) * 100}%` }}
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
              {index + 1 < questions.length ? "Próxima questão" : "Ver resultado"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
