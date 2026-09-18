"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { saveEssayBody, evaluateEssay } from "@/app/actions/essay.actions"
import { toast } from "sonner"
import { CONECTIVOS, ESTRUTURAS_PROPOSTA, REPERTORIOS } from "@/constants/redacao-bank"
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Clock,
  Timer,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { XpBadge } from "@/components/gamification/XpBadge"

const ESSAY_DURATION_MS = 2 * 60 * 60 * 1000 // 2 horas

function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

interface EssayEditorProps {
  essayId: string
  theme: string
  title: string
  initialBody: string
  comp1Score: number | null
  comp2Score: number | null
  comp3Score: number | null
  comp4Score: number | null
  comp5Score: number | null
  totalScore: number | null
  feedback: string | null
  errors: string[]
}

const COMP_LABELS = [
  "Domínio da norma culta",
  "Compreensão da proposta",
  "Organização das informações",
  "Mecanismos linguísticos",
  "Proposta de intervenção",
]

const MAX_LINES = 30

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function countLines(text: string) {
  if (!text) return 0
  return text.split("\n").length
}

function SaveStatus({ status }: { status: "saved" | "saving" | "unsaved" }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Salvando…
      </span>
    )
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-green-500" /> Salvo
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" /> Não salvo
    </span>
  )
}

