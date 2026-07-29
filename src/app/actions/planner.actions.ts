"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { generateStudyPlan } from "@/lib/planner"
import { recordStudyActivity } from "@/lib/xp"
import { z } from "zod"

/** Monday of the current week in UTC (independent of server/local timezone). */
function getThisMondayUTC(): Date {
  const now = new Date()
  const dayUTC = now.getUTCDay() // 0=Sun
  const daysSinceMonday = (dayUTC + 6) % 7
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday)
  )
}

const generateSchema = z.object({
  daysCount: z.coerce.number().int().min(1).max(90).default(14),
  dailyGoalMinutes: z.coerce.number().int().min(30).max(720).default(120),
  weekDays: z.array(z.coerce.number().int().min(0).max(6)).min(1).default([1, 2, 3, 4, 5]),
})

export async function generatePlan(
  formData: FormData
): Promise<{ success: boolean; planId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const weekDaysRaw = formData.getAll("weekDays").map(Number)

  const parsed = generateSchema.safeParse({
    daysCount: formData.get("daysCount"),
    dailyGoalMinutes: formData.get("dailyGoalMinutes"),
    weekDays: weekDaysRaw.length > 0 ? weekDaysRaw : [1, 2, 3, 4, 5],
  })

  if (!parsed.success) return { success: false, error: "Parâmetros inválidos" }

  try {
    const planId = await generateStudyPlan({
      userId,
      startDate: getThisMondayUTC(),
      ...parsed.data,
    })
    revalidatePath("/planner")
    return { success: true, planId }
  } catch {
    return { success: false, error: "Falha ao gerar plano" }
  }
}

const mentorPlanSchema = z.object({
  daysCount: z.coerce.number().int().min(1).max(120).default(14),
  dailyGoalMinutes: z.coerce.number().int().min(30).max(720).default(120),
  weekDays: z.array(z.coerce.number().int().min(0).max(6)).min(1).default([1, 2, 3, 4, 5]),
  focusDisciplines: z.array(z.string().min(1).max(60)).max(15).optional().default([]),
  balance: z.enum(["teoria", "equilibrado", "questoes"]).optional().default("equilibrado"),
})

export type MentorPlanInput = z.input<typeof mentorPlanSchema>

/** Aplica a rotina estruturada montada pelo Mentor (fluxo de entrevista). */
export async function applyMentorPlan(
  input: MentorPlanInput,
): Promise<{ success: boolean; planId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autenticado" }
  const userId = session.user.id

  const parsed = mentorPlanSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Plano inválido" }
  const { daysCount, dailyGoalMinutes, weekDays, focusDisciplines, balance } = parsed.data

  try {
    // Sincroniza a meta diária com o que foi combinado na entrevista
    await db.userProfile.update({
      where: { userId },
      data: { dailyStudyGoal: dailyGoalMinutes },
    }).catch(() => {})

    const planId = await generateStudyPlan({
      userId,
      startDate: getThisMondayUTC(),
      daysCount,
      dailyGoalMinutes,
      weekDays,
      focusDisciplines,
      balance,
    })
    revalidatePath("/planner")
    revalidatePath("/dashboard")
    return { success: true, planId }
  } catch {
    return { success: false, error: "Falha ao gerar o plano" }
  }
}

export async function completePlanItem(itemId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const item = await db.studyPlanItem.findFirst({
    where: { id: itemId, plan: { userId: session.user.id } },
    select: { id: true, completed: true },
  })
  if (!item) return

  const willComplete = !item.completed
  await db.studyPlanItem.update({
    where: { id: itemId },
    data: {
      completed: willComplete,
      completedAt: willComplete ? new Date() : null,
    },
  })

  if (willComplete) {
    // Só marca o streak (0 min); o tempo real vem das telas (leitura via
    // StudyTimer, questões e flashcards pelo relógio do dispositivo).
    await recordStudyActivity(session.user.id, 0, "CONTENT").catch(() => {})
  }

  revalidatePath("/planner")
}

