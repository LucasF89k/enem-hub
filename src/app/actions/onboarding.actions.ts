"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { onboardingSchema } from "@/lib/validations"
import { redirect } from "next/navigation"
import { syncTrail } from "@/lib/planner"

interface CompleteOnboardingInput {
  name: string
  targetScore: number
  targetCourse: string
  examDate: Date | null
  dailyStudyGoal: number // minutos
}

export async function completeOnboarding(data: CompleteOnboardingInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = onboardingSchema.safeParse({
    name: data.name,
    targetScore: data.targetScore,
    targetCourse: data.targetCourse,
    examDate: data.examDate ?? undefined,
    dailyStudyGoal: data.dailyStudyGoal,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos")
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  })

  await db.userProfile.update({
    where: { userId: session.user.id },
    data: {
      targetScore: parsed.data.targetScore,
      targetCourse: parsed.data.targetCourse ?? "Medicina",
      examDate: parsed.data.examDate ?? null,
      dailyStudyGoal: parsed.data.dailyStudyGoal,
    },
  })

  await syncTrail(session.user.id)

  redirect("/dashboard")
}
