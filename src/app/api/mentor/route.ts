import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .min(1),
  topicId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }
    const userId = session.user.id

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[mentor] GEMINI_API_KEY não configurada")
      return new Response("Configuração de IA ausente", { status: 503 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return new Response("Bad request", { status: 400 })

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return new Response("Bad request", { status: 400 })

    const { messages, topicId } = parsed.data

    // Fetch user context — .catch() prevents DB failures from breaking the response
    const [profile, recentWrong, todayPlanItems, currentTopic] = await Promise.all([
      db.userProfile
        .findUnique({
          where: { userId },
          select: { targetScore: true, streak: true, totalXP: true, currentLevel: true, trail: true },
        })
        .catch(() => null),

      db.userQuestion
        .findMany({
          where: { userId, isCorrect: false },
          orderBy: { answeredAt: "desc" },
          take: 5,
          select: {
            question: {
              select: {
                statement: true,
                topic: { select: { name: true, discipline: { select: { name: true } } } },
              },
            },
          },
        })
        .catch(() => []),

      db.studyPlanItem
        .findMany({
          where: {
            completed: false,
            plan: { userId, isActive: true },
            scheduledAt: {
              gte: new Date(new Date().setUTCHours(0, 0, 0, 0)),
              lte: new Date(new Date().setUTCHours(23, 59, 59, 999)),
            },
          },
          take: 5,
          select: { title: true, duration: true },
        })
        .catch(() => []),

      topicId
        ? db.topic
            .findUnique({
              where: { id: topicId },
              select: {
                name: true,
                discipline: { select: { name: true, area: { select: { name: true } } } },
              },
            })
            .catch(() => null)
        : null,
    ])

    const wrongSummary =
      recentWrong.length > 0
        ? recentWrong
            .map(
              (uq) =>
                `- ${uq.question.topic?.discipline?.name ?? "?"} / ${uq.question.topic?.name ?? "?"}: "${uq.question.statement.slice(0, 80)}…"`
            )
            .join("\n")
        : "Nenhuma questão errada recente."

    const planSummary =
      todayPlanItems.length > 0
        ? todayPlanItems.map((i) => `- ${i.title} (${i.duration}min)`).join("\n")
        : "Nenhum item planejado para hoje."

    const topicContext = currentTopic
      ? `Tópico atual: ${currentTopic.name} (${currentTopic.discipline.name} — ${currentTopic.discipline.area.name})`
      : ""

    const systemPrompt = `Você é o Mentor ENEM, professor especialista que ajuda estudantes a passar no ENEM para Medicina. Seja direto, empático e pedagógico.

PERFIL DO ESTUDANTE:
- Nota alvo: ${profile?.targetScore ?? 900} pts | Trilha: ${profile?.trail ?? "EXTENSIVA"}
- Streak: ${profile?.streak ?? 0} dias | Nível ${profile?.currentLevel ?? 1} (${(profile?.totalXP ?? 0).toLocaleString("pt-BR")} XP)
${topicContext}

ÚLTIMAS QUESTÕES ERRADAS:
${wrongSummary}

PLANO DE HOJE:
${planSummary}

DIRETRIZES: Responda em português brasileiro. Use markdown. Seja conciso (máx 300 palavras). Use dados reais do perfil para motivar. Para flashcards: **Frente:** pergunta \\n **Verso:** resposta`

    // Build prompt with conversation history
    const historyLines = messages.slice(0, -1).map((m) => {
      const role = m.role === "user" ? "Estudante" : "Mentor"
      return `${role}: ${m.content}`
    })
    const historyBlock =
      historyLines.length > 0 ? `\n\nConversa:\n${historyLines.join("\n\n")}\n\n` : "\n\n"
    const lastMessage = messages[messages.length - 1].content
    const fullPrompt = systemPrompt + historyBlock + `Estudante: ${lastMessage}\n\nMentor:`

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
    })

    // Try streaming first; fall back to a single response if streaming fails
    try {
      const result = await model.generateContentStream(fullPrompt)

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text()
              if (text) controller.enqueue(new TextEncoder().encode(text))
            }
          } catch (streamError) {
            console.error("[mentor] stream chunk error:", streamError)
            controller.enqueue(
              new TextEncoder().encode("\n\n_Erro ao processar resposta. Tente novamente._")
            )
          } finally {
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      })
    } catch (streamInitError) {
      // Streaming setup failed — fall back to a complete (non-streaming) response
      console.error("[mentor] streaming init failed, using fallback:", streamInitError)
      const result = await model.generateContent(fullPrompt)
      const text = result.response.text()
      return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }
  } catch (error) {
    console.error("[mentor] unexpected error:", error instanceof Error ? error.message : String(error))
    return new Response(
      "Desculpe, o Mentor está temporariamente indisponível. Tente novamente.",
      { status: 503 }
    )
  }
}
