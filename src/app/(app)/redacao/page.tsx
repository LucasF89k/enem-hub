import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, FileText, Star } from "lucide-react"
import { PaperEssayButton } from "./PaperEssayButton"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export const metadata = { title: "Redações" }

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground italic">Não avaliada</span>
  const color = score >= 800 ? "text-green-500" : score >= 600 ? "text-yellow-500" : "text-red-500"
  return <span className={cn("text-sm font-bold", color)}>{score}/1000</span>
}

export default async function RedacaoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const essays = await db.essay.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      theme: true,
      title: true,
      totalScore: true,
      wordCount: true,
      updatedAt: true,
      comp1Score: true,
    },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Redações</h1>
          <p className="text-sm text-muted-foreground">Pratique e receba avaliação por IA</p>
        </div>
        <div className="flex items-center gap-2">
          <PaperEssayButton />
          <Button asChild size="sm" className="gap-1">
            <Link href="/redacao/new">
              <PlusCircle className="h-4 w-4" />
              Nova
            </Link>
          </Button>
        </div>
      </div>

      {essays.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/20 py-16 gap-3 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">Nenhuma redação ainda</p>
          <p className="text-sm text-muted-foreground">Comece praticando um tema do ENEM</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
            <Button asChild>
              <Link href="/redacao/new">Escrever minha primeira redação</Link>
            </Button>
            <PaperEssayButton label="Já escrevi no papel — corrigir foto" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {essays.map((e) => (
            <Link
              key={e.id}
              href={`/redacao/${e.id}`}
              className="block rounded-xl border bg-card hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">{e.theme}</p>
                    <p className="font-medium text-sm truncate">{e.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{format(e.updatedAt, "dd MMM yyyy", { locale: ptBR })}</span>
                      {e.wordCount && <span>{e.wordCount} palavras</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <ScoreBadge score={e.totalScore} />
                    {e.comp1Score !== null && (
                      <div className="flex justify-end mt-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
