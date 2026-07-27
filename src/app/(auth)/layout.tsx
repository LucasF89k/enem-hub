import { VionLogo } from "@/components/VionLogo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-8 text-center">
        <VionLogo className="w-16 h-16 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-foreground">Vion</h1>
        <p className="text-sm text-muted-foreground mt-1">Foco · Visão · Conquista</p>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
