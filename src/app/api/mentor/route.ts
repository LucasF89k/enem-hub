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
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Não autorizado", { status: 401 })
  }
  const userId = session.user.id

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("[mentor] GEMINI_API_KEY não configurada nas variáveis de ambiente")
    return new Response(
      "GEMINI_API_KEY não configurada. Adicione a variável no Vercel → Settings → Environment Variables.",
      { status: 503 }
    )
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response("Body inválido (não é JSON)", { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return new Response(`Parâmetros inválidos: ${parsed.error.message}`, { status: 400 })
  }

  const { messages, topicId } = parsed.data

  // ── User context (DB failures don't break the response) ───────────────────
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

  // ── Build prompt ──────────────────────────────────────────────────────────
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

PERFIL: nota alvo ${profile?.targetScore ?? 900}pts | trilha ${profile?.trail ?? "EXTENSIVA"} | streak ${profile?.streak ?? 0} dias | nível ${profile?.currentLevel ?? 1} (${(profile?.totalXP ?? 0).toLocaleString("pt-BR")} XP)
${topicContext}

ÚLTIMAS QUESTÕES ERRADAS:
${wrongSummary}

PLANO DE HOJE:
${planSummary}

Responda em português brasileiro, use markdown, seja conciso (máx 300 palavras). Para flashcards: **Frente:** pergunta \\n **Verso:** resposta`

  const historyLines = messages.slice(0, -1).map((m) => {
    const role = m.role === "user" ? "Estudante" : "Mentor"
    return `${role}: ${m.content}`
  })
  const historyBlock =
    historyLines.length > 0 ? `\n\nConversa anterior:\n${historyLines.join("\n\n")}\n\n` : "\n\n"
  const lastMessage = messages[messages.length - 1].content
  const fullPrompt = systemPrompt + historyBlock + `Estudante: ${lastMessage}\n\nMentor:`

  // ── Call Gemini ───────────────────────────────────────────────────────────
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
  })

  // Try streaming; if it fails at any point, fall back to a complete response
  try {
    const streamResult = await model.generateContentStream(fullPrompt)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text()
            if (text) controller.enqueue(encoder.encode(text))
          }
        } catch (err) {
          console.error("[mentor] chunk stream error:", err)
          // Don't enqueue error text — the partial response already has content
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch (streamErr) {
    console.error("[mentor] streaming failed, trying non-streaming fallback:", streamErr)

    try {
      const result = await model.generateContent(fullPrompt)
      const text = result.response.text()
      return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("[mentor] generateContent also failed:", msg)
      return new Response(
        `Erro ao chamar Gemini: ${msg}`,
        { status: 503 }
      )
    }
  }
}
