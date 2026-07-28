"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createFlashcard } from "@/app/actions/flashcard.actions"

export interface PickTopic {
  id: string
  name: string
  discipline: string
}

interface Props {
  /** Tópico fixo (uso dentro de uma matéria) */
  fixedTopicId?: string
  fixedTopicName?: string
  /** Lista de tópicos para escolher (uso na aba geral) */
  topics?: PickTopic[]
  /** Aparência do botão */
  label?: string
  size?: "sm" | "default"
  variant?: "default" | "outline" | "secondary"
  fullWidth?: boolean
}

export function CreateFlashcardDialog({
  fixedTopicId,
  fixedTopicName,
  topics,
  label = "Criar flashcard",
  size = "default",
  variant = "default",
  fullWidth,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [front, setFront] = useState("")
  const [back, setBack] = useState("")
  const [topicId, setTopicId] = useState(fixedTopicId ?? "")
  const [pending, startTransition] = useTransition()

  const grouped = useMemo(() => {
    if (!topics) return []
    const byDisc = new Map<string, PickTopic[]>()
    for (const t of topics) {
      const arr = byDisc.get(t.discipline) ?? []
      arr.push(t)
      byDisc.set(t.discipline, arr)
    }
    return [...byDisc.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
  }, [topics])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) {
      toast.error("Preencha a frente e o verso")
      return
    }
    startTransition(async () => {
      const res = await createFlashcard({
        front,
        back,
        topicId: fixedTopicId ?? (topicId || null),
      })
      if (res.success) {
        toast.success("Flashcard criado!")
        setFront("")
        setBack("")
        if (!fixedTopicId) setTopicId("")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.error ?? "Erro ao criar")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className={fullWidth ? "w-full gap-1.5" : "gap-1.5"}>
          <Plus className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo flashcard</DialogTitle>
          <DialogDescription>
            {fixedTopicName
              ? `Será adicionado a "${fixedTopicName}".`
              : "Crie um card próprio. Ele entra na sua revisão espaçada (SM-2)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fc-front">Frente (pergunta)</Label>
            <Textarea
              id="fc-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Ex: O que é a função do complexo de Golgi?"
              rows={2}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fc-back">Verso (resposta)</Label>
            <Textarea
              id="fc-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Ex: Modificar, empacotar e endereçar proteínas e lipídios."
              rows={3}
            />
          </div>

          {!fixedTopicId && topics && topics.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="fc-topic">Matéria / conteúdo (opcional)</Label>
              <select
                id="fc-topic"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sem conteúdo (deck pessoal)</option>
                {grouped.map(([disc, ts]) => (
                  <optgroup key={disc} label={disc}>
                    {ts.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending} className="gap-1.5">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar flashcard
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
