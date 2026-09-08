"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { saveAnswer, toggleMarkForReview, finalizeSimulado } from "@/app/actions/simulado.actions"
import { Flag, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Loader2, Menu, X } from "lucide-react"

interface Option {
  id: string
  letter: string
  text: string
}

interface ExamQuestion {
  id: string
  statement: string
  images: string[]
  areaSlug?: string | null
  year?: number | null
  source?: string | null
  order: number
  options: Option[]
}

interface SimuladoResolverProps {
  simuladoId: string
  attemptId: string
  title: string
  initialTimeLeft: number
  questions: ExamQuestion[]
  initialAnswers: Record<string, { selectedId: string | null; markedForReview: boolean }>
}

const AREA_LABEL: Record<string, string> = {
  "ciencias-natureza": "CN",
  "ciencias-humanas": "CH",
  linguagens: "LC",
  matematica: "MT",
}

const AREA_COLOR: Record<string, string> = {
  "ciencias-natureza": "bg-green-500/20 text-green-700 dark:text-green-400",
  "ciencias-humanas": "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  linguagens: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  matematica: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function SimuladoResolver({
  simuladoId,
  attemptId,
  title,
  initialTimeLeft,
  questions,
  initialAnswers,
}: SimuladoResolverProps) {
  const router = useRouter()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft)
  const [answers, setAnswers] = useState<Record<string, { selectedId: string | null; markedForReview: boolean }>>(initialAnswers)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const [isFinalizing, startFinalize] = useTransition()
  const [isSaving, startSave] = useTransition()

  const startTimeRef = useRef(Date.now())
  const questionStartRef = useRef(Date.now())
  const finalizedRef = useRef(false)

  const currentQuestion = questions[currentIdx]
  const totalAnswered = Object.values(answers).filter((a) => a.selectedId !== null).length
  const totalMarked = Object.values(answers).filter((a) => a.markedForReview).length

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          handleAutoFinalize()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAutoFinalize() {
    if (finalizedRef.current) return
    finalizedRef.current = true
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
    startFinalize(async () => {
      await finalizeSimulado(attemptId, totalTime)
      router.push(`/simulados/${simuladoId}/${attemptId}/result`)
    })
  }

  function handleSelectOption(optionId: string) {
    if (isFinalizing) return
    const questionId = currentQuestion.id
    const prev = answers[questionId]
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000)

    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedId: optionId },
    }))

    startSave(async () => {
      await saveAnswer(attemptId, questionId, optionId, timeSpent)
    })
  }

  function handleToggleMark() {
    const questionId = currentQuestion.id
    const current = answers[questionId]?.markedForReview ?? false
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? { selectedId: null }), markedForReview: !current },
    }))
    startSave(async () => {
      await toggleMarkForReview(attemptId, questionId)
    })
  }

  function goToQuestion(idx: number) {
    questionStartRef.current = Date.now()
    setCurrentIdx(idx)
    setShowNav(false)
  }

  function handleFinalize() {
    if (finalizedRef.current) return
    finalizedRef.current = true
    setShowConfirmDialog(false)
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
    startFinalize(async () => {
      await finalizeSimulado(attemptId, totalTime)
      router.push(`/simulados/${simuladoId}/${attemptId}/result`)
    })
  }

  const isMarked = answers[currentQuestion?.id]?.markedForReview ?? false
  const selectedId = answers[currentQuestion?.id]?.selectedId ?? null

  const timerColor =
    timeLeft < 300
      ? "text-red-500"
      : timeLeft < 900
      ? "text-yellow-500"
      : "text-foreground"

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b bg-background/95 backdrop-blur px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            className="md:hidden p-1.5 rounded hover:bg-muted"
            onClick={() => setShowNav(!showNav)}
          >
            {showNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <span className="font-semibold text-sm truncate hidden sm:block">{title}</span>
          <span className="text-xs text-muted-foreground">
            {totalAnswered}/{questions.length} respondidas
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <span className={cn("font-mono text-sm font-bold tabular-nums", timerColor)}>
            {formatTime(timeLeft)}
          </span>
          <Button
            size="sm"
            onClick={() => setShowConfirmDialog(true)}
            disabled={isFinalizing}
            className="gap-1"
          >
            {isFinalizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Finalizar</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav (desktop) */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 border-r overflow-y-auto p-3 gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-1">
            Questões
          </p>
          <div className="grid grid-cols-5 gap-1">
            {questions.map((q, i) => {
              const ans = answers[q.id]
              const isAnswered = ans?.selectedId !== null && ans?.selectedId !== undefined
              const isReview = ans?.markedForReview
              const isCurrent = i === currentIdx
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(i)}
                  className={cn(
                    "rounded text-xs font-medium h-7 w-full transition-colors",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isReview
                      ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/40"
                      : isAnswered
                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="mt-3 space-y-1 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded bg-green-500/30" />
              Respondida
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded border border-yellow-500/50 bg-yellow-500/20" />
              Marcada
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded bg-muted" />
              Não respondida
            </div>
          </div>
        </aside>

        {/* Mobile nav overlay */}
        {showNav && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowNav(false)}
          >
            <div
              className="absolute left-0 top-14 bottom-0 w-64 bg-background border-r p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Questões
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {questions.map((q, i) => {
                  const ans = answers[q.id]
                  const isAnswered = ans?.selectedId !== null && ans?.selectedId !== undefined
                  const isReview = ans?.markedForReview
                  const isCurrent = i === currentIdx
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(i)}
                      className={cn(
                        "rounded text-xs font-medium h-8 transition-colors",
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isReview
                          ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/40"
                          : isAnswered
                          ? "bg-green-500/20 text-green-700 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Question area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
          {currentQuestion && (
            <div className="space-y-5">
              {/* Question header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Questão {currentIdx + 1}/{questions.length}
                  </span>
                  {currentQuestion.areaSlug && (
                    <span
                      className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded-full",
                        AREA_COLOR[currentQuestion.areaSlug]
                      )}
                    >
                      {AREA_LABEL[currentQuestion.areaSlug] ?? currentQuestion.areaSlug}
                    </span>
                  )}
                  {currentQuestion.source && (
                    <span className="text-[11px] text-muted-foreground">
                      {currentQuestion.source}
                      {currentQuestion.year ? ` ${currentQuestion.year}` : ""}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleToggleMark}
                  className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors",
                    isMarked
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {isMarked ? "Marcada" : "Marcar"}
                </button>
              </div>

              {/* Statement */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {currentQuestion.statement}
              </div>

              {currentQuestion.images.length > 0 && (
                <div className="space-y-2">
                  {currentQuestion.images.map((url, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={idx}
                      src={url}
                      alt={`Imagem ${idx + 1} da questão`}
                      className="rounded-lg max-h-64 object-contain"
                    />
                  ))}
                </div>
              )}

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedId === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={isFinalizing}
                      className={cn(
                        "w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card hover:bg-muted/40 text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {opt.letter}
                      </span>
                      <span className="leading-relaxed">{opt.text}</span>
                    </button>
                  )
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToQuestion(currentIdx - 1)}
                  disabled={currentIdx === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                {currentIdx < questions.length - 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToQuestion(currentIdx + 1)}
                    className="gap-1"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={isFinalizing}
                    className="gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finalizar
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirm finalize dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar simulado?</DialogTitle>
            <DialogDescription>
              Você respondeu {totalAnswered} de {questions.length} questões.
              {totalAnswered < questions.length && (
                <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
                  {questions.length - totalAnswered} questão(ões) sem resposta.
                </span>
              )}
              {totalMarked > 0 && (
                <span className="block mt-1">
                  {totalMarked} questão(ões) marcada(s) para revisão.
                </span>
              )}
              <span className="block mt-2">Esta ação não pode ser desfeita.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Voltar
            </Button>
            <Button onClick={handleFinalize} disabled={isFinalizing} className="gap-1">
              {isFinalizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalizing overlay */}
      {isFinalizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Calculando resultado…</p>
          </div>
        </div>
      )}
    </div>
  )
}
