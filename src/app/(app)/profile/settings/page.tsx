"use client"

import { useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { logout } from "@/app/actions/auth.actions"
import { updateUserSettings } from "@/app/actions/settings.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2, LogOut, Save } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { FaculdadeCombobox } from "@/components/settings/FaculdadeCombobox"

interface ProfileData {
  name: string
  email: string
  targetScore: number
  targetCourse: string
  targetInstitution: string
  examDate: string
  dailyStudyGoal: number
  theme: string
}

export default function SettingsPage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isLoggingOut, startLogout] = useTransition()
  const [data, setData] = useState<ProfileData | null>(null)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await updateUserSettings(formData)
        if (result.success) {
          toast.success("Configurações salvas!")
          router.push("/profile")
        } else {
          toast.error(result.error ?? "Erro ao salvar")
        }
      } catch {
        toast.error("Erro ao salvar configurações")
      }
    })
  }

  function handleLogout() {
    startLogout(async () => {
      await logout()
    })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="-ml-2">
          <Link href="/profile">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">Edite seu perfil e preferências</p>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        {/* Perfil */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                defaultValue={data?.name ?? ""}
                placeholder="Seu nome completo"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Metas de estudo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="targetScore">Nota alvo (400–1000)</Label>
              <Input
                id="targetScore"
                name="targetScore"
                type="number"
                defaultValue={data?.targetScore ?? 950}
                min={400}
                max={1000}
                step={10}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetCourse">Curso desejado</Label>
              <Input
                id="targetCourse"
                name="targetCourse"
                defaultValue={data?.targetCourse ?? "Medicina"}
                placeholder="Ex: Medicina, Direito, Engenharia"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Faculdade-alvo (Medicina)</Label>
              <FaculdadeCombobox
                key={data?.targetInstitution ?? "empty"}
                defaultValue={data?.targetInstitution}
              />
              <p className="text-xs text-muted-foreground">
                Federais, estaduais e particulares de todo o Brasil. Também dá pra escolher direto no
                início.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="examDate">Data do ENEM</Label>
              <Input
                id="examDate"
                name="examDate"
                type="date"
                defaultValue={data?.examDate ? data.examDate.slice(0, 10) : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dailyStudyGoal">Meta diária (minutos)</Label>
              <Input
                id="dailyStudyGoal"
                name="dailyStudyGoal"
                type="number"
                defaultValue={data?.dailyStudyGoal ?? 120}
                min={30}
                max={720}
                step={30}
              />
            </div>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="theme">Tema</Label>
              <Select name="theme" defaultValue={data?.theme ?? "dark"}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Selecione o tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending} className="w-full gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </form>

      <Separator />

      {/* Logout */}
      <Card className="border-destructive/30">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sair da conta</p>
              <p className="text-xs text-muted-foreground">Você precisará fazer login novamente</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-1.5"
            >
              {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
