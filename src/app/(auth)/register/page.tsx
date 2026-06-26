"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerSchema, type RegisterInput } from "@/lib/validations"
import { register as registerAction } from "@/app/actions/auth.actions"

function PasswordStrengthItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${met ? "text-accent" : "text-muted-foreground"}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {label}
    </li>
  )
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const passwordValue = watch("password", "")
  const hasMinLength = passwordValue.length >= 8
  const hasUppercase = /[A-Z]/.test(passwordValue)
  const hasNumber = /[0-9]/.test(passwordValue)

  function onSubmit(data: RegisterInput) {
    setServerError(null)
    startTransition(async () => {
      const result = await registerAction(data)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">Criar conta grátis</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Comece a se preparar para o ENEM hoje.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Como quer ser chamado?</Label>
          <Input
            id="name"
            type="text"
            placeholder="Seu nome"
            autoComplete="name"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Crie uma senha forte"
              autoComplete="new-password"
              {...register("password")}
              className={errors.password ? "border-destructive pr-10" : "pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {passwordValue.length > 0 && (
            <ul className="space-y-1 pl-0.5 mt-2">
              <PasswordStrengthItem met={hasMinLength} label="Pelo menos 8 caracteres" />
              <PasswordStrengthItem met={hasUppercase} label="Uma letra maiúscula" />
              <PasswordStrengthItem met={hasNumber} label="Um número" />
            </ul>
          )}

          {errors.password && !passwordValue && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repita a senha"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
            <p className="text-sm text-destructive">{serverError}</p>
          </div>
        )}

        <Button type="submit" className="w-full h-12" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
