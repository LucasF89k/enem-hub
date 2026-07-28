"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createEssay, generateEssayTheme } from "@/app/actions/essay.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Loader2 } from "lucide-react"
import { TEMAS_HISTORICOS } from "@/constants/redacao-bank"

export function NewEssayForm() {
  const [theme, setTheme] = useState("")
  const [title, setTitle] = useState("")
  const [generating, startGenerate] = useTransition()

  function gerarTema() {
    startGenerate(async () => {
      const res = await generateEssayTheme()
      if (res.theme) {
        setTheme(res.theme)
        if (!title.trim()) setTitle("Redação — tema do Mentor")
        toast.success("Tema gerado pelo Mentor!")
      } else {
        toast.error(res.error ?? "Falha ao gerar o tema")
      }
    })
  }

  function escolherHistorico(ano: number, tema: string) {
    setTheme(tema)
    if (!title.trim()) setTitle(`Redação — ENEM ${ano}`)
  }

  return (
    <div className="space-y-6">
      {/* Gerar com o Mentor */}
      <button
        type="button"
        onClick={gerarTema}
        disabled={generating}
        className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 text-left transition-colors hover:bg-primary/10 disabled:opacity-60"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          {generating ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {generating ? "Gerando tema…" : "Gerar tema com o Mentor"}
          </p>
          <p className="text-xs text-muted-foreground">
            Um tema atual, no estilo ENEM, que pode cair na prova
          </p>
        </div>
      </button>

      <form action={createEssay} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="theme">Tema da redação</Label>
          <Input
            id="theme"
            name="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Ex: Desafios para a valorização da cultura indígena no Brasil"
            required
            minLength={5}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Título (como você quer chamar)</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Minha redação — Tema 2024"
            required
            minLength={3}
          />
        </div>

        <Button type="submit" className="w-full">
          Começar a escrever
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Temas históricos do ENEM ({TEMAS_HISTORICOS.length})
        </p>
        <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
          {TEMAS_HISTORICOS.map((t) => (
            <Card
              key={t.ano}
              onClick={() => escolherHistorico(t.ano, t.tema)}
              className="cursor-pointer transition-colors hover:border-primary/40"
            >
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{t.ano}</p>
                <p className="text-sm">{t.tema}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
