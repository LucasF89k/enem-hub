"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { OpalCrystal } from "@/components/OpalCrystal"
import remarkGfm from "remark-gfm"
import { useMentorStore } from "@/store/mentor-store"
import { fileToAttachment, isImageDataUrl, ATTACH_ACCEPT } from "@/lib/attach"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Send, Loader2, Trash2, Copy, Check, User, CalendarCheck, ArrowRight, Layers, ImagePlus, X, FileText } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  applyMentorPlan,
  applyImportedPlan,
  type ImportedPlanInput,
} from "@/app/actions/planner.actions"
import { saveMentorFlashcards } from "@/app/actions/flashcard.actions"

const QUICK_ACTIONS = [
  { label: "Meus pontos fracos", text: "Quais são meus principais pontos fracos com base nas minhas questões erradas? Me dê um plano focado." },
  { label: "O que estudar hoje?", text: "Com base no meu plano de hoje, o que devo estudar primeiro e por quê?" },
  { label: "Me motive!", text: "Dê-me uma mensagem de motivação personalizada para continuar estudando hoje." },
  { label: "Criar 5 flashcards", text: "Crie 5 flashcards de revisão sobre os tópicos em que mais errei." },
  { label: "Dicas de redação", text: "Me dê as principais dicas para tirar nota máxima na redação do ENEM." },
  { label: "Estratégia de prova", text: "Como devo gerir meu tempo durante o ENEM? Me dê uma estratégia prática." },
]

/** Mascote no cabeçalho do Mentor. */
function MentorMascot({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mascote/icone.png"
      alt="Mentor Vion"
      className="shrink-0 rounded-xl object-cover"
      style={{ width: size, height: size }}
    />
  )
}

