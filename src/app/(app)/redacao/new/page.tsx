import { createEssay } from "@/app/actions/essay.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { TEMAS_HISTORICOS } from "@/constants/redacao-bank"

export const metadata = { title: "Nova Redação — Vion" }

export default function NewEssayPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/redacao">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Redações
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Nova redação</h1>
        <p className="text-sm text-muted-foreground">Escolha ou escreva um tema</p>
      </div>

      <form action={createEssay} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="theme">Tema da redação</Label>
          <Input
            id="theme"
            name="theme"
            placeholder="Ex: Desafios para a valorização da cultura indígena no Brasil"
            required
            minLength={5}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Título (como você quer chamar)</Label>
          <Input
            id="title"
            name="title"
            placeholder="Ex: Minha redação — Tema 2024"
            required
            minLength={3}
          />
        </div>

        <Button type="submit" className="w-full">Começar a escrever</Button>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Temas históricos do ENEM
        </p>
        <div className="space-y-1.5">
          {TEMAS_HISTORICOS.slice(0, 8).map((t) => (
            <Card key={t.ano} className="cursor-pointer hover:border-primary/40 transition-colors">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{t.ano}</p>
                <p className="text-sm">{t.tema}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