// Alias used by dashboard PlanoHojeCardClient
export const markPlanItemDone = completePlanItem

/**
 * Regenerates the active plan with updated topic priorities based on the user's
 * current error rates. Detects the existing plan's weekDays from its items.
 */
export async function recalibratePlan(): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const activePlan = await db.studyPlan.findFirst({
    where: { userId, isActive: true },
    include: {
      items: {
        where: { scheduledAt: { gte: new Date() } },
        select: { scheduledAt: true },
        take: 30,
      },
    },
  })

  if (!activePlan) return { success: false, error: "Nenhum plano ativo para recalibrar." }

  // Detect which weekdays the plan uses (from future items' UTC day-of-week)
  const weekDaySet = new Set<number>()
  for (const item of activePlan.items) {
    weekDaySet.add(item.scheduledAt.getUTCDay())
  }
  const weekDays = weekDaySet.size > 0 ? Array.from(weekDaySet).sort() : [1, 2, 3, 4, 5]

  // How many days remain until the exam (or 14 default)
  const now = new Date()
  const remainingDays = activePlan.endDate > now
    ? Math.min(90, Math.ceil((activePlan.endDate.getTime() - now.getTime()) / 86_400_000))
    : 14

  try {
    await generateStudyPlan({
      userId,
      startDate: getThisMondayUTC(),
      daysCount: remainingDays,
      dailyGoalMinutes: activePlan.dailyGoal,
      weekDays,
    })
    revalidatePath("/planner")
    return { success: true }
  } catch {
    return { success: false, error: "Falha ao recalibrar o plano. Tente novamente." }
  }
}

export async function removePlanItem(itemId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await db.studyPlanItem.deleteMany({
    where: { id: itemId, plan: { userId: session.user.id } },
  })

  revalidatePath("/planner")
  revalidatePath("/dashboard")
}

// ─── Excluir / editar / construir manualmente o plano ───────────────────────

const SESSION_TYPES = [
  "CONTENT",
  "FLASHCARDS",
  "QUESTIONS",
  "SIMULADO",
  "REDACAO",
  "REVISION",
] as const

/** Exclui o plano de estudos ativo (os itens caem junto por cascade). */
export async function deletePlan(): Promise<{ success: boolean }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await db.studyPlan.deleteMany({
    where: { userId: session.user.id, isActive: true },
  })

  revalidatePath("/planner")
  revalidatePath("/dashboard")
  return { success: true }
}

/** Garante que existe um plano ativo (cria um vazio se o usuário não tiver). */
async function getOrCreateActivePlanId(userId: string): Promise<string> {
  const existing = await db.studyPlan.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })
  if (existing) return existing.id

  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { dailyStudyGoal: true, examDate: true },
  })
  const dailyGoal = profile?.dailyStudyGoal ?? 120
  const start = getThisMondayUTC()
  const end =
    profile?.examDate && profile.examDate > start
      ? profile.examDate
      : new Date(start.getTime() + 30 * 86_400_000)

  const created = await db.studyPlan.create({
    data: {
      userId,
      title: "Meu plano",
      startDate: start,
      endDate: end,
      dailyGoal,
      weeklyGoal: dailyGoal * 5,
      isActive: true,
    },
    select: { id: true },
  })
  return created.id
}

const addItemSchema = z.object({
  scheduledAt: z.string().min(8), // ISO (YYYY-MM-DD ou datetime)
  title: z.string().min(1).max(120),
  type: z.enum(SESSION_TYPES).default("CONTENT"),
  duration: z.coerce.number().int().min(5).max(600).default(30),
  description: z.string().max(300).optional(),
})

export type AddPlanItemInput = z.input<typeof addItemSchema>

