"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { Loader2 } from "lucide-react"

/** Desloga sessões órfãs (usuário apagado do banco) e leva ao login. */
export function ForceLogout() {
  useEffect(() => {
    signOut({ callbackUrl: "/login" })
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">Sessão encerrada. Redirecionando para o login…</p>
    </div>
  )
}
