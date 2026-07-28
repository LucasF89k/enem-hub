import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { NewEssayForm } from "./NewEssayForm"

export const metadata = { title: "Nova Redação" }

export default async function NewEssayPage({
  searchParams,
}: {
  searchParams: Promise<{ tema?: string }>
}) {
  const { tema } = await searchParams
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
        <p className="text-sm text-muted-foreground">Escolha, gere com o Mentor ou escreva um tema</p>
      </div>

      <NewEssayForm initialTheme={tema ?? ""} />
    </div>
  )
}
