import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchX } from "lucide-react"

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold">Página não encontrada</h2>
        <p className="text-sm text-muted-foreground">
          O conteúdo que você procura não existe ou foi removido.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/dashboard">Voltar para o início</Link>
      </Button>
    </div>
  )
}
