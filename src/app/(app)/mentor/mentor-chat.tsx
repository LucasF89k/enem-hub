"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useMentorStore } from "@/store/mentor-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Send, Loader2, Trash2, Copy, Check, Bot, User } from "lucide-react"
import { useSearchParams } from "next/navigation"

const QUICK_ACTIONS = [
  { label: "Meus pontos fracos", text: "Quais são meus principais pontos fracos com base nas minhas questões erradas? Me dê um plano focado." },
  { label: "O que estudar hoje?", text: "Com base no meu plano de hoje, o que devo estudar primeiro e por quê?" },
  { label: "Me motive!", text: "Dê-me uma mensagem de motivação personalizada para continuar estudando hoje." },
  { label: "Criar 5 flashcards", text: "Crie 5 flashcards de revisão sobre os tópicos em que mais errei." },
  { label: "Dicas de redação", text: "Me dê as principais dicas para tirar nota máxima na redação do ENEM." },
  { label: "Estratégia de prova", text: "Como devo gerir meu tempo durante o ENEM? Me dê uma estratégia prática." },
]

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

  const { messages, isLoading, addMessage, appendToMessage, setLoading, clear } =
    useMentorStore()

  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Show welcome message on first render
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        role: "assistant",
        content:
          "Olá! Sou o **Mentor ENEM**, seu professor particular para Medicina. 🎯\n\nEstou aqui para te ajudar com dúvidas de conteúdo, analisar seus pontos fracos, criar flashcards e muito mais.\n\nO que você precisa hoje?",
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      setInput("")

      // Add user message
      addMessage({ role: "user", content: trimmed })

      // Add empty assistant message for streaming
      const assistantId = addMessage({ role: "assistant", content: "" })

      setLoading(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        // Build conversation history for API (skip the initial welcome message)
        const apiMessages = [
          ...messages.filter((m) => !(m.role === "assistant" && m.content.includes("Sou o **Mentor ENEM**"))),
          { role: "user" as const, content: trimmed },
        ]

        const response = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, topicId }),
          signal: controller.signal,
        })

        if (!response.ok) {
          appendToMessage(assistantId, "Desculpe, ocorreu um erro. Tente novamente.")
          return
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          appendToMessage(assistantId, chunk)
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          appendToMessage(assistantId, "\n\n*Erro de conexão. Tente novamente.*")
        }
      } finally {
        setLoading(false)
        abortRef.current = null
      }
    },
    [isLoading, messages, topicId, addMessage, appendToMessage, setLoading]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleQuickAction(text: string) {
    setInput(text)
    textareaRef.current?.focus()
  }

  function handleStop() {
    abortRef.current?.abort()
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-0px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Mentor ENEM</p>
            <p className="text-[10px] text-muted-foreground">Powered by Gemini</p>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2.5",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted rounded-tl-sm"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content || "▌"}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}

              {msg.role === "assistant" && msg.content && !isLoading && (
                <div className="flex justify-end mt-1">
                  <CopyButton text={msg.content} />
                </div>
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
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
      <div className="px-4 pb-4 pt-2 shrink-0 border-t">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao Mentor ENEM… (Enter para enviar)"
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
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="shrink-0 h-11 w-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}
