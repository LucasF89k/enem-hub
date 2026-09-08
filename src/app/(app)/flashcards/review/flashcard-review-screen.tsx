"use client"

import { useState, useTransition, useEffect } from "react"
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion"
import { submitFlashcardReview, recordFlashcardSessionTime } from "@/app/actions/flashcard.actions"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Star, Zap, RotateCcw, Home, Info, Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import Link from "next/link"
import confetti from "canvas-confetti"

/** Legenda dos 4 botões: explica principalmente a diferença entre Bom e Fácil. */
function RatingLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Info className="h-3.5 w-3.5" />
          O que é cada opção?
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-72 text-xs">
        <p className="mb-2 font-semibold">Como avaliar</p>
        <ul className="space-y-1.5 text-muted-foreground">
          <li><span className="font-semibold text-red-500">Errei</span>: não lembrei (volta logo).</li>
          <li><span className="font-semibold text-orange-500">Difícil</span>: acertei com muito esforço.</li>
          <li><span className="font-semibold text-blue-500">Bom</span>: acertei, mas <b className="text-foreground">ainda vale revisar de novo</b> em breve.</li>
          <li><span className="font-semibold text-green-500">Fácil</span>: acertei tranquilo, já domino (espaça bastante).</li>
        </ul>
      </PopoverContent>
    </Popover>
  )
}

export interface ReviewCard {
  id: string
  front: string
  back: string
  type: string
}

interface Stats {
  again: number
  hard: number
  good: number
  easy: number
}

const SWIPE_THRESHOLD = 80

