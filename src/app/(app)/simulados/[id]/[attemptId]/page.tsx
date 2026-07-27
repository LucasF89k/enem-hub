import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { SimuladoResolver } from "./simulado-resolver"

export const metadata = { title: "Simulado em andamento — Vion" }

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
    select: { id: true, status: true, startedAt: true, simuladoId: true },
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

  const elapsedSeconds = Math.floor(
    (Date.now() - attempt.startedAt.getTime()) / 1000
  )
  const totalSeconds = simulado.duration * 60
  const initialTimeLeft = Math.max(0, totalSeconds - elapsedSeconds)

  const examQuestions = questions.map((sq) => ({
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
