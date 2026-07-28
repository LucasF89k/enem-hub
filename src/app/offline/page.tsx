import { WifiOff } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Offline" }

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex items-center justify-center h-20 w-20 rounded-full bg-muted">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Sem conexão</h1>
        <p className="text-muted-foreground max-w-xs">
          Você está offline. Algumas funcionalidades ficam disponíveis após a primeira visita.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard">Tentar novamente</Link>
        </Button>
      </div>
    </div>
  )
}
