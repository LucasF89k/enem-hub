import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Brain } from "lucide-react"
import { SubjectBrowser, type BrowserDiscipline } from "./subject-browser"
import { CreateFlashcardDialog, type PickTopic } from "@/components/flashcards/CreateFlashcardDialog"

export const metadata = { title: "Flashcards" }

export default async function FlashcardsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id
  const now = new Date()

  // Só decks do próprio usuário (inclui os criados por ele e pelo Mentor).
  // Os decks públicos importados não aparecem aqui: seus cards vivem nas matérias.
  const decks = await db.flashcardDeck.findMany({
    where: { userId },
    include: { _count: { select: { flashcards: true } } },
    orderBy: { createdAt: "asc" },
  })

  // Per-deck due + new counts
  const deckStats = await Promise.all(
    decks.map(async (deck) => {
      const [due, newCount] = await Promise.all([
        db.flashcardReview.count({
          where: { userId, nextReview: { lte: now }, flashcard: { deckId: deck.id } },
        }),
        db.flashcard.count({
          where: { deckId: deck.id, reviews: { none: { userId } } },
        }),
      ])
      return { ...deck, due, newCount }
    })
  )

  // Árvore Matéria (disciplina) → Conteúdo (tópico) a partir dos cards com topicId
  const topicCounts = await db.flashcard.groupBy({
    by: ["topicId"],
    where: { topicId: { not: null } },
    _count: { _all: true },
  })
  const countByTopic = new Map(topicCounts.map((t) => [t.topicId as string, t._count._all]))
  const topics = await db.topic.findMany({
    where: { id: { in: [...countByTopic.keys()] } },
    select: {
      id: true,
      name: true,
      order: true,
      discipline: {
        select: { id: true, name: true, order: true, area: { select: { name: true, order: true } } },
      },
    },
  })

  const discMap = new Map<string, BrowserDiscipline & { _areaOrder: number; _order: number }>()
  for (const t of topics) {
    const d = t.discipline
    if (!d) continue
    let entry = discMap.get(d.id)
    if (!entry) {
      entry = {
        id: d.id,
        name: d.name,
        area: d.area?.name ?? "",
        cards: 0,
        topics: [],
        _areaOrder: d.area?.order ?? 0,
        _order: d.order ?? 0,
      }
      discMap.set(d.id, entry)
    }
    const cards = countByTopic.get(t.id) ?? 0
    entry.cards += cards
    entry.topics.push({ id: t.id, name: t.name, cards })
  }
  const disciplines: BrowserDiscipline[] = [...discMap.values()]
    .sort((a, b) => a._areaOrder - b._areaOrder || a._order - b._order || a.name.localeCompare(b.name))
    .map((d) => ({
      ...d,
      topics: d.topics.sort((a, b) => b.cards - a.cards || a.name.localeCompare(b.name)),
    }))

  // Todos os tópicos, para o seletor de "criar flashcard" (permite qualquer matéria)
  const allTopics = await db.topic.findMany({
    select: { id: true, name: true, discipline: { select: { name: true } } },
    orderBy: { name: "asc" },
  })
  const pickTopics: PickTopic[] = allTopics.map((t) => ({
    id: t.id,
    name: t.name,
    discipline: t.discipline?.name ?? "Outros",
  }))

  const totalDue = deckStats.reduce((sum, d) => sum + d.due, 0)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-8">
      {/* Hero: mesmo padrão da Dashboard, número grande com glow + CTA único */}
      <div className="opal-enter flex flex-col items-center px-4 py-8 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="opal-breathing-glow" aria-hidden />
          <Brain className="relative z-10 h-8 w-8 text-accent" />
        </div>
        <p className="mt-4 text-[52px] font-semibold leading-none tracking-tight text-foreground">
          {totalDue}
        </p>
        <p className="mt-1.5 text-sm font-medium text-muted-foreground">
          {totalDue === 0 ? "Nenhuma revisão pendente, tudo em dia!" : `card${totalDue === 1 ? "" : "s"} esperando revisão`}
        </p>
        {totalDue > 0 && (
          <Link
            href="/flashcards/review"
            className="mt-5 flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Revisar tudo agora
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Flashcards</h2>
          <p className="text-sm text-muted-foreground">Revisão espaçada com algoritmo SM-2</p>
        </div>
        <CreateFlashcardDialog topics={pickTopics} size="sm" />
      </div>

      {/* Navegação por matéria e conteúdo */}
      {disciplines.length > 0 && <SubjectBrowser disciplines={disciplines} />}

      {/* Seus decks (criados por você ou pelo Mentor) */}
      {deckStats.some((d) => d._count.flashcards > 0) && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Seus decks
          </h2>
          {deckStats.map((deck) => {
            const deckPending = deck.due + Math.min(deck.newCount, 10)
            return (
              <Card key={deck.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                  <div>
                    <CardTitle className="text-sm font-medium">{deck.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {deck._count.flashcards} cards no total
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {deck.due > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {deck.due} vencido{deck.due !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {deck.newCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {deck.newCount} novo{deck.newCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                {deckPending > 0 && (
                  <CardContent className="px-4 pb-4">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/flashcards/review?deckId=${deck.id}`}>
                        Revisar este deck ({deckPending} card{deckPending !== 1 ? "s" : ""})
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
