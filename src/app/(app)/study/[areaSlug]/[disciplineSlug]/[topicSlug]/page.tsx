import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Star, Flame } from "lucide-react"
import { FavoriteButton } from "@/components/study/FavoriteButton"
import { TopicTabs } from "./topic-tabs"
import { FavoriteType } from "@prisma/client"
import { getTopicVideos } from "@/app/actions/video.actions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ areaSlug: string; disciplineSlug: string; topicSlug: string }>
}) {
  const { topicSlug } = await params
  const topic = await db.topic.findUnique({
    where: { slug: topicSlug },
    select: { name: true },
  })
  return { title: topic ? `${topic.name} — Vion` : "Tópico — Vion" }
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ areaSlug: string; disciplineSlug: string; topicSlug: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { areaSlug, disciplineSlug, topicSlug } = await params

  const topic = await db.topic.findUnique({
    where: { slug: topicSlug },
    include: {
      discipline: {
        include: { area: { select: { name: true, slug: true } } },
      },
      contents: { take: 1, orderBy: { importance: "desc" } },
      flashcards: {
        select: { id: true, front: true, type: true },
        orderBy: { createdAt: "asc" },
      },
      questions: {
        select: { id: true, statement: true, difficulty: true },
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
        take: 20,
      },
    },
  })

  if (
    !topic ||
    topic.discipline.slug !== disciplineSlug ||
    topic.discipline.area.slug !== areaSlug
  ) {
    notFound()
  }

  const content = topic.contents[0] ?? null

  // Videos for this topic
  const videos = await getTopicVideos(topic.id)

  // Pending flashcard reviews for this topic
  const now = new Date()
  const pendingReviews = await db.flashcardReview.count({
    where: {
      userId,
      nextReview: { lte: now },
      flashcard: { topicId: topic.id },
    },
  })

  // Is this topic favorited?
  const favorite = await db.favorite.findUnique({
    where: {
      userId_type_itemId: {
        userId,
        type: FavoriteType.CONTENT,
        itemId: topic.id,
      },
    },
  })
  const isFavorited = favorite !== null

  const flashcards = topic.flashcards.map((f) => ({
    id: f.id,
    front: f.front,
    type: f.type as string,
  }))

  const questions = topic.questions.map((q) => ({
    id: q.id,
    statement: q.statement,
    difficulty: q.difficulty as string,
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Breadcrumb + favorite */}
      <div className="flex items-start justify-between gap-2">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
          <Link href="/study" className="hover:text-foreground transition-colors">
            Estudar
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href={`/study/${areaSlug}`} className="hover:text-foreground transition-colors">
            {topic.discipline.area.name}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link
            href={`/study/${areaSlug}/${disciplineSlug}`}
            className="hover:text-foreground transition-colors"
          >
            {topic.discipline.name}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-foreground font-medium">{topic.name}</span>
        </nav>
        <FavoriteButton
          type={FavoriteType.CONTENT}
          itemId={topic.id}
          isFavorited={isFavorited}
        />
      </div>

      {/* Topic header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold leading-tight">{topic.name}</h1>
        {topic.description && (
          <p className="text-sm text-muted-foreground">{topic.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {topic.importance >= 4 && (
            <Badge
              variant="outline"
              className="text-xs border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 gap-1"
            >
              <Star className="h-3 w-3 fill-current" />
              {topic.importance === 5 ? "Alta importância" : "Importância média-alta"}
            </Badge>
          )}
          {topic.frequency === 5 && (
            <Badge
              variant="outline"
              className="text-xs border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 gap-1"
            >
              <Flame className="h-3 w-3" />
              Muito cobrado no ENEM
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <TopicTabs
        topicId={topic.id}
        content={content ? {
          id: content.id,
          summary: content.summary,
          body: content.body,
          keyConcepts: content.keyConcepts,
          tips: content.tips,
          formulas: content.formulas,
          tricks: content.tricks,
          readTime: content.readTime,
        } : null}
        flashcards={flashcards}
        questions={questions}
        pendingReviews={pendingReviews}
        videos={videos}
      />
    </div>
  )
}
