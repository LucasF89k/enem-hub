import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .min(1),
  topicId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }
  const userId = session.user.id

  if (!process.env.GEMINI_API_KEY) {
    console.error("[mentor] GEMINI_API_KEY não configurada")
    return new Response("Configuração de IA ausente", { status: 503 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return new Response("Bad request", { status: 400 })

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return new Response("Bad request", { status: 400 })
  }

  const { messages, topicId } = parsed.data

  // Build user context — .catch(() => fallback) prevents DB failures from breaking the request
  const [profile, recentWrong, todayPlanItems, currentTopic] = await Promise.all([
    db.userProfile
      .findUnique({
        where: { userId },
        select: { targetScore: true, streak: true, totalXP: true, currentLevel: true },
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
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        take: 5,
        select: { title: true, type: true, duration: true },
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

  // Compose system prompt
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
    ? `Tópico atual do usuário: ${currentTopic.name} (${currentTopic.discipline.name} — ${currentTopic.discipline.area.name})`
    : ""

  const systemPrompt = `Você é o Mentor ENEM, um professor especialista e motivador que ajuda estudantes a passar no ENEM para Medicina. Você é direto, empático e pedagógico.

PERFIL DO ESTUDANTE:
- Nota alvo: ${profile?.targetScore ?? 900} pontos
- Streak: ${profile?.streak ?? 0} dias consecutivos de estudo
- Nível: ${profile?.currentLevel ?? 1} (${(profile?.totalXP ?? 0).toLocaleString("pt-BR")} XP total)
${topicContext}

ÚLTIMAS 5 QUESTÕES ERRADAS:
${wrongSummary}

PLANO DE HOJE:
${planSummary}

DIRETRIZES:
- Responda sempre em português brasileiro
- Use markdown para formatar (negrito, listas, títulos)
- Seja conciso: máx 300 palavras por resposta, salvo quando explicar um tópico
- Quando explicar conteúdo, use exemplos do cotidiano e analogias
- Se o estudante errou questões, priorize explicar esses tópicos
- Ao sugerir o que estudar, considere o plano do dia
- Incentive sem ser genérico: use os dados reais do perfil
- Para criar flashcards, formate como: **Frente:** pergunta \\n **Verso:** resposta`

  // Build full prompt: system + conversation history + last message
  const historyLines = messages.slice(0, -1).map((m) => {
    const role = m.role === "user" ? "Estudante" : "Mentor"
    return `${role}: ${m.content}`
  })
  const historyText =
    historyLines.length > 0 ? `\n\nHistórico da conversa:\n${historyLines.join("\n\n")}\n\n` : "\n\n"

  const lastMessage = messages[messages.length - 1].content
  const fullPrompt = systemPrompt + historyText + `Estudante: ${lastMessage}\n\nMentor:`

  // Use generateContentStream — more reliable than startChat across all SDK versions
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
  })

  let result
  try {
    result = await model.generateContentStream(fullPrompt)
  } catch (error) {
    console.error("[mentor] Gemini API error:", error instanceof Error ? error.message : String(error))
    return new Response(
      "Desculpe, o Mentor está temporariamente indisponível. Verifique sua conexão e tente novamente.",
      { status: 503 }
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
      } catch (streamError) {
        console.error("[mentor] stream error:", streamError)
        controller.enqueue(
          encoder.encode("\n\n_Erro ao processar resposta. Por favor, tente novamente._")
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  })
}
