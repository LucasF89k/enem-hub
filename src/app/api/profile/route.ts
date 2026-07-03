import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const [user, profile] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
    db.userProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        targetScore: true,
        targetCourse: true,
        examDate: true,
        dailyStudyGoal: true,
        theme: true,
      },
    }),
  ])

  return NextResponse.json({
    name: user?.name ?? "",
    email: user?.email ?? "",
    targetScore: profile?.targetScore ?? 950,
    targetCourse: profile?.targetCourse ?? "Medicina",
    examDate: profile?.examDate?.toISOString() ?? "",
    dailyStudyGoal: profile?.dailyStudyGoal ?? 120,
    theme: profile?.theme ?? "dark",
  })
}
