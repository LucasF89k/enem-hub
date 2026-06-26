"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { answerQuestion } from "@/app/actions/question.actions"
import { toggleFavorite } from "@/app/actions/favorites.actions"
import { FavoriteType } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Heart,
  BookOpen,
  ChevronDown,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AchievementToast } from "@/components/achievements/AchievementToast"
import type { NewAchievement } from "@/lib/achievements"

interface QuestionOption {
  id: string
  letter: string
  text: string
}

interface QuestionData {
  id: string
  statement: string
  images: string[]
  options: QuestionOption[]
  explanation: string
  correctId: string | null
  areaSlug: string | null
  topicPath: string | null
}

interface Props {
  question: QuestionData
  initialIsFav: boolean
}

const AREA_LABEL: Record<string, string> = {
  "ciencias-natureza": "Ciências da Natureza",
  "ciencias-humanas": "Ciências Humanas",
  linguagens: "Linguagens",
  matematica: "Matemática",
}

export function QuestionResolver({ question, initialIsFav }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<{
    isCorrect: boolean
    correctId: string
    explanation: string
  } | null>(null)
  const [timeSeconds, setTimeSeconds] = useState(0)
  const [isFav, setIsFav] = useState(initialIsFav)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isFavPending, startFavTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [newAchievements, setNewAchievements] = useState<NewAchievement[]>([])

  const startTimeRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeSeconds(Math.round((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const mins = Math.floor(timeSeconds / 60)
  const secs = timeSeconds % 60
  const timerText = `${mins}:${String(secs).padStart(2, "0")}`

  function handleSelect(optionId: string) {
    if (confirmed) return
    setSelectedId(optionId)
  }

  async function handleConfirm() {
    if (!selectedId || confirmed || isPending) return
    if (timerRef.current) clearInterval(timerRef.current)

    startTransition(async () => {
      try {
        const res = await answerQuestion(question.id, selectedId, timeSeconds)
        setResult(res)
        setConfirmed(true)
        setExplanationOpen(!res.isCorrect)
        if (res.newAchievements.length) setNewAchievements(res.newAchievements)
      } catch {
        setError("Erro ao registrar resposta. Tente novamente.")
        // restart timer
        timerRef.current = setInterval(() => {
          setTimeSeconds(Math.round((Date.now() - startTimeRef.current) / 1000))
        }, 1000)
      }
    })
  }

  function handleToggleFav() {
    startFavTransition(async () => {
      await toggleFavorite(FavoriteType.QUESTION, question.id)
      setIsFav((prev) => !prev)
    })
  }

  function getOptionClass(optId: string) {
    if (!confirmed) {
      return optId === selectedId
        ? "border-primary bg-primary/10 ring-1 ring-primary ring-offset-0"
        : "border-border bg-card hover:bg-muted/50 active:scale-[0.99] cursor-pointer"
    }
    // confirmed state
    if (optId === result?.correctId) {
      return "border-green-500 bg-green-500/12 ring-1 ring-green-500/50"
    }
    if (optId === selectedId && !result?.isCorrect) {
      return "border-red-500 bg-red-500/12 ring-1 ring-red-500/50"
    }
    return "border-border bg-card opacity-50"
  }

  function getLetterClass(optId: string) {
    if (!confirmed) {
      return optId === selectedId
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground"
    }
    if (optId === result?.correctId) return "bg-green-500 text-white"
    if (optId === selectedId && !result?.isCorrect) return "bg-red-500 text-white"
    return "bg-muted text-muted-foreground"
  }

  const areaLabel = question.areaSlug ? AREA_LABEL[question.areaSlug] : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
      <AchievementToast achievements={newAchievements} />
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href="/questions">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Questões</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {areaLabel && (
            <span className="hidden sm:inline text-xs text-muted-foreground">{areaLabel}</span>
          )}
          <span
            className={cn(
              "tabular-nums text-sm font-mono px-2.5 py-1 rounded-lg border",
              confirmed ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {timerText}
          </span>
        </div>

        <button
          onClick={handleToggleFav}
          disabled={isFavPending}
          className={cn(
            "flex items-center justify-center h-9 w-9 rounded-lg border transition-colors",
            isFav
              ? "border-red-400/50 bg-red-400/10 text-red-500"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
        </button>
      </div>

      {/* Question statement */}
      <div className="mb-6">
        <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-line">
          {question.statement}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            disabled={confirmed}
            className={cn(
              "w-full flex items-start gap-3 rounded-xl border p-3 min-h-14 text-left transition-all duration-150",
              getOptionClass(opt.id)
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors mt-0.5",
                getLetterClass(opt.id)
              )}
            >
              {opt.letter}
            </span>
            <span className="text-[14px] leading-snug flex-1">{opt.text}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive mb-4">{error}</p>
      )}

      {/* Confirm button */}
      <AnimatePresence>
        {selectedId && !confirmed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? "Verificando…" : "Confirmar resposta"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback + explanation (after confirm) */}
      <AnimatePresence>
        {confirmed && result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Result banner */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3.5 border",
                result.isCorrect
                  ? "bg-green-500/12 border-green-500/30"
                  : "bg-red-500/12 border-red-500/30"
              )}
            >
              {result.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              )}
              <div className="flex-1">
                {result.isCorrect ? (
                  <p className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                    Correto!
                    <span className="flex items-center gap-0.5 text-sm">
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      +10 XP
                    </span>
                  </p>
                ) : (
                  <p className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    Errado
                    <span className="flex items-center gap-0.5 text-sm">
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      +2 XP
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Explanation accordion */}
            {result.explanation && (
              <div className="rounded-xl border overflow-hidden">
                <button
                  onClick={() => setExplanationOpen((o) => !o)}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold hover:bg-muted/40 transition-colors"
                >
                  <span>Explicação</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      explanationOpen && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {explanationOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="px-4 pb-4 pt-1 text-[14px] leading-relaxed text-muted-foreground border-t">
                        {result.explanation}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    "gap-2 transition-colors",
                    isFav && "border-red-400/50 bg-red-400/10 text-red-500 hover:bg-red-400/20"
                  )}
                  onClick={handleToggleFav}
                  disabled={isFavPending}
                >
                  <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
                  {isFav ? "Favoritada" : "Favoritar"}
                </Button>

                {question.topicPath ? (
                  <Button asChild variant="outline" className="gap-2">
                    <Link href={question.topicPath}>
                      <BookOpen className="h-4 w-4" />
                      Ver teoria
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="gap-2" disabled>
                    <BookOpen className="h-4 w-4" />
                    Ver teoria
                  </Button>
                )}
              </div>

              <Button asChild className="w-full">
                <Link href="/questions">Voltar às questões</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
