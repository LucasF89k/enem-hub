import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, ArrowRight, CheckCircle2, Clock } from "lucide-react"

export const metadata = { title: "Flashcards — ENEM Hub" }

export default async function FlashcardsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id
  const now = new Date()

  const [decks, nextScheduled] = await Promise.all([
    db.flashcardDeck.findMany({
      where: { OR: [{ isPublic: true }, { userId }] },
      include: { _count: { select: { flashcards: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.flashcardReview.findFirst({
      where: { userId, nextReview: { gt: now } },
      orderBy: { nextReview: "asc" },
      select: { nextReview: true },
    }),
  ])

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

  const totalDue = deckStats.reduce((s, d) => s + d.due, 0)
  const totalNew = deckStats.reduce((s, d) => s + d.newCount, 0)
  const totalPending = totalDue + Math.min(totalNew, 20)
  const isEmpty = totalPending === 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flashcards</h1>
        <p className="text-sm text-muted-foreground">Revisão espaçada com algoritmo SM-2</p>
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/30 py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-accent" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">Tudo em dia!</p>
            <p className="text-sm text-muted-foreground">Nenhuma revisão pendente para hoje</p>
          </div>
          {nextScheduled && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Próxima revisão:{" "}
                {format(nextScheduled.nextReview, "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/study">Estudar novo conteúdo</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPending}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalDue > 0 && `${totalDue} vencido${totalDue !== 1 ? "s" : ""}`}
                    {totalDue > 0 && totalNew > 0 && " · "}
                    {totalNew > 0 && `${Math.min(totalNew, 20)} novo${Math.min(totalNew, 20) !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <Link href="/flashcards/review">
                  Revisar tudo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Per-deck cards */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Decks disponíveis
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
        </>
      )}
    </div>
  )
}