export function EssayEditor({
  essayId,
  theme,
  title,
  initialBody,
  comp1Score,
  comp2Score,
  comp3Score,
  comp4Score,
  comp5Score,
  totalScore,
  feedback,
  errors,
}: EssayEditorProps) {
  const router = useRouter()
  const [body, setBody] = useState(initialBody)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved")
  // Vem direto das props (não é useState): depois de handleEvaluate chamar
  // router.refresh(), o Server Component pai busca as notas atualizadas no
  // banco e manda como prop de novo. Se isso fosse estado local, o valor
  // ficaria travado no que veio no primeiro render e nunca mostraria a
  // correção nova sem um reload manual da página.
  const scores = {
    comp1: comp1Score,
    comp2: comp2Score,
    comp3: comp3Score,
    comp4: comp4Score,
    comp5: comp5Score,
    total: totalScore,
    feedback,
  }
  const [isEvaluating, startEvaluate] = useTransition()
  const [evalError, setEvalError] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Cronômetro de prova: 2h, contando a partir da primeira vez que abriu esta redação.
  const [remaining, setRemaining] = useState<number>(ESSAY_DURATION_MS)
  useEffect(() => {
    const key = `vion-essay-deadline-${essayId}`
    let deadline = Number(localStorage.getItem(key))
    if (!deadline || Number.isNaN(deadline)) {
      deadline = Date.now() + ESSAY_DURATION_MS
      localStorage.setItem(key, String(deadline))
    }
    const tick = () => setRemaining(deadline - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [essayId])
  const expired = remaining <= 0

  const words = countWords(body)
  const lines = countLines(body)
  const lineNumbers = Array.from({ length: Math.max(lines, 10) }, (_, i) => i + 1)

  const triggerSave = useCallback(
    (text: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSaveStatus("unsaved")
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving")
        await saveEssayBody(essayId, text, countWords(text), countLines(text))
        setSaveStatus("saved")
      }, 30000)
    },
    [essayId]
  )

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value)
    triggerSave(e.target.value)
  }

  async function handleSaveNow() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus("saving")
    await saveEssayBody(essayId, body, words, lines)
    setSaveStatus("saved")
  }

  function handleEvaluate() {
    setEvalError(null)
    startEvaluate(async () => {
      await handleSaveNow()
      const result = await evaluateEssay(essayId)
      if (!result.success) {
        setEvalError(result.error ?? "Falha ao avaliar")
        toast.error("Não foi possível avaliar a redação. Tente novamente.")
        return
      }
      toast.success("Redação avaliada com sucesso!")
      router.refresh()
    })
  }

  // Sync textarea and line numbers scroll
  function handleScroll() {
    const lineNumEl = document.getElementById("line-numbers")
    if (lineNumEl && textareaRef.current) {
      lineNumEl.scrollTop = textareaRef.current.scrollTop
    }
  }

  const hasScores = scores.total !== null

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 shrink-0">
            <Link href="/redacao">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{theme}</p>
            <p className="text-sm font-medium truncate">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs font-semibold tabular-nums",
              expired
                ? "border-red-500/40 bg-red-500/10 text-red-500"
                : remaining < 120_000
                  ? "text-red-500"
                  : remaining < 600_000
                    ? "text-amber-500"
                    : "text-muted-foreground",
            )}
            title="Tempo de prova (2h)"
          >
            {expired ? <AlertTriangle className="h-3.5 w-3.5" /> : <Timer className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{expired ? "Tempo esgotado" : formatCountdown(remaining)}</span>
            <span className="sm:hidden">{expired ? "0:00" : formatCountdown(remaining)}</span>
          </span>
          <SaveStatus status={saveStatus} />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Banco</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] sm:w-[400px] p-0">
              <SheetHeader className="px-4 pt-4 pb-2">
                <SheetTitle>Banco de apoio</SheetTitle>
              </SheetHeader>
              <Tabs defaultValue="repertorios" className="flex flex-col h-full">
                <TabsList className="mx-4 shrink-0">
                  <TabsTrigger value="repertorios" className="text-xs">Repertórios</TabsTrigger>
                  <TabsTrigger value="conectivos" className="text-xs">Conectivos</TabsTrigger>
                  <TabsTrigger value="propostas" className="text-xs">Propostas</TabsTrigger>
                </TabsList>
                <TabsContent value="repertorios" className="flex-1 overflow-y-auto px-4 pb-8 mt-3 space-y-3">
                  {REPERTORIOS.map((r, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs font-semibold text-primary">{r.fonte}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">&ldquo;{r.trecho}&rdquo;</p>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="conectivos" className="flex-1 overflow-y-auto px-4 pb-8 mt-3 space-y-4">
                  {Object.entries(CONECTIVOS).map(([func, words]) => (
                    <div key={func}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 capitalize">
                        {func.replace("ao", "ão").replace("icao", "icação").replace("ade", "ade")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {words.map((w) => (
                          <span key={w} className="text-xs bg-muted rounded px-2 py-0.5">{w}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="propostas" className="flex-1 overflow-y-auto px-4 pb-8 mt-3 space-y-3">
                  {ESTRUTURAS_PROPOSTA.map((p, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span><strong>Agente:</strong> {p.agente}</span>
                        <span><strong>Ação:</strong> {p.acao}</span>
                        <span><strong>Modo:</strong> {p.modo}</span>
                        <span><strong>Finalidade:</strong> {p.finalidade}</span>
                      </div>
                      <p className="text-xs text-muted-foreground italic leading-relaxed border-t pt-1.5">
                        {p.exemplo}
                      </p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Editor */}
      <div className="flex flex-1 overflow-hidden font-mono">
        {/* Line numbers */}
        <div
          id="line-numbers"
          className="hidden sm:flex flex-col items-end py-4 pr-3 pl-3 overflow-hidden bg-muted/30 border-r text-muted-foreground text-xs leading-[1.8rem] select-none shrink-0 w-10"
          style={{ overflowY: "hidden" }}
        >
          {lineNumbers.map((n) => (
            <span key={n} className={cn(n > MAX_LINES && "text-red-500")}>{n}</span>
          ))}
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleChange}
            onScroll={handleScroll}
            placeholder={"Escreva sua introdução aqui…\n\nLembre-se:\n• Apresente o tema e contextualize.\n• Tese clara no último parágrafo da introdução."}
            className="w-full h-full resize-none border-0 outline-none bg-background px-4 py-4 text-base leading-[1.8rem] font-serif"
            spellCheck
            autoFocus
            style={{ lineHeight: "1.8rem" }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-background px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{words} palavras</span>
          <span className={cn("font-medium", lines > MAX_LINES && "text-red-500")}>
            {lines}/{MAX_LINES} linhas
          </span>
          {lines > MAX_LINES && (
            <span className="text-red-500 font-medium">Limite excedido!</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <XpBadge xp={20} />
          <Button variant="outline" size="sm" onClick={handleSaveNow} disabled={saveStatus === "saved"}>
            Salvar agora
          </Button>
          <Button size="sm" onClick={handleEvaluate} disabled={isEvaluating || words < 50} className="gap-1">
            {isEvaluating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                O Mentor está corrigindo…
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Avaliar redação
              </>
            )}
          </Button>
        </div>
      </div>

      {evalError && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-sm text-red-600 dark:text-red-400">
          {evalError}
        </div>
      )}

      {/* Scores */}
      {hasScores && (
        <div className="border-t bg-muted/20 px-4 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Resultado da avaliação</h3>
            <span className={cn(
              "text-xl font-bold",
              (scores.total ?? 0) >= 800 ? "text-green-500" : (scores.total ?? 0) >= 600 ? "text-yellow-500" : "text-red-500"
            )}>
              {scores.total}/1000
            </span>
          </div>

          <div className="space-y-3">
            {[scores.comp1, scores.comp2, scores.comp3, scores.comp4, scores.comp5].map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">C{i + 1}: {COMP_LABELS[i]}</span>
                  <span className="font-medium text-xs">{s ?? 0}/200</span>
                </div>
                <Progress value={((s ?? 0) / 200) * 100} className="h-2" />
              </div>
            ))}
          </div>

          {errors && errors.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-red-500">
                <XCircle className="h-4 w-4" />
                Erros identificados ({errors.length})
              </p>
              <ul className="space-y-1.5">
                {errors.map((err, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm"
                  >
                    <span className="mt-0.5 text-red-500">•</span>
                    <span className="text-foreground/90">{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scores.feedback && (
            <div className="rounded-xl bg-muted/40 border p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {scores.feedback}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
