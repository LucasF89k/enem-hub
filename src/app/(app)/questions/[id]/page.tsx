import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { FavoriteType } from "@prisma/client"
import { QuestionResolver } from "./question-resolver"

export const metadata = { title: "Questão" }

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { id } = await params

  const question = await db.question.findUnique({
    where: { id },
    include: {
      options: { orderBy: { order: "asc" } },
      topic: {
        include: {
          discipline: {
            include: {
              area: { select: { slug: true } },
            },
          },
        },
      },
    },
  })

  if (!question) notFound()

  const isFav =
    (await db.favorite.findUnique({
      where: {
        userId_type_itemId: { userId, type: FavoriteType.QUESTION, itemId: id },
      },
      select: { id: true },
    })) !== null

  const topicPath = question.topic
    ? `/study/${question.topic.discipline.area.slug}/${question.topic.discipline.slug}/${question.topic.slug}`
    : null

  return (
    <div className="min-h-[calc(100dvh-4rem)]">
      <QuestionResolver
        question={{
          id: question.id,
          statement: question.statement,
          images: question.images,
          options: question.options.map((opt) => ({
            id: opt.id,
            letter: opt.letter,
            text: opt.text,
          })),
          explanation: question.explanation,
          correctId: question.correctId,
          areaSlug: question.areaSlug,
          topicPath,
        }}
        initialIsFav={isFav}
      />
    </div>
  )
}
