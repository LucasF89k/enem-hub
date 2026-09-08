"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sm2 } from "@/lib/sm2"
import { awardXP, recordStudyActivity } from "@/lib/xp"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const PERSONAL_DECK = "Meus flashcards"
const MENTOR_DECK = "Flashcards do Mentor"

const mentorCardsSchema = z
  .array(
    z.object({
      front: z.string().trim().min(1).max(1000),
      back: z.string().trim().min(1).max(2000),
    }),
  )
  .min(1)
  .max(30)

/** Salva os flashcards gerados pelo Mentor no deck "Mentor", vinculados ao tópico atual. */
export async function saveMentorFlashcards(
  cards: { front: string; back: string }[],
  topicId?: string | null,
): Promise<{ success: boolean; count?: number; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autenticado" }

  const parsed = mentorCardsSchema.safeParse(cards)
  if (!parsed.success) return { success: false, error: "Flashcards inválidos" }

  // Valida o tópico (se veio) e vincula os cards a ele para ficarem organizados por matéria.
  let validTopicId: string | null = null
  if (topicId) {
    const t = await db.topic.findUnique({ where: { id: topicId }, select: { id: true } })
    validTopicId = t?.id ?? null
  }

  let deck = await db.flashcardDeck.findFirst({
    where: { userId: session.user.id, name: MENTOR_DECK },
    select: { id: true },
  })
  if (!deck) {
    deck = await db.flashcardDeck.create({
      data: {
        userId: session.user.id,
        name: MENTOR_DECK,
        description: "Flashcards gerados pelo Mentor",
        isPublic: false,
      },
      select: { id: true },
    })
  }

  await db.flashcard.createMany({
    data: parsed.data.map((c) => ({
      deckId: deck!.id,
      topicId: validTopicId,
      front: c.front,
      back: c.back,
      type: "BASIC" as const,
      tags: ["mentor"],
    })),
  })

  revalidatePath("/flashcards")
  return { success: true, count: parsed.data.length }
}

const createSchema = z.object({
  front: z.string().trim().min(1, "Escreva a frente do card").max(1000),
  back: z.string().trim().min(1, "Escreva o verso do card").max(2000),
  topicId: z.string().trim().min(1).optional().nullable(),
})

/** Garante (e retorna) o deck pessoal do usuário. */
async function getPersonalDeck(userId: string): Promise<string> {
  const existing = await db.flashcardDeck.findFirst({
    where: { userId, name: PERSONAL_DECK },
    select: { id: true },
  })
  if (existing) return existing.id
  const created = await db.flashcardDeck.create({
    data: { userId, name: PERSONAL_DECK, description: "Flashcards criados por você", isPublic: false },
    select: { id: true },
  })
  return created.id
}

/** Cria um flashcard próprio (opcionalmente vinculado a um tópico/matéria). */
export async function createFlashcard(input: {
  front: string
  back: string
  topicId?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autenticado" }

  const parsed = createSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }
  const { front, back, topicId } = parsed.data

  const deckId = await getPersonalDeck(session.user.id)
  await db.flashcard.create({
    data: {
      deckId,
      topicId: topicId || null,
      front,
      back,
      type: "BASIC",
      tags: ["próprio"],
    },
  })

  revalidatePath("/flashcards")
  return { success: true }
}

/** Exclui um flashcard próprio (somente do deck pessoal do usuário). */
export async function deleteOwnFlashcard(
  flashcardId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autenticado" }

  const card = await db.flashcard.findUnique({
    where: { id: flashcardId },
    select: { deck: { select: { userId: true, name: true } } },
  })
  if (!card || card.deck?.userId !== session.user.id || card.deck?.name !== PERSONAL_DECK) {
    return { success: false, error: "Você só pode excluir seus próprios flashcards" }
  }

  await db.flashcard.delete({ where: { id: flashcardId } })
  revalidatePath("/flashcards")
  return { success: true }
}

export async function submitFlashcardReview(
  flashcardId: string,
  rating: 1 | 2 | 3 | 4
): Promise<{ xpEarned: number }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const lastReview = await db.flashcardReview.findFirst({
    where: { userId, flashcardId },
    orderBy: { reviewedAt: "desc" },
  })

  const elapsedDays = lastReview
    ? Math.max(0, Math.floor((Date.now() - lastReview.reviewedAt.getTime()) / 86_400_000))
    : 0

  const result = sm2({
    rating,
    stability: lastReview?.stability ?? 1,
    difficulty: lastReview?.difficulty ?? 5,
    elapsed: elapsedDays,
  })

  await db.flashcardReview.create({
    data: {
      userId,
      flashcardId,
      rating,
      stability: result.stability,
      difficulty: result.difficulty,
      elapsed: elapsedDays,
      scheduled: result.scheduled,
      nextReview: result.nextReview,
      state: result.state,
    },
  })

  const xpEarned = await awardXP(userId, 5)
  // Registra apenas o streak (0 min); o tempo real da sessão é gravado no fim,
  // pelo relógio do dispositivo (recordFlashcardSessionTime). Antes contava 5 min
  // fixos por card, o que inflava o tempo de estudo.
  await recordStudyActivity(userId, 0, "FLASHCARDS")
  return { xpEarned }
}

/**
 * Registra o tempo REAL de uma sessão de flashcards, medido pelo relógio do
 * dispositivo (Date.now no cliente). Chamado uma vez ao concluir a sessão.
 */
export async function recordFlashcardSessionTime(seconds: number): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return
  const minutes = Math.min(180, Math.round((Number(seconds) || 0) / 60))
  if (minutes <= 0) return
  await recordStudyActivity(session.user.id, minutes, "FLASHCARDS")
}