/** Adiciona uma atividade avulsa a um dia (constrói o plano manualmente). */
export async function addPlanItem(
  input: AddPlanItemInput,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = addItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Dados inválidos" }
  const { scheduledAt, title, type, duration, description } = parsed.data

  // Normaliza para meia-noite UTC do dia informado
  const day = scheduledAt.slice(0, 10)
  const when = new Date(`${day}T00:00:00.000Z`)
  if (Number.isNaN(when.getTime())) return { success: false, error: "Data inválida" }

  const planId = await getOrCreateActivePlanId(session.user.id)
  await db.studyPlanItem.create({
    data: { planId, title, type, duration, scheduledAt: when, description: description ?? null },
  })

  revalidatePath("/planner")
  revalidatePath("/dashboard")
  return { success: true }
}

const updateItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120).optional(),
  type: z.enum(SESSION_TYPES).optional(),
  duration: z.coerce.number().int().min(5).max(600).optional(),
})

export type UpdatePlanItemInput = z.input<typeof updateItemSchema>

/** Edita uma atividade do plano (título, tipo e/ou duração). */
export async function updatePlanItem(
  input: UpdatePlanItemInput,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = updateItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Dados inválidos" }
  const { id, ...data } = parsed.data

  await db.studyPlanItem.updateMany({
    where: { id, plan: { userId: session.user.id } },
    data,
  })

  revalidatePath("/planner")
  revalidatePath("/dashboard")
  return { success: true }
}

// ─── Importar plano de uma foto (o Mentor transcreve a folha) ───────────────

const importedPlanSchema = z.object({
  title: z.string().max(80).optional(),
  days: z
    .array(
      z.object({
        date: z.string().min(8), // YYYY-MM-DD
        items: z
          .array(
            z.object({
              title: z.string().min(1).max(120),
              type: z.enum(SESSION_TYPES).default("CONTENT"),
              duration: z.coerce.number().int().min(5).max(600).default(45),
              description: z.string().max(300).optional(),
            }),
          )
          .max(20),
      }),
    )
    .min(1)
    .max(60),
})

export type ImportedPlanInput = z.input<typeof importedPlanSchema>

/**
 * Cria um plano a partir da estrutura que o Mentor extraiu de uma foto da folha,
 * replicando o dia a dia exatamente como está no papel.
 */
export async function applyImportedPlan(
  input: ImportedPlanInput,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autenticado" }
  const userId = session.user.id

  const parsed = importedPlanSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Plano inválido" }
  const { title, days } = parsed.data

  const dates = days
    .map((d) => new Date(`${d.date.slice(0, 10)}T00:00:00.000Z`))
    .filter((d) => !Number.isNaN(d.getTime()))
  if (dates.length === 0) return { success: false, error: "Datas inválidas" }
  const startDate = new Date(Math.min(...dates.map((d) => d.getTime())))
  const endDate = new Date(Math.max(...dates.map((d) => d.getTime())))

  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { dailyStudyGoal: true },
  })
  const dailyGoal = profile?.dailyStudyGoal ?? 120

  try {
    // Desativa planos anteriores e cria o novo como ativo
    await db.studyPlan.updateMany({ where: { userId, isActive: true }, data: { isActive: false } })

    const plan = await db.studyPlan.create({
      data: {
        userId,
        title: title?.trim() || "Plano da folha",
        startDate,
        endDate,
        dailyGoal,
        weeklyGoal: dailyGoal * 5,
        isActive: true,
      },
      select: { id: true },
    })

    const rows = days.flatMap((d) => {
      const when = new Date(`${d.date.slice(0, 10)}T00:00:00.000Z`)
      if (Number.isNaN(when.getTime())) return []
      return d.items.map((it) => ({
        planId: plan.id,
        title: it.title,
        type: it.type,
        duration: it.duration,
        scheduledAt: when,
        description: it.description ?? null,
      }))
    })
    if (rows.length > 0) await db.studyPlanItem.createMany({ data: rows })

    revalidatePath("/planner")
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { success: false, error: "Falha ao aplicar o plano da folha" }
  }
}
