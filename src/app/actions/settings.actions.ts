"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { syncTrail } from "@/lib/planner"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const settingsSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(80),
  targetScore: z.coerce.number().min(400).max(1000),
  targetCourse: z.string().min(2).max(80),
  targetInstitution: z.string().max(160).optional().nullable(),
  examDate: z.coerce.date().optional().nullable(),
  dailyStudyGoal: z.coerce.number().int().min(30).max(720),
  theme: z.enum(["dark", "light"]).default("dark"),
})

/** Define a faculdade-alvo direto do dashboard (clique na lista de notas de corte). */
export async function setTargetInstitution(institutionId: string | null) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await db.userProfile.update({
    where: { userId: session.user.id },
    data: { targetInstitution: institutionId || null },
  })

  revalidatePath("/dashboard")
  revalidatePath("/profile")
  revalidatePath("/profile/settings")
  return { success: true }
}

export async function updateUserSettings(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const raw = {
    name: formData.get("name"),
    targetScore: formData.get("targetScore"),
    targetCourse: formData.get("targetCourse"),
    targetInstitution: formData.get("targetInstitution") || null,
    examDate: formData.get("examDate") || null,
    dailyStudyGoal: formData.get("dailyStudyGoal"),
    theme: formData.get("theme") ?? undefined, // tema agora é aplicado no cliente (ThemeSelect)
  }

  const parsed = settingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const { name, targetScore, targetCourse, targetInstitution, examDate, dailyStudyGoal, theme } =
    parsed.data

  await db.user.update({
    where: { id: userId },
    data: { name },
  })

  await db.userProfile.update({
    where: { userId },
    data: {
      targetScore,
      targetCourse,
      targetInstitution: targetInstitution || null,
      examDate: examDate ?? null,
      dailyStudyGoal,
      theme,
    },
  })

  await syncTrail(userId)

  revalidatePath("/profile")
  revalidatePath("/profile/settings")
  revalidatePath("/dashboard")

  return { success: true }
}
