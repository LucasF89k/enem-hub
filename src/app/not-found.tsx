import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-background text-foreground">
      <p className="text-8xl font-bold text-muted-foreground/20">404</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          A página que você procura não existe ou foi removida.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Voltar para o início</Link>
      </Button>
    </div>
  )
}
