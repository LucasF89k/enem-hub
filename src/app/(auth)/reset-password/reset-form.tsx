"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/app/actions/auth.actions"

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="mb-1 text-xl font-semibold">Link inválido</h2>
        <p className="text-sm text-muted-foreground">
          Este link de redefinição está incompleto. Peça um novo.
        </p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href="/forgot-password">Pedir novo link</Link>
        </Button>
      </div>
    )
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("As senhas não coincidem")
      return
    }
    startTransition(async () => {
      const res = await resetPassword(token, password)
      if (res.success) {
        setDone(true)
        toast.success("Senha redefinida!")
        setTimeout(() => router.push("/login"), 1800)
      } else {
        setError(res.error ?? "Erro ao redefinir")
      }
    })
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-6 w-6 text-accent" />
        </div>
        <h2 className="mb-1 text-xl font-semibold">Senha redefinida!</h2>
        <p className="text-sm text-muted-foreground">Redirecionando para o login…</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-foreground">Nova senha</h2>
      <p className="mb-6 text-sm text-muted-foreground">Escolha uma senha nova para sua conta.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Ocultar" : "Mostrar"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            placeholder="Repita a senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button type="submit" className="h-12 w-full" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir senha"}
        </Button>
      </form>
    </div>
  )
}
