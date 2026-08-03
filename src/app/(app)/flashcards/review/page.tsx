import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { FlashcardReviewScreen, type ReviewCard } from "./flashcard-review-screen"
import {
  FlashcardFilterScreen,
  type FilterCounts,
  type FilterKey,
} from "./flashcard-filter-screen"

export const metadata = { title: "Revisão" }

const SESSION_CAP = 20

/** Embaralha (Fisher-Yates) sem mutar o original. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const VALID: FilterKey[] = ["revisar", "novos", "errei", "dificil", "bom", "facil", "todos"]

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id
  const now = new Date()

  const { deckId, topicId, disciplineId, filter } = await searchParams
  const deckFilter = typeof deckId === "string" ? deckId : undefined
  const topicFilter = typeof topicId === "string" ? topicId : undefined
  const disciplineFilter = typeof disciplineId === "string" ? disciplineId : undefined
  const filterKey = typeof filter === "string" && (VALID as string[]).includes(filter)
    ? (filter as FilterKey)
    : undefined

  const hasScope = deckFilter || topicFilter || disciplineFilter
  const flashcardWhere = {
    ...(deckFilter ? { deckId: deckFilter } : {}),
    ...(topicFilter ? { topicId: topicFilter } : {}),
    ...(disciplineFilter ? { topic: { disciplineId: disciplineFilter } } : {}),
    ...(!hasScope ? { deck: { isPublic: true } } : {}),
  }

  // Query string do escopo (para os links da tela de filtro)
  const scopeQuery =
    [
      deckFilter ? `deckId=${deckFilter}` : "",
      topicFilter ? `topicId=${topicFilter}` : "",
      disciplineFilter ? `disciplineId=${disciplineFilter}` : "",
    ]
      .filter(Boolean)
      .join("&") + (deckFilter || topicFilter || disciplineFilter ? "&" : "")

  // Todos os cards do escopo + última avaliação de cada um
  const cards = await db.flashcard.findMany({
    where: flashcardWhere,
    select: { id: true, front: true, back: true, type: true },
    orderBy: { createdAt: "asc" },
    take: 1000,
  })
  const ids = cards.map((c) => c.id)

  const reviews = ids.length
    ? await db.flashcardReview.findMany({
        where: { userId, flashcardId: { in: ids } },
        orderBy: { reviewedAt: "desc" },
        select: { flashcardId: true, rating: true, nextReview: true },
      })
    : []
  const latest = new Map<string, { rating: number; due: boolean }>()
  for (const r of reviews) {
    if (!latest.has(r.flashcardId))
      latest.set(r.flashcardId, { rating: r.rating, due: r.nextReview <= now })
  }

  // Contagem por categoria
  const counts: FilterCounts = {
    revisar: 0, novos: 0, errei: 0, dificil: 0, bom: 0, facil: 0, todos: cards.length,
  }
  for (const c of cards) {
    const lr = latest.get(c.id)
    if (!lr) {
      counts.novos++
      counts.revisar++
    } else {
      if (lr.rating === 1) counts.errei++
      else if (lr.rating === 2) counts.dificil++
      else if (lr.rating === 3) counts.bom++
      else if (lr.rating === 4) counts.facil++
      if (lr.due) counts.revisar++
    }
  }

  // Sem filtro escolhido → tela de filtro
  if (!filterKey) {
    if (cards.length === 0) redirect("/flashcards")
    return <FlashcardFilterScreen scopeQuery={scopeQuery} counts={counts} />
  }

  // Seleciona 20 cards ALEATÓRIOS do filtro, sem repetir os já respondidos.
  // "revisar": prioriza os não respondidos (embaralhados); só completa com
  // vencidos se faltarem novos — assim você nunca cai nos mesmos de novo.
  const unanswered = cards.filter((c) => !latest.get(c.id))
  const pickByRating = (rating: number) => cards.filter((c) => latest.get(c.id)?.rating === rating)

  let pool: typeof cards
  switch (filterKey) {
    case "revisar": {
      const due = cards.filter((c) => latest.get(c.id)?.due)
      pool = [...shuffle(unanswered), ...shuffle(due)]
      break
    }
    case "novos": pool = shuffle(unanswered); break
    case "errei": pool = shuffle(pickByRating(1)); break
    case "dificil": pool = shuffle(pickByRating(2)); break
    case "bom": pool = shuffle(pickByRating(3)); break
    case "facil": pool = shuffle(pickByRating(4)); break
    case "todos": pool = shuffle(cards); break
    default: pool = shuffle(unanswered)
  }

  const reviewCards: ReviewCard[] = pool
    .slice(0, SESSION_CAP)
    .map((c) => ({ id: c.id, front: c.front, back: c.back, type: c.type as string }))

  // Filtro vazio → volta pra tela de filtro com aviso
  if (reviewCards.length === 0) {
    return <FlashcardFilterScreen scopeQuery={scopeQuery} counts={counts} emptyNote />
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)]">
      <FlashcardReviewScreen cards={reviewCards} chooserHref={`/flashcards/review?${scopeQuery}`} />
    </div>
  )
}
