"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { awardXP, recordStudyActivity } from "@/lib/xp"
import { checkAchievements, type NewAchievement } from "@/lib/achievements"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function startSimulado(
  simuladoId: string,
  examDay: number | null = null,
  extraTime = false,
): Promise<{ attemptId: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  // Reaproveita tentativa em andamento do MESMO dia
  const existing = await db.userSimulado.findFirst({
    where: { userId, simuladoId, status: "IN_PROGRESS", examDay },
    select: { id: true },
  })
  if (existing) return { attemptId: existing.id }

  const attempt = await db.userSimulado.create({
    data: { userId, simuladoId, status: "IN_PROGRESS", examDay, extraTime },
    select: { id: true },
  })
  return { attemptId: attempt.id }
}

export async function startSimuladoAndRedirect(
  simuladoId: string,
  examDay: number | null = null,
  extraTime = false,
) {
  const { attemptId } = await startSimulado(simuladoId, examDay, extraTime)
  redirect(`/simulados/${simuladoId}/${attemptId}`)
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedId: string,
  timeSpent: number
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const attempt = await db.userSimulado.findFirst({
    where: { id: attemptId, userId, status: "IN_PROGRESS" },
    select: { id: true },
  })
  if (!attempt) return

  const question = await db.question.findUnique({
    where: { id: questionId },
    select: { correctId: true },
  })
  const isCorrect = question?.correctId === selectedId

  const existing = await db.userSimuladoAnswer.findFirst({
    where: { userSimuladoId: attemptId, questionId },
    select: { id: true },
  })

  if (existing) {
    await db.userSimuladoAnswer.update({
      where: { id: existing.id },
      data: { selectedId, isCorrect, timeSpent },
    })
  } else {
    await db.userSimuladoAnswer.create({
      data: { userSimuladoId: attemptId, questionId, selectedId, isCorrect, timeSpent },
    })
  }
}

export async function toggleMarkForReview(
  attemptId: string,
  questionId: string
): Promise<{ marked: boolean }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Confirma que a tentativa é DESTE usuário antes de mexer nela. Sem isso,
  // qualquer pessoa logada que soubesse um attemptId alheio conseguiria
  // marcar/desmarcar questões no simulado de outra (e criar uma resposta
  // orfa). As outras actions daqui (saveAnswer, finalizeSimulado) já cruzam
  // userId; esta era a única fora do padrão.
  const attempt = await db.userSimulado.findFirst({
    where: { id: attemptId, userId: session.user.id },
    select: { id: true },
  })
  if (!attempt) throw new Error("Unauthorized")

  const existing = await db.userSimuladoAnswer.findFirst({
    where: { userSimuladoId: attemptId, questionId },
    select: { id: true, markedForReview: true },
  })

  if (!existing) {
    await db.userSimuladoAnswer.create({
      data: {
        userSimuladoId: attemptId,
        questionId,
        selectedId: null,
        isCorrect: false,
        timeSpent: 0,
        markedForReview: true,
      },
    })
    return { marked: true }
  }

  await db.userSimuladoAnswer.update({
    where: { id: existing.id },
    data: { markedForReview: !existing.markedForReview },
  })
  return { marked: !existing.markedForReview }
}

export async function finalizeSimulado(
  attemptId: string,
  totalTimeSpent: number
): Promise<{ success: boolean; newAchievements: NewAchievement[] }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const attempt = await db.userSimulado.findFirst({
    where: { id: attemptId, userId },
    include: {
      answers: { select: { questionId: true, isCorrect: true, selectedId: true } },
      simulado: {
        include: {
          questions: {
            include: { question: { select: { areaSlug: true } } },
          },
        },
      },
    },
  })
  if (!attempt) throw new Error("Attempt not found")
  if (attempt.status === "COMPLETED") return { success: true, newAchievements: [] }

  // Map questionId → areaSlug
  const areaMap: Record<string, string> = {}
  for (const sq of attempt.simulado.questions) {
    areaMap[sq.questionId] = sq.question.areaSlug ?? "unknown"
  }

  // Count total per area from simulado questions
  type AreaStats = { correct: number; total: number }
  const areaStats: Record<string, AreaStats> = {}
  for (const sq of attempt.simulado.questions) {
    const area = areaMap[sq.questionId] ?? "unknown"
    if (!areaStats[area]) areaStats[area] = { correct: 0, total: 0 }
    areaStats[area].total++
  }

  // Count correct answers
  for (const ans of attempt.answers) {
    const area = areaMap[ans.questionId]
    if (!area || !areaStats[area]) continue
    if (ans.isCorrect && ans.selectedId) {
      areaStats[area].correct++
    }
  }

  function pct(s: AreaStats) {
    return s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
  }

  const scoreCN = pct(areaStats["ciencias-natureza"] ?? { correct: 0, total: 0 })
  const scoreCH = pct(areaStats["ciencias-humanas"] ?? { correct: 0, total: 0 })
  const scoreLCT = pct(areaStats["linguagens"] ?? { correct: 0, total: 0 })
  const scoreMT = pct(areaStats["matematica"] ?? { correct: 0, total: 0 })

  const areasWithQ = Object.values(areaStats).filter((s) => s.total > 0)
  const scoreTotal =
    areasWithQ.length > 0
      ? Math.round(areasWithQ.reduce((sum, s) => sum + pct(s), 0) / areasWithQ.length)
      : 0

  await db.userSimulado.update({
    where: { id: attemptId },
    data: {
      status: "COMPLETED",
      scoreTotal,
      scoreCN,
      scoreCH,
      scoreLCT,
      scoreMT,
      finishedAt: new Date(),
      timeSpent: totalTimeSpent,
    },
  })

  await awardXP(userId, Math.round(scoreTotal * 0.5) + 20)
  // Tempo real gasto no simulado (sem piso fixo), pelo relógio.
  await recordStudyActivity(userId, Math.round(totalTimeSpent / 60), "SIMULADO")
  const newAchievements = await checkAchievements(userId)

  revalidatePath("/simulados")
  revalidatePath("/dashboard")

  return { success: true, newAchievements }
}