/** Avatar das bolhas do chat: a gema de opala ondulando (slime). */
function MentorAvatar({ size = 32, slime = false }: { size?: number; slime?: boolean }) {
  return (
    <span className="shrink-0" style={{ width: size, height: size }}>
      <OpalCrystal size={size} stage={3} slime={slime} icon />
    </span>
  )
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1.5" aria-label="digitando">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  )
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const BALANCE_LABELS: Record<string, string> = {
  teoria: "Mais teoria",
  equilibrado: "Equilibrado",
  questoes: "Mais questões",
}

interface VionPlan {
  daysCount?: number
  dailyGoalMinutes?: number
  weekDays?: number[]
  focusDisciplines?: string[]
  balance?: "teoria" | "equilibrado" | "questoes"
  resumo?: string
}

/** Extrai o bloco ```vion-plan``` de uma mensagem; remove-o do texto exibido. */
function extractVionPlan(content: string): { plan: VionPlan | null; cleaned: string } {
  const closed = /```vion-plan\s*([\s\S]*?)```/i
  const m = content.match(closed)
  if (m) {
    let plan: VionPlan | null = null
    try {
      plan = JSON.parse(m[1].trim())
    } catch {
      plan = null
    }
    return { plan, cleaned: content.replace(closed, "").trim() }
  }
  // Bloco ainda em streaming (sem fechamento): oculta a cauda crua
  const open = content.search(/```vion-plan/i)
  if (open >= 0) return { plan: null, cleaned: content.slice(0, open).trim() }
  return { plan: null, cleaned: content }
}

interface FlashcardDraft {
  front: string
  back: string
}

/** Extrai o bloco ```vion-flashcards``` de uma mensagem; remove-o do texto exibido. */
function extractVionFlashcards(content: string): { cards: FlashcardDraft[] | null; cleaned: string } {
  const closed = /```vion-flashcards\s*([\s\S]*?)```/i
  const m = content.match(closed)
  if (m) {
    let cards: FlashcardDraft[] | null = null
    try {
      const parsed = JSON.parse(m[1].trim())
      if (Array.isArray(parsed)) {
        cards = parsed
          .filter((c) => c && typeof c.front === "string" && typeof c.back === "string")
          .map((c) => ({ front: String(c.front), back: String(c.back) }))
        if (cards.length === 0) cards = null
      }
    } catch {
      cards = null
    }
    return { cards, cleaned: content.replace(closed, "").trim() }
  }
  const open = content.search(/```vion-flashcards/i)
  if (open >= 0) return { cards: null, cleaned: content.slice(0, open).trim() }
  return { cards: null, cleaned: content }
}

interface ImportedPlan {
  title?: string
  days: { date: string; items: { title: string; type: string; duration?: number }[] }[]
}

/** Extrai o bloco ```vion-plano-folha``` (plano transcrito de uma foto). */
function extractVionPlanoFolha(content: string): { plan: ImportedPlan | null; cleaned: string } {
  const closed = /```vion-plano-folha\s*([\s\S]*?)```/i
  const m = content.match(closed)
  if (m) {
    let plan: ImportedPlan | null = null
    try {
      const parsed = JSON.parse(m[1].trim())
      if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) plan = parsed
    } catch {
      plan = null
    }
    return { plan, cleaned: content.replace(closed, "").trim() }
  }
  const open = content.search(/```vion-plano-folha/i)
  if (open >= 0) return { plan: null, cleaned: content.slice(0, open).trim() }
  return { plan: null, cleaned: content }
}

function ApplyImportedPlanCard({ plan }: { plan: ImportedPlan }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")
  const totalItems = plan.days.reduce((n, d) => n + (d.items?.length ?? 0), 0)

  async function apply() {
    setState("loading")
    const res = await applyImportedPlan(plan as ImportedPlanInput)
    if (res.success) {
      setState("done")
      toast.success("Plano da folha aplicado no seu Planner!")
    } else {
      setState("idle")
      toast.error(res.error ?? "Não foi possível aplicar o plano")
    }
  }

  return (
    <div className="mt-2 rounded-2xl border bg-background p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <CalendarCheck className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-semibold">
          {plan.title?.trim() || "Plano da folha"} · {plan.days.length} dias, {totalItems} atividades
        </p>
      </div>
      {state === "done" ? (
        <Button asChild className="w-full gap-1.5">
          <Link href="/planner">
            Ver no Planner
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button onClick={apply} disabled={state === "loading"} className="w-full gap-1.5">
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
          Aplicar plano da folha
        </Button>
      )}
    </div>
  )
}

function SaveFlashcardsCard({ cards, topicId }: { cards: FlashcardDraft[]; topicId?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")

  async function save() {
    setState("loading")
    const res = await saveMentorFlashcards(cards, topicId ?? null)
    if (res.success) {
      setState("done")
      toast.success(`${res.count} flashcards salvos no seu baralho!`)
    } else {
      setState("idle")
      toast.error(res.error ?? "Não foi possível salvar")
    }
  }

  return (
    <div className="mt-2 rounded-2xl border bg-background p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Layers className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-semibold">{cards.length} flashcards prontos</p>
      </div>
      {state === "done" ? (
        <Button asChild className="w-full gap-1.5">
          <Link href="/flashcards">
            Ver no baralho
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button onClick={save} disabled={state === "loading"} className="w-full gap-1.5">
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
          Salvar no meu baralho
        </Button>
      )}
    </div>
  )
}

function ApplyPlanCard({ plan }: { plan: VionPlan }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")

  async function apply() {
    setState("loading")
    const res = await applyMentorPlan(plan)
    if (res.success) {
      setState("done")
      toast.success("Rotina aplicada no seu Planner!")
    } else {
      setState("idle")
      toast.error(res.error ?? "Não foi possível aplicar o plano")
    }
  }

  const days = (plan.weekDays ?? []).map((d) => WEEKDAY_LABELS[d]).join(" · ")

  return (
    <div className="mt-2 rounded-2xl border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <CalendarCheck className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-semibold">Rotina proposta</p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground">Dias</span>
        <span className="text-right font-medium">{days || "-"}</span>
        <span className="text-muted-foreground">Tempo/dia</span>
        <span className="text-right font-medium">{plan.dailyGoalMinutes} min</span>
        <span className="text-muted-foreground">Duração</span>
        <span className="text-right font-medium">{plan.daysCount} dias</span>
        <span className="text-muted-foreground">Ênfase</span>
        <span className="text-right font-medium">{BALANCE_LABELS[plan.balance ?? "equilibrado"]}</span>
        {plan.focusDisciplines && plan.focusDisciplines.length > 0 && (
          <>
            <span className="text-muted-foreground">Foco</span>
            <span className="text-right font-medium">{plan.focusDisciplines.join(", ")}</span>
          </>
        )}
      </div>

      {state === "done" ? (
        <Button asChild className="mt-4 w-full gap-1.5">
          <Link href="/planner">
            Ver no Planner
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button onClick={apply} disabled={state === "loading"} className="mt-4 w-full gap-1.5">
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
          Aplicar esta rotina
        </Button>
      )}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
      title="Copiar"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export function MentorChat() {
  const searchParams = useSearchParams()
  const topicId = searchParams.get("topicId") ?? undefined
  const planner = searchParams.get("planner") === "1"

  const { messages, isLoading, addMessage, appendToMessage, dropIfEmpty, setLoading, clear } =
    useMentorStore()
  const pending = useMentorStore((s) => s.pending)
  const setPending = useMentorStore((s) => s.setPending)

  const [input, setInput] = useState("")
  const [imageData, setImageData] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const streamingIdRef = useRef<string | null>(null)
  const startedRef = useRef(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Lê a foto/arquivo escolhido para um data URL (imagem redimensionada ou PDF).
  async function handleImagePick(file: File | undefined | null) {
    const data = await fileToAttachment(file)
    if (data) setImageData(data)
  }

  // Show welcome message on first render (fora do modo planner)
  useEffect(() => {
    if (messages.length === 0 && !planner) {
      addMessage({
        role: "assistant",
        content:
          "Olá! Sou o **Mentor ENEM**, seu professor particular. 🎯\n\nEstou aqui para te ajudar com dúvidas de conteúdo, analisar seus pontos fracos, criar flashcards e muito mais.\n\nO que você precisa hoje?",
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(
    async (text: string, opts?: { fresh?: boolean; image?: string | null }) => {
      const trimmed = text.trim()
      const img = opts?.image ?? null
      if ((!trimmed && !img) || isLoading) return

      setInput("")
      setImageData(null)

      // Início limpo (ex.: entrevista do planner): descarta histórico anterior
      if (opts?.fresh) clear()

      // Texto enviado ao modelo (Gemini exige um texto mesmo quando só há imagem)
      const promptText = trimmed || "Analise esta imagem e me ajude (resolva/explique a questão)."

      // Add user message
      addMessage({ role: "user", content: trimmed, image: img ?? undefined })

      // Add empty assistant message for streaming
      const assistantId = addMessage({ role: "assistant", content: "" })
      streamingIdRef.current = assistantId

      setLoading(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        // Build conversation history for API (skip the initial welcome message)
        const apiMessages = opts?.fresh
          ? [{ role: "user" as const, content: promptText }]
          : [
              ...messages
                .filter(
                  (m) => !(m.role === "assistant" && m.content.includes("Sou o **Mentor ENEM**")),
                )
                .map((m) => ({ role: m.role, content: m.content })),
              { role: "user" as const, content: promptText },
            ]

        const response = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, topicId, planner, image: img }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "")
          if (response.status === 403) {
            try {
              const parsed = JSON.parse(errorBody) as { error?: string; mensagem?: string }
              if (parsed.error === "limite_free") {
                appendToMessage(
                  assistantId,
                  `⚠️ ${parsed.mensagem ?? "Limite diário atingido."}\n\n[👑 Assinar Vion Pro](/assine)`,
                )
                return
              }
            } catch {
              // body não era JSON, usa o fallback abaixo
            }
          }
          const errorMsg = errorBody.trim() || `Erro ${response.status}`
          console.error("[Mentor] API error:", response.status, errorBody)
          appendToMessage(assistantId, `⚠️ ${errorMsg}`)
          return
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()

        let received = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          received += chunk.length
          appendToMessage(assistantId, chunk)
        }

        // Stream fechou sem nenhum token: sem isto a bolha ficava vazia e os
        // pontinhos rodavam indefinidamente, dando a impressão de que o Mentor
        // simplesmente ignorou a mensagem.
        if (received === 0) {
          appendToMessage(
            assistantId,
            "⚠️ Não consegui gerar uma resposta agora. Tente enviar de novo.",
          )
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          appendToMessage(assistantId, "\n\n*Erro de conexão. Tente novamente.*")
        }
      } finally {
        setLoading(false)
        abortRef.current = null
        streamingIdRef.current = null
      }
    },
    [isLoading, messages, topicId, planner, addMessage, appendToMessage, setLoading, clear]
  )

  // Modo planner: inicia a entrevista automaticamente uma única vez (começo limpo)
  useEffect(() => {
    if (planner && !startedRef.current) {
      startedRef.current = true
      sendMessage(
        "Quero montar minha rotina de estudos com você. Pode me fazer algumas perguntas rápidas e depois montar meu plano?",
        { fresh: true },
      )
    }
  }, [planner, sendMessage])

  // Envio pendente vindo de outra tela (ex.: foto da redação para corrigir)
  useEffect(() => {
    if (pending && !startedRef.current) {
      startedRef.current = true
      const p = pending
      setPending(null)
      sendMessage(p.text, { image: p.image })
    }
  }, [pending, sendMessage, setPending])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input, { image: imageData })
    }
  }

  function handleQuickAction(text: string) {
    setInput(text)
    textareaRef.current?.focus()
  }

  function handleStop() {
    abortRef.current?.abort()
    // Se nada chegou a ser escrito, remove a bolha, do contrário sobra uma
    // bolha vazia do assistente no histórico depois do stop.
    if (streamingIdRef.current) dropIfEmpty(streamingIdRef.current)
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-30 flex min-h-0 flex-col overflow-hidden bg-background"
      style={{ bottom: "calc(3.5rem + max(env(safe-area-inset-bottom), 0.5rem))" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <div className="flex items-center gap-2">
          <MentorMascot size={30} />
          <div>
            <p className="text-sm font-semibold leading-none">Mentor ENEM</p>
            <p className="text-[10px] text-muted-foreground">Seu tutor pessoal</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="gap-1 text-muted-foreground"
          disabled={isLoading}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Limpar</span>
        </Button>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2.5",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && <MentorAvatar size={32} slime />}

            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted rounded-tl-sm"
              )}
            >
              {msg.role === "assistant" ? (
                (() => {
                  const { plan, cleaned: afterPlan } = extractVionPlan(msg.content)
                  const { plan: folha, cleaned: afterFolha } = extractVionPlanoFolha(afterPlan)
                  const { cards, cleaned } = extractVionFlashcards(afterFolha)
                  return (
                    <>
                      {cleaned ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleaned}</ReactMarkdown>
                        </div>
                      ) : isLoading ? (
                        <TypingDots />
                      ) : (
                        // Sem conteúdo e sem carregamento = foi interrompido.
                        // Antes isto caía direto no <TypingDots />, então os
                        // pontinhos ficavam rodando para sempre depois do stop.
                        <span className="text-xs italic text-muted-foreground">
                          Resposta interrompida.
                        </span>
                      )}
                      {plan && !isLoading && <ApplyPlanCard plan={plan} />}
                      {folha && !isLoading && <ApplyImportedPlanCard plan={folha} />}
                      {cards && !isLoading && <SaveFlashcardsCard cards={cards} topicId={topicId} />}
                      {cleaned && !isLoading && (
                        <div className="flex justify-end mt-1">
                          <CopyButton text={cleaned} />
                        </div>
                      )}
                    </>
                  )
                })()
              ) : (
                <>
                  {msg.image &&
                    (isImageDataUrl(msg.image) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={msg.image}
                        alt="Imagem enviada"
                        className={cn(
                          "rounded-lg max-w-full max-h-64 object-contain",
                          msg.content && "mb-2",
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-lg bg-background/20 px-3 py-2",
                          msg.content && "mb-2",
                        )}
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="text-xs">Arquivo PDF enviado</span>
                      </div>
                    ))}
                  {msg.content && (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </>
              )}
            </div>

            {msg.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2.5 justify-start">
            <MentorAvatar size={32} slime />
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick action chips */}
      <div className="px-4 py-2 border-t shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.text)}
              disabled={isLoading}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors shrink-0 disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-2 pt-2 shrink-0 border-t">
        {/* Preview do anexo (imagem ou PDF) */}
        {imageData && (
          <div className="mb-2 relative inline-block">
            {isImageDataUrl(imageData) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageData}
                alt="Anexo"
                className="h-20 w-20 object-cover rounded-lg border"
              />
            ) : (
              <div className="h-20 w-28 rounded-lg border flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
                <FileText className="h-6 w-6" />
                <span className="text-[10px]">Arquivo PDF</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setImageData(null)}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center shadow"
              aria-label="Remover anexo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input
            ref={imageInputRef}
            type="file"
            accept={ATTACH_ACCEPT}
            className="hidden"
            onChange={(e) => {
              handleImagePick(e.target.files?.[0])
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            disabled={isLoading}
            className="shrink-0 h-11 w-11"
            aria-label="Anexar foto ou arquivo"
            title="Anexar foto ou arquivo"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao Mentor ENEM…"
            className="resize-none min-h-[44px] max-h-32 text-sm"
            rows={1}
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              variant="outline"
              size="icon"
              onClick={handleStop}
              className="shrink-0 h-11 w-11"
            >
              <div className="h-3.5 w-3.5 bg-foreground rounded-sm" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => sendMessage(input, { image: imageData })}
              disabled={!input.trim() && !imageData}
              className="shrink-0 h-11 w-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
