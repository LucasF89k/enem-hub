import { Brain } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
          <Brain className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">ENEM Medicina Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">Sua plataforma de preparação</p>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