export function FlashcardReviewScreen({
  cards,
  chooserHref,
}: {
  cards: ReviewCard[]
  chooserHref?: string
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [stats, setStats] = useState<Stats>({ again: 0, hard: 0, good: 0, easy: 0 })
  const [totalXP, setTotalXP] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [startTime] = useState(Date.now())
  const [exitDir, setExitDir] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Drag motion value for swipe visual feedback
  const x = useMotionValue(0)
  const cardRotate = useTransform(x, [-200, 0, 200], [-6, 0, 6])
  const againOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20, 0], [1, 0.4, 0])
  const easyOpacity = useTransform(x, [0, 20, SWIPE_THRESHOLD], [0, 0.4, 1])

  useEffect(() => {
    if (isComplete) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } })
      // Grava o tempo real da sessão (relógio do dispositivo), uma única vez.
      const elapsedSec = Math.round((Date.now() - startTime) / 1000)
      recordFlashcardSessionTime(elapsedSec).catch(() => {})
    }
  }, [isComplete, startTime])

  const currentCard = cards[currentIndex]
  const progressPct = (currentIndex / cards.length) * 100
  const correct = stats.good + stats.easy
  const incorrect = stats.again + stats.hard

  function handleFlip() {
    setIsFlipped((prev) => !prev)
  }

  function handleRating(rating: 1 | 2 | 3 | 4) {
    // Direction: Easy → right, Again → left, Good/Hard → center
    setExitDir(rating === 4 ? 350 : rating === 1 ? -350 : rating === 3 ? 80 : -80)

    setStats((prev) => ({
      ...prev,
      again: prev.again + (rating === 1 ? 1 : 0),
      hard: prev.hard + (rating === 2 ? 1 : 0),
      good: prev.good + (rating === 3 ? 1 : 0),
      easy: prev.easy + (rating === 4 ? 1 : 0),
    }))

    startTransition(async () => {
      try {
        const result = await submitFlashcardReview(currentCard.id, rating)
        setTotalXP((prev) => prev + result.xpEarned)
      } catch {
        // optimistic update already applied
      }
    })

    if (currentIndex + 1 >= cards.length) {
      setIsComplete(true)
    } else {
      x.set(0)
      setCurrentIndex((prev) => prev + 1)
      setIsFlipped(false)
    }
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      x.set(0)
      handleRating(4)
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      x.set(0)
      handleRating(1)
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 })
    }
  }

  /* Completion screen */
  if (isComplete) {
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    const total = stats.again + stats.hard + stats.good + stats.easy

    return (
      <div className="flex flex-col items-center gap-6 px-6 py-12 max-w-sm mx-auto text-center">
        <div className="rounded-full bg-accent/10 p-4">
          <Star className="h-10 w-10 text-accent fill-accent" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Sessão concluída!</h2>
          <p className="text-sm text-muted-foreground">
            {total} card{total !== 1 ? "s" : ""} revisado{total !== 1 ? "s" : ""} em{" "}
            {mins > 0 ? `${mins}m ` : ""}{secs}s
          </p>
        </div>

        {/* XP badge */}
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">+{totalXP} XP</span>
        </div>

        {/* Stats breakdown */}
        <div className="grid grid-cols-4 gap-2 w-full">
          {([
            { label: "Errei", count: stats.again, color: "text-red-500" },
            { label: "Difícil", count: stats.hard, color: "text-orange-500" },
            { label: "Bom", count: stats.good, color: "text-blue-500" },
            { label: "Fácil", count: stats.easy, color: "text-green-500" },
          ] as const).map(({ label, count, color }) => (
            <div key={label} className="flex flex-col items-center rounded-xl border bg-card p-2 gap-0.5">
              <span className={cn("text-xl font-bold", color)}>{count}</span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 w-full">
          {chooserHref && (
            <Button asChild className="w-full">
              <Link href={chooserHref}>
                <Filter className="mr-2 h-4 w-4" />
                Revisar outro filtro
              </Link>
            </Button>
          )}
          <Button asChild variant={chooserHref ? "outline" : "default"} className="w-full">
            <Link href="/flashcards">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/study">Ver conteúdo</Link>
          </Button>
        </div>
      </div>
    )
  }

  /* Review screen */
  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] max-w-lg mx-auto px-4 py-4 gap-4">
      {/* Progress bar + stats */}
      <div className="space-y-1 shrink-0">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-accent" />
            {correct}
          </span>
          <span className="tabular-nums">
            {currentIndex + 1} / {cards.length}
          </span>
          <span className="flex items-center gap-1">
            {incorrect}
            <X className="h-3 w-3 text-destructive" />
          </span>
        </div>
        <Progress value={progressPct} className="h-1.5" />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="relative w-full max-w-sm" style={{ height: "300px" }}>
          {/* Swipe indicators */}
          <motion.div
            style={{ opacity: againOpacity }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
          >
            <div className="rounded-full border-2 border-red-500 bg-red-500/10 px-3 py-1">
              <span className="text-sm font-bold text-red-500">Errei</span>
            </div>
          </motion.div>

          <motion.div
            style={{ opacity: easyOpacity }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
          >
            <div className="rounded-full border-2 border-green-500 bg-green-500/10 px-3 py-1">
              <span className="text-sm font-bold text-green-500">Fácil</span>
            </div>
          </motion.div>

          {/* Animated card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: 40, opacity: 0, scale: 0.96 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: exitDir, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0"
            >
              {/* Draggable wrapper */}
              <motion.div
                style={{ x, rotate: cardRotate }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.45, right: 0.45 }}
                onDragEnd={handleDragEnd}
                onTap={handleFlip}
                className="h-full cursor-grab active:cursor-grabbing select-none"
                whileTap={{ scale: 0.99 }}
              >
                {/* 3D flip container */}
                <div className="h-full" style={{ perspective: "1200px" }}>
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="relative h-full"
                  >
                    {/* Front */}
                    <div
                      style={{ backfaceVisibility: "hidden" }}
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-card p-6 shadow-md"
                    >
                      <Badge variant="secondary" className="mb-4 text-xs uppercase tracking-wide">
                        {currentCard.type}
                      </Badge>
                      <p
                        className={cn(
                          "text-center text-base leading-relaxed",
                          currentCard.type === "FORMULA" && "font-mono text-lg"
                        )}
                      >
                        {currentCard.type === "CLOZE"
                          ? currentCard.front.replace(/\{\{([^}]+)\}\}/g, "____")
                          : currentCard.front}
                      </p>
                      <p className="mt-5 text-xs text-muted-foreground">
                        Toque para ver a resposta
                      </p>
                    </div>

                    {/* Back */}
                    <div
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-md"
                    >
                      <p
                        className={cn(
                          "text-center text-base leading-relaxed",
                          currentCard.type === "FORMULA" && "font-mono text-lg"
                        )}
                      >
                        {currentCard.back}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Swipe hint (before flip) */}
        {!isFlipped && (
          <p className="text-xs text-muted-foreground shrink-0">
            ← Errei &nbsp;·&nbsp; Deslize para avaliar &nbsp;·&nbsp; Fácil →
          </p>
        )}
      </div>

      {/* Legenda (visível após virar) */}
      <div
        className={cn(
          "flex justify-center shrink-0 transition-opacity",
          isFlipped ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <RatingLegend />
      </div>

      {/* Rating buttons, visible only after flip */}
      <div
        className={cn(
          "grid grid-cols-4 gap-2 pb-2 shrink-0 transition-all duration-200",
          isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <Button
          variant="outline"
          className="h-14 flex-col gap-0.5 border-red-500/40 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
          onClick={() => handleRating(1)}
          disabled={isPending}
        >
          <RotateCcw className="h-3.5 w-3.5 mb-0.5" />
          <span className="text-xs font-semibold">Errei</span>
        </Button>

        <Button
          variant="outline"
          className="h-14 flex-col gap-0.5 border-orange-500/40 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400"
          onClick={() => handleRating(2)}
          disabled={isPending}
        >
          <span className="text-lg leading-none">😓</span>
          <span className="text-xs font-semibold">Difícil</span>
        </Button>

        <Button
          variant="outline"
          className="h-14 flex-col gap-0.5 border-blue-500/40 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
          onClick={() => handleRating(3)}
          disabled={isPending}
        >
          <span className="text-lg leading-none">👍</span>
          <span className="text-xs font-semibold">Bom</span>
        </Button>

        <Button
          variant="outline"
          className="h-14 flex-col gap-0.5 border-green-500/40 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400"
          onClick={() => handleRating(4)}
          disabled={isPending}
        >
          <Zap className="h-3.5 w-3.5 mb-0.5 fill-current" />
          <span className="text-xs font-semibold">Fácil</span>
        </Button>
      </div>
    </div>
  )
}
