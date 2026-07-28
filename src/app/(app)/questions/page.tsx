import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Difficulty, FavoriteType, Prisma } from "@prisma/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Heart, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuestionsFilters } from "./questions-filters"

export const metadata = { title: "Banco de Questões" }

const PAGE_SIZE = 20

const AREA_STYLE: Record<string, { bg: string; text: string }> = {
  "ciencias-natureza": { bg: "bg-green-500/10", text: "text-green-700 dark:text-green-400" },
  "ciencias-humanas": { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400" },
  linguagens: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-400" },
  matematica: { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-400" },
}

const AREA_NAME: Record<string, string> = {
  "ciencias-natureza": "Ciências da Natureza",
  "ciencias-humanas": "Ciências Humanas",
  linguagens: "Linguagens",
  matematica: "Matemática",
}

const DIFF_LABEL: Record<Difficulty, string> = {
  EASY: "Fácil",
  MEDIUM: "Médio",
  HARD: "Difícil",
  VERY_HARD: "Muito difícil",
}

const DIFF_STYLE: Record<Difficulty, string> = {
  EASY: "bg-green-500/10 text-green-700 dark:text-green-400",
  MEDIUM: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  HARD: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  VERY_HARD: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const sp = await searchParams

  const areaSlug = typeof sp.area === "string" ? sp.area : undefined
  const discSlug = typeof sp.disc === "string" ? sp.disc : undefined
  const topicSlug = typeof sp.topic === "string" ? sp.topic : undefined
  const rawDiff = sp.diff ? (Array.isArray(sp.diff) ? sp.diff : [sp.diff]) : []
  const difficulties = rawDiff.filter((d): d is Difficulty =>
    ["EASY", "MEDIUM", "HARD", "VERY_HARD"].includes(d)
  )
  const year = typeof sp.year === "string" ? sp.year : undefined
  const onlyWrong = sp.wrong === "1"
  const onlyFav = sp.fav === "1"
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1") || 1)

  const areas = await db.area.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      disciplines: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          topics: {
            orderBy: { order: "asc" },
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  })

  // Build where clause
  const where: Prisma.QuestionWhereInput = {}

  if (areaSlug) where.areaSlug = areaSlug

  const topicFilter: Prisma.TopicWhereInput = {}
  if (discSlug) topicFilter.discipline = { slug: discSlug }
  if (topicSlug) topicFilter.slug = topicSlug
  if (Object.keys(topicFilter).length > 0) {
    where.topic = topicFilter
  }

  if (difficulties.length > 0) where.difficulty = { in: difficulties }

  if (year === "custom") where.source = "Custom"
  else if (year) where.year = parseInt(year)

  if (onlyWrong) {
    where.userAnswers = {
      some: { userId, isCorrect: false },
      none: { userId, isCorrect: true },
    }
  }

  if (onlyFav) {
    const favIds = await db.favorite.findMany({
      where: { userId, type: FavoriteType.QUESTION },
      select: { itemId: true },
    })
    where.id = { in: favIds.map((f) => f.itemId) }
  }

  const [questions, total] = await Promise.all([
    db.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        statement: true,
        areaSlug: true,
        difficulty: true,
        year: true,
        source: true,
      },
    }),
    db.question.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const questionIds = questions.map((q) => q.id)

  const [userAnswers, favs] = await Promise.all([
    questionIds.length > 0
      ? db.userQuestion.findMany({
          where: { userId, questionId: { in: questionIds } },
          select: { questionId: true, isCorrect: true },
        })
      : Promise.resolve([]),
    questionIds.length > 0
      ? db.favorite.findMany({
          where: { userId, type: FavoriteType.QUESTION, itemId: { in: questionIds } },
          select: { itemId: true },
        })
      : Promise.resolve([]),
  ])

  const answeredMap: Record<string, boolean> = {}
  for (const ans of userAnswers) {
    if (answeredMap[ans.questionId] === undefined) {
      answeredMap[ans.questionId] = ans.isCorrect
    } else if (ans.isCorrect) {
      answeredMap[ans.questionId] = true
    }
  }
  const favSet = new Set(favs.map((f) => f.itemId))

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams()
    if (areaSlug) params.set("area", areaSlug)
    if (discSlug) params.set("disc", discSlug)
    if (topicSlug) params.set("topic", topicSlug)
    difficulties.forEach((d) => params.append("diff", d))
    if (year) params.set("year", year)
    if (onlyWrong) params.set("wrong", "1")
    if (onlyFav) params.set("fav", "1")
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/questions${qs ? "?" + qs : ""}`
  }

  const currentFilters = {
    areaSlug,
    discSlug,
    topicSlug,
    difficulties,
    year,
    onlyWrong,
    onlyFav,
  }

  const filterKey = `${areaSlug}-${discSlug}-${topicSlug}-${difficulties.join(",")}-${year}-${onlyWrong}-${onlyFav}`

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Banco de Questões</h1>
        <p className="text-sm text-muted-foreground">
          {total} questão{total !== 1 ? "ões" : ""} encontrada{total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <QuestionsFilters
          key={filterKey}
          areas={areas}
          currentFilters={currentFilters}
          total={total}
        />

        {/* Question list */}
        <div className="flex-1 min-w-0 space-y-3">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-muted/30 py-16 text-center">
              <p className="text-lg font-semibold">Nenhuma questão encontrada</p>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/questions">Limpar filtros</Link>
              </Button>
            </div>
          ) : (
            <>
              {questions.map((q) => {
                const areaStyle = q.areaSlug ? AREA_STYLE[q.areaSlug] : null
                const areaName = q.areaSlug ? AREA_NAME[q.areaSlug] : null
                const diffStyle = DIFF_STYLE[q.difficulty]
                const diffLabel = DIFF_LABEL[q.difficulty]
                const isAnswered = answeredMap[q.id] !== undefined
                const isCorrect = answeredMap[q.id] === true
                const isFav = favSet.has(q.id)
                const preview =
                  q.statement.slice(0, 120) + (q.statement.length > 120 ? "…" : "")

                return (
                  <Link
                    key={q.id}
                    href={`/questions/${q.id}`}
                    className="block rounded-xl border bg-card p-4 hover:bg-muted/40 transition-colors active:scale-[0.99] touch-manipulation"
                  >
                    <p className="text-[14px] leading-snug text-foreground/90 mb-3 line-clamp-3">
                      {preview}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {areaName && areaStyle && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                            areaStyle.bg,
                            areaStyle.text
                          )}
                        >
                          {areaName}
                        </span>
                      )}
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                          diffStyle
                        )}
                      >
                        {diffLabel}
                      </span>
                      {q.year && (
                        <span className="text-[11px] text-muted-foreground">ENEM {q.year}</span>
                      )}
                      {q.source === "Custom" && !q.year && (
                        <span className="text-[11px] text-muted-foreground">Questão autoral</span>
                      )}
                      <div className="ml-auto flex items-center gap-1.5">
                        {isFav && (
                          <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400 shrink-0" />
                        )}
                        {isAnswered && (
                          <CheckCircle2
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              isCorrect ? "text-green-500" : "text-muted-foreground/40"
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  {page > 1 ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={buildPageUrl(page - 1)}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={buildPageUrl(page + 1)}>
                        Próxima
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
