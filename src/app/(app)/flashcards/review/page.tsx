import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { FlashcardReviewScreen, type ReviewCard } from "./flashcard-review-screen"

export const metadata = { title: "Revisão — ENEM Hub" }

const SESSION_LIMIT = 20

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id
  const now = new Date()

  const { deckId, topicId } = await searchParams
  const deckFilter = typeof deckId === "string" ? deckId : undefined
  const topicFilter = typeof topicId === "string" ? topicId : undefined

  // Build flashcard filter
  const flashcardWhere = {
    ...(deckFilter ? { deckId: deckFilter } : {}),
    ...(topicFilter ? { topicId: topicFilter } : {}),
    ...(!deckFilter && !topicFilter ? { deck: { isPublic: true } } : {}),
  }

  // Due reviews (already seen cards, now overdue)
  const dueReviews = await db.flashcardReview.findMany({
    where: {
      userId,
      nextReview: { lte: now },
      flashcard: flashcardWhere,
    },
    include: {
      flashcard: { select: { id: true, front: true, back: true, type: true } },
    },
    orderBy: { nextReview: "asc" },
    take: SESSION_LIMIT,
  })

  const dueIds = new Set(dueReviews.map((r) => r.flashcard.id))

  // New cards (never reviewed) to fill remaining slots
  const slotsLeft = SESSION_LIMIT - dueReviews.length
  const newCards =
    slotsLeft > 0
      ? await db.flashcard.findMany({
          where: {
            ...flashcardWhere,
            reviews: { none: { userId } },
          },
          select: { id: true, front: true, back: true, type: true },
          orderBy: { createdAt: "asc" },
          take: slotsLeft,
        })
      : []

  const reviewCards: ReviewCard[] = [
    ...dueReviews
      .filter((r) => dueIds.has(r.flashcard.id))
      .map((r) => ({
        id: r.flashcard.id,
        front: r.flashcard.front,
        back: r.flashcard.back,
        type: r.flashcard.type as string,
      })),
    ...newCards.map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      type: c.type as string,
    })),
  ]

  if (reviewCards.length === 0) {
    redirect("/flashcards")
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)]">
      <FlashcardReviewScreen cards={reviewCards} />
    </div>
  )
}
