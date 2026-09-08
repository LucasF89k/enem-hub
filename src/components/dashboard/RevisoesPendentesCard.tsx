import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ArrowRight } from "lucide-react"
import Link from "next/link"

export async function RevisoesPendentesCard({ userId }: { userId: string }) {
  const now = new Date()

  const [dueCount, newCount] = await Promise.all([
    db.flashcardReview.count({
      where: { userId, nextReview: { lte: now } },
    }),
    db.flashcard.count({
      where: {
        deck: { isPublic: true },
        reviews: { none: { userId } },
      },
    }),
  ])

  const total = dueCount + Math.min(newCount, 20)
  const hasReviews = total > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Revisões pendentes</CardTitle>
        <Brain className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold">
            {hasReviews ? total : 0}
          </span>
          <span className="mb-1 text-sm text-muted-foreground">
            {total === 1 ? "card" : "cards"}
          </span>
        </div>

        {dueCount > 0 && (
          <p className="text-xs text-warning">
            {dueCount} vencido{dueCount !== 1 ? "s" : ""} hoje
          </p>
        )}

        {!hasReviews && (
          <p className="text-xs text-muted-foreground">
            Nenhuma revisão pendente, tudo em dia!
          </p>
        )}

        <Button asChild size="sm" className="w-full" variant={hasReviews ? "default" : "outline"}>
          <Link href="/flashcards">
            {hasReviews ? "Revisar agora" : "Ver flashcards"}
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
