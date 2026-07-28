import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { SimuladoResolver } from "./simulado-resolver"

export const metadata = { title: "Simulado em andamento" }

export default async function SimuladoExamPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { id: simuladoId, attemptId } = await params

  const attempt = await db.userSimulado.findFirst({
    where: { id: attemptId, userId },
    select: {
      id: true,
      status: true,
      startedAt: true,
      simuladoId: true,
      examDay: true,
      extraTime: true,
    },
  })

  if (!attempt) notFound()
  if (attempt.status === "COMPLETED") {
    redirect(`/simulados/${simuladoId}/${attemptId}/result`)
  }

  const simulado = await db.simulado.findUnique({
    where: { id: simuladoId },
    select: { id: true, title: true, duration: true },
  })
  if (!simulado) notFound()

  const questions = await db.simuladoQuestion.findMany({
    where: { simuladoId },
    orderBy: { order: "asc" },
    include: {
      question: {
        select: {
          id: true,
          statement: true,
          images: true,
          areaSlug: true,
          year: true,
          source: true,
          options: {
            select: { id: true, letter: true, text: true },
            orderBy: { letter: "asc" },
          },
        },
      },
    },
  })

  const answers = await db.userSimuladoAnswer.findMany({
    where: { userSimuladoId: attemptId },
    select: { questionId: true, selectedId: true, markedForReview: true },
  })

  const answerMap: Record<string, { selectedId: string | null; markedForReview: boolean }> = {}
  for (const a of answers) {
    answerMap[a.questionId] = {
      selectedId: a.selectedId,
      markedForReview: a.markedForReview,
    }
  }

  // Modo oficial ENEM: filtra questões e duração pelo dia da tentativa
  const DAY_AREAS: Record<number, string[]> = {
    1: ["linguagens", "ciencias-humanas"],
    2: ["matematica", "ciencias-natureza"],
  }
  const dayAreas = attempt.examDay ? DAY_AREAS[attempt.examDay] : null

  const filtered = dayAreas
    ? questions.filter((sq) => dayAreas.includes(sq.question.areaSlug ?? ""))
    : questions

  const baseMin =
    attempt.examDay === 1 ? 330 : attempt.examDay === 2 ? 300 : simulado.duration
  const durationMin = baseMin + (attempt.extraTime ? 60 : 0)

  const elapsedSeconds = Math.floor(
    (Date.now() - attempt.startedAt.getTime()) / 1000
  )
  const totalSeconds = durationMin * 60
  const initialTimeLeft = Math.max(0, totalSeconds - elapsedSeconds)

  const examQuestions = filtered.map((sq) => ({
    id: sq.question.id,
    statement: sq.question.statement,
    images: sq.question.images,
    areaSlug: sq.question.areaSlug,
    year: sq.question.year,
    source: sq.question.source,
    options: sq.question.options,
    order: sq.order,
  }))

  return (
    <SimuladoResolver
      simuladoId={simuladoId}
      attemptId={attemptId}
      title={simulado.title}
      initialTimeLeft={initialTimeLeft}
      questions={examQuestions}
      initialAnswers={answerMap}
    />
  )
}
