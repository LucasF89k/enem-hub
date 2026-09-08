import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Star, Flame } from "lucide-react"
import { FavoriteButton } from "@/components/study/FavoriteButton"
import { TopicTabs } from "./topic-tabs"
import { FavoriteType } from "@prisma/client"
import { getTopicVideos } from "@/app/actions/video.actions"
import { resolveWikiLinks } from "@/lib/wiki-links"

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
  return { title: topic ? `${topic.name} · Vion` : "Tópico" }
}

const VALID_TABS = ["teoria", "resumo", "flashcards", "questoes", "videos"]

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ areaSlug: string; disciplineSlug: string; topicSlug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { areaSlug, disciplineSlug, topicSlug } = await params
  const { tab } = await searchParams
  const defaultTab = tab && VALID_TABS.includes(tab) ? tab : "teoria"

  const topic = await db.topic.findUnique({
    where: { slug: topicSlug },
    include: {
      discipline: {
        include: { area: { select: { name: true, slug: true } } },
      },
      contents: { take: 1, orderBy: { importance: "desc" } },
      flashcards: {
        select: { id: true, front: true, type: true, tags: true },
        orderBy: { createdAt: "asc" },
      },
      questions: {
        select: {
          id: true,
          statement: true,
          difficulty: true,
          images: true,
          explanation: true,
          correctId: true,
          options: { orderBy: { order: "asc" }, select: { id: true, letter: true, text: true } },
        },
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
        take: 60,
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

  // Resolve links internos ([[slug|texto]]) do corpo teórico → âncoras azuis
  const resolvedBody = content ? await resolveWikiLinks(content.body) : ""

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
    tags: f.tags,
  }))

  const questions = topic.questions.map((q) => ({
    id: q.id,
    statement: q.statement,
    difficulty: q.difficulty as string,
    images: q.images,
    explanation: q.explanation,
    correctId: q.correctId,
    options: q.options.map((o) => ({ id: o.id, letter: o.letter, text: o.text })),
  }))

  // Questões que o usuário já errou (última resposta incorreta) → filtro "Revisar erradas"
  const answers = await db.userQuestion.findMany({
    where: { userId, questionId: { in: questions.map((q) => q.id) } },
    orderBy: { answeredAt: "desc" },
    select: { questionId: true, isCorrect: true },
  })
  const latestByQ = new Map<string, boolean>()
  for (const a of answers) if (!latestByQ.has(a.questionId)) latestByQ.set(a.questionId, a.isCorrect)
  const wrongIds = [...latestByQ.entries()].filter(([, ok]) => !ok).map(([id]) => id)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Voltar + favorite */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/study/${areaSlug}/${disciplineSlug}`}
          aria-label="Voltar"
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
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
        topicName={topic.name}
        defaultTab={defaultTab}
        content={content ? {
          id: content.id,
          summary: content.summary,
          body: resolvedBody,
          keyConcepts: content.keyConcepts,
          tips: content.tips,
          formulas: content.formulas,
          tricks: content.tricks,
          readTime: content.readTime,
        } : null}
        flashcards={flashcards}
        questions={questions}
        wrongIds={wrongIds}
        pendingReviews={pendingReviews}
        videos={videos}
      />
    </div>
  )
}
