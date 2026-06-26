import { db } from "@/lib/db"
import { addDays, startOfDay } from "date-fns"
import { detectTrail, getTrailConfig, type TrailType } from "@/lib/trail"

export interface GeneratePlanParams {
  userId: string
  startDate: Date
  daysCount: number
  dailyGoalMinutes: number
  weekDays: number[]
}

/**
 * Syncs the trail field in UserProfile based on the current examDate.
 * Call this whenever examDate changes or before generating a plan.
 */
export async function syncTrail(userId: string): Promise<TrailType> {
  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { examDate: true },
  })
  const trail = detectTrail(profile?.examDate)
  await db.userProfile.update({
    where: { userId },
    data: { trail },
  })
  return trail
}

export async function generateStudyPlan(params: GeneratePlanParams): Promise<string> {
  const { userId, startDate, daysCount, dailyGoalMinutes, weekDays } = params

  // Deactivate existing plan
  await db.studyPlan.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  })

  // Sync trail and fetch profile
  const trail = await syncTrail(userId)
  const trailConfig = getTrailConfig(trail)

  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { examDate: true },
  })

  const endDate = profile?.examDate ?? addDays(startDate, daysCount)

  const plan = await db.studyPlan.create({
    data: {
      userId,
      title: `Plano ENEM — ${trailConfig.label}`,
      startDate,
      endDate,
      dailyGoal: dailyGoalMinutes,
      weeklyGoal: dailyGoalMinutes * weekDays.length,
    },
    select: { id: true },
  })

  // Score topics: frequency×0.4 + errorRate×0.4 + importance×0.2
  const topics = await db.topic.findMany({
    include: {
      discipline: { include: { area: true } },
      _count: { select: { contents: true } },
    },
    orderBy: [{ importance: "desc" }, { frequency: "desc" }],
    take: 60,
  })

  const answered = await db.userQuestion.findMany({
    where: { userId },
    select: { isCorrect: true, question: { select: { topicId: true } } },
  })
  const perTopic: Record<string, { correct: number; total: number }> = {}
  for (const uq of answered) {
    const tid = uq.question.topicId ?? "__none"
    if (!perTopic[tid]) perTopic[tid] = { correct: 0, total: 0 }
    perTopic[tid].total++
    if (uq.isCorrect) perTopic[tid].correct++
  }
  const topicAccuracy: Record<string, number> = {}
  for (const [tid, s] of Object.entries(perTopic)) {
    topicAccuracy[tid] = s.total > 0 ? s.correct / s.total : 0.5
  }

  const pendingFlashcards = await db.flashcardReview.findMany({
    where: { userId, nextReview: { lte: new Date() } },
    select: { flashcard: { select: { topicId: true } } },
    distinct: ["flashcardId"],
    take: 100,
  })

  const scoredTopics = topics
    .map((t) => {
      const acc = topicAccuracy[t.id] ?? 0.5
      const errorRate = 1 - acc
      const score = t.frequency * 0.4 + errorRate * 0.4 + t.importance * 0.2
      return { topicId: t.id, score, name: t.name }
    })
    .sort((a, b) => b.score - a.score)

  // Trail-aware time allocation per day
  const { ratios, blockMinutes } = trailConfig
  const flashcardsMins = (v: number) =>
    Math.floor(v * ratios.flashcards)
  const simuladosMins = (v: number) =>
    Math.floor(v * ratios.simulados)
  const contentMins = (v: number) =>
    Math.floor(v * ratios.content)
  const questionsMins = (v: number) =>
    Math.floor(v * ratios.questions)

  type ItemPayload = {
    planId: string
    topicId: string | null
    title: string
    description: string | null
    type: "CONTENT" | "QUESTIONS" | "FLASHCARDS" | "SIMULADO"
    scheduledAt: Date
    duration: number
    priority: number
  }

  const itemsToCreate: ItemPayload[] = []
  let topicIdx = 0

  for (let d = 0; d < daysCount; d++) {
    const day = addDays(startOfDay(startDate), d)
    if (!weekDays.includes(day.getDay())) continue

    let slot = 0
    const alloc = {
      flashcards: flashcardsMins(dailyGoalMinutes),
      simulado: simuladosMins(dailyGoalMinutes),
      content: contentMins(dailyGoalMinutes),
      questions: questionsMins(dailyGoalMinutes),
    }

    // 1. Flashcard review block
    if (alloc.flashcards >= 10 && pendingFlashcards.length > 0) {
      itemsToCreate.push({
        planId: plan.id,
        topicId: null,
        title: "Revisão de flashcards",
        description: `${pendingFlashcards.length} cartões pendentes`,
        type: "FLASHCARDS",
        scheduledAt: new Date(day.getTime() + slot * 60 * 1000),
        duration: alloc.flashcards,
        priority: 2,
      })
      slot += alloc.flashcards
    }

    // 2. Simulado block (only on INTENSIVA/SPRINT, and only on some days)
    const doSimulado = (trail === "SPRINT" && d % 3 === 0) ||
      (trail === "INTENSIVA" && d % 5 === 0)
    if (doSimulado && alloc.simulado >= 15) {
      itemsToCreate.push({
        planId: plan.id,
        topicId: null,
        title: "Praticar simulado",
        description: "Resolva um simulado ou questões cronometradas",
        type: "SIMULADO",
        scheduledAt: new Date(day.getTime() + slot * 60 * 1000),
        duration: alloc.simulado,
        priority: 2,
      })
      slot += alloc.simulado
    }

    // 3. Content + questions blocks from scored topics
    let contentBudget = alloc.content + (doSimulado ? 0 : alloc.simulado)
    let questionBudget = alloc.questions

    while ((contentBudget >= 15 || questionBudget >= 15) && topicIdx < scoredTopics.length * 3) {
      const topic = scoredTopics[topicIdx % scoredTopics.length]

      if (contentBudget >= blockMinutes.content) {
        itemsToCreate.push({
          planId: plan.id,
          topicId: topic.topicId,
          title: `Teoria: ${topic.name}`,
          description: null,
          type: "CONTENT",
          scheduledAt: new Date(day.getTime() + slot * 60 * 1000),
          duration: blockMinutes.content,
          priority: 3,
        })
        slot += blockMinutes.content
        contentBudget -= blockMinutes.content
      } else if (contentBudget >= 15) {
        itemsToCreate.push({
          planId: plan.id,
          topicId: topic.topicId,
          title: `Teoria: ${topic.name}`,
          description: null,
          type: "CONTENT",
          scheduledAt: new Date(day.getTime() + slot * 60 * 1000),
          duration: contentBudget,
          priority: 3,
        })
        slot += contentBudget
        contentBudget = 0
      }

      if (questionBudget >= blockMinutes.questions) {
        itemsToCreate.push({
          planId: plan.id,
          topicId: topic.topicId,
          title: `Questões: ${topic.name}`,
          description: null,
          type: "QUESTIONS",
          scheduledAt: new Date(day.getTime() + slot * 60 * 1000),
          duration: blockMinutes.questions,
          priority: 3,
        })
        slot += blockMinutes.questions
        questionBudget -= blockMinutes.questions
      } else if (questionBudget >= 15) {
        itemsToCreate.push({
          planId: plan.id,
          topicId: topic.topicId,
          title: `Questões: ${topic.name}`,
          description: null,
          type: "QUESTIONS",
          scheduledAt: new Date(day.getTime() + slot * 60 * 1000),
          duration: questionBudget,
          priority: 3,
        })
        slot += questionBudget
        questionBudget = 0
      }

      topicIdx++
      if (contentBudget < 15 && questionBudget < 15) break
    }
  }

  if (itemsToCreate.length > 0) {
    await db.studyPlanItem.createMany({ data: itemsToCreate })
  }

  return plan.id
}
