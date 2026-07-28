import { db } from "@/lib/db"
import { addDays, startOfDay } from "date-fns"
import { detectTrail, getTrailConfig, type TrailType } from "@/lib/trail"

export interface GeneratePlanParams {
  userId: string
  startDate: Date
  daysCount: number
  dailyGoalMinutes: number
  weekDays: number[]
  /** Disciplinas (nomes) a priorizar — coletadas na entrevista do Mentor. */
  focusDisciplines?: string[]
  /** Ênfase do plano: mais teoria, equilibrado ou mais questões. */
  balance?: "teoria" | "equilibrado" | "questoes"
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
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
  const { userId, startDate, daysCount, dailyGoalMinutes, weekDays, focusDisciplines, balance } =
    params
  const focusNorm = (focusDisciplines ?? []).map(norm).filter(Boolean)

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
      let score = t.frequency * 0.4 + errorRate * 0.4 + t.importance * 0.2
      // Prioriza disciplinas escolhidas na entrevista do Mentor
      if (focusNorm.length > 0) {
        const disc = norm(t.discipline?.name ?? "")
        const area = norm(t.discipline?.area?.name ?? "")
        if (focusNorm.some((f) => disc.includes(f) || f.includes(disc) || area.includes(f))) {
          score += 1
        }
      }
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

  // Um dia inteiro por semana só para simulado (dia de prova, estilo ENEM).
  // Usa o último dia de estudo da semana; só reserva se houver >= 3 dias/semana.
  const simuladoWeekday = weekDays.length >= 3 ? Math.max(...weekDays) : -1

  for (let d = 0; d < daysCount; d++) {
    const day = addDays(startOfDay(startDate), d)
    // getUTCDay(): startDate is UTC midnight; getDay() would use local tz and give wrong weekday
    if (!weekDays.includes(day.getUTCDay())) continue

    // Dia de prova: só um simulado completo cronometrado, nada mais.
    if (day.getUTCDay() === simuladoWeekday) {
      itemsToCreate.push({
        planId: plan.id,
        topicId: null,
        title: "Simulado completo — dia de prova",
        description: "Prova cronometrada no estilo ENEM (~5h30). Simule as condições reais.",
        type: "SIMULADO",
        scheduledAt: day,
        duration: 330,
        priority: 1,
      })
      continue
    }

    let slot = 0
    const alloc = {
      flashcards: flashcardsMins(dailyGoalMinutes),
      simulado: simuladosMins(dailyGoalMinutes),
      content: contentMins(dailyGoalMinutes),
      questions: questionsMins(dailyGoalMinutes),
    }
    // Ênfase escolhida na entrevista: desloca ~35% entre teoria e questões
    if (balance === "teoria") {
      const shift = Math.floor(alloc.questions * 0.35)
      alloc.questions -= shift
      alloc.content += shift
    } else if (balance === "questoes") {
      const shift = Math.floor(alloc.content * 0.35)
      alloc.content -= shift
      alloc.questions += shift
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

    // 2. Content + questions blocks from scored topics
    // (o simulado agora tem dia próprio; sua fatia de tempo vira teoria/questões)
    let contentBudget = alloc.content + Math.ceil(alloc.simulado / 2)
    let questionBudget = alloc.questions + Math.floor(alloc.simulado / 2)

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
