"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import {
  BookOpen,
  Clock,
  Lightbulb,
  Star,
  Code2,
  Brain,
  HelpCircle,
  ArrowRight,
  Play,
} from "lucide-react"
import Link from "next/link"
import { VideoList } from "@/components/study/VideoList"
import type { VideoWithWatched } from "@/app/actions/video.actions"

interface TopicContent {
  id: string
  summary: string
  body: string
  keyConcepts: string[]
  tips: string[]
  formulas: string[]
  tricks: string[]
  readTime: number | null
}

interface TopicFlashcard {
  id: string
  front: string
  type: string
}

interface TopicQuestion {
  id: string
  statement: string
  difficulty: string
}

interface Props {
  topicId: string
  content: TopicContent | null
  flashcards: TopicFlashcard[]
  questions: TopicQuestion[]
  pendingReviews: number
  videos: VideoWithWatched[]
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Fácil",
  MEDIUM: "Médio",
  HARD: "Difícil",
  VERY_HARD: "Muito difícil",
}

const DIFFICULTY_CLASS: Record<string, string> = {
  EASY:      "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  MEDIUM:    "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  HARD:      "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  VERY_HARD: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
}

export function TopicTabs({ topicId, content, flashcards, questions, pendingReviews, videos }: Props) {
  return (
    <Tabs defaultValue="teoria">
      <TabsList className="w-full grid grid-cols-5">
        <TabsTrigger value="teoria" className="text-xs sm:text-sm">Teoria</TabsTrigger>
        <TabsTrigger value="resumo" className="text-xs sm:text-sm">Resumo</TabsTrigger>
        <TabsTrigger value="flashcards" className="text-xs sm:text-sm">
          Cards{pendingReviews > 0 ? ` (${pendingReviews})` : ""}
        </TabsTrigger>
        <TabsTrigger value="questoes" className="text-xs sm:text-sm">Quest.</TabsTrigger>
        <TabsTrigger value="videos" className="text-xs sm:text-sm gap-1">
          <Play className="h-3 w-3 fill-current" />
          {videos.length > 0 ? `${videos.length}` : "Vídeos"}
        </TabsTrigger>
      </TabsList>

      {/* ── Teoria ── */}
      <TabsContent value="teoria" className="mt-4">
        {content ? (
          <article>
            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>~{content.readTime ?? 5} min de leitura</span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>{content.body}</ReactMarkdown>
            </div>
          </article>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">Teoria em construção</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              O conteúdo desta seção será gerado automaticamente na Fase 6 do projeto.
            </p>
          </div>
        )}
      </TabsContent>

      {/* ── Resumo ── */}
      <TabsContent value="resumo" className="mt-4 space-y-4">
        {content ? (
          <>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed">{content.summary}</p>
              </CardContent>
            </Card>

            {content.keyConcepts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conceitos-chave
                </h3>
                <div className="flex flex-wrap gap-2">
                  {content.keyConcepts.map((concept) => (
                    <Badge key={concept} variant="secondary" className="text-xs">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {content.formulas.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <Code2 className="h-3.5 w-3.5" />
                  Fórmulas
                </h3>
                <div className="space-y-2">
                  {content.formulas.map((formula, i) => (
                    <div key={i} className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
                      {formula}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {content.tips.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Dicas de prova
                </h3>
                <ul className="space-y-2">
                  {content.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-yellow-500" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {content.tricks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  Macetes e pegadinhas
                </h3>
                <ul className="space-y-2">
                  {content.tricks.map((trick, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Star className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                      {trick}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">Resumo em construção</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              O resumo será gerado automaticamente na Fase 6 do projeto.
            </p>
          </div>
        )}
      </TabsContent>

      {/* ── Flashcards ── */}
      <TabsContent value="flashcards" className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold">{flashcards.length}</span>
            <span className="text-muted-foreground"> flashcards</span>
            {pendingReviews > 0 && (
              <span className="text-warning ml-2">· {pendingReviews} pendentes</span>
            )}
          </div>
          <Button asChild size="sm">
            <Link href={`/flashcards?topicId=${topicId}`}>
              <Brain className="mr-1.5 h-3.5 w-3.5" />
              Iniciar revisão
            </Link>
          </Button>
        </div>

        {flashcards.length > 0 ? (
          <div className="space-y-2">
            {flashcards.map((card) => (
              <Card key={card.id} className="overflow-hidden">
                <CardContent className="py-3 px-4">
                  <p className="text-sm line-clamp-2">{card.front}</p>
                  <Badge variant="secondary" className="text-[10px] mt-1.5">
                    {card.type}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Brain className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum flashcard neste tópico ainda
            </p>
          </div>
        )}
      </TabsContent>

      {/* ── Questões ── */}
      <TabsContent value="questoes" className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold">{questions.length}</span>
            <span className="text-muted-foreground"> questões</span>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/questions?topicId=${topicId}`}>
              Praticar questões
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {questions.length > 0 ? (
          <div className="space-y-2">
            {questions.map((question) => (
              <Link
                key={question.id}
                href={`/questions/${question.id}`}
                className="block rounded-xl border bg-card px-4 py-3 hover:shadow-sm transition-all"
              >
                <p className="text-sm line-clamp-2 mb-2">{question.statement}</p>
                <Badge
                  variant="outline"
                  className={["text-[10px]", DIFFICULTY_CLASS[question.difficulty] ?? ""].join(" ")}
                >
                  {DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhuma questão neste tópico ainda
            </p>
          </div>
        )}
      </TabsContent>

      {/* ── Vídeos ── */}
      <TabsContent value="videos" className="mt-4">
        <VideoList topicId={topicId} initialVideos={videos} />
      </TabsContent>
    </Tabs>
  )
}
