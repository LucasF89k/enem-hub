import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { mimo, MIMO_MODEL } from '@/lib/mimo'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, topicId } = await req.json()

    const [profile, wrongQuestions, todayPlan, currentTopic] = await Promise.all([
      db.userProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          targetScore: true,
          targetCourse: true,
          trail: true,
          streak: true,
          totalXP: true,
          examDate: true,
        },
      }).catch(() => null),

      db.userQuestion.findMany({
        where: { userId: session.user.id, isCorrect: false },
        orderBy: { answeredAt: 'desc' },
        take: 5,
        include: {
          question: {
            select: { topic: { select: { name: true, discipline: { select: { name: true } } } } },
          },
        },
      }).catch(() => []),

      db.studyPlanItem.findMany({
        where: {
          plan: { userId: session.user.id, isActive: true },
          scheduledAt: {
            gte: new Date(new Date().setUTCHours(0, 0, 0, 0)),
            lte: new Date(new Date().setUTCHours(23, 59, 59, 999)),
          },
          completed: false,
        },
        take: 3,
        select: { title: true, type: true, duration: true },
      }).catch(() => []),

      topicId
        ? db.topic.findUnique({
            where: { id: topicId },
            select: {
              name: true,
              discipline: { select: { name: true, area: { select: { name: true } } } },
            },
          }).catch(() => null)
        : null,
    ])

    const trailMessages: Record<string, string> = {
      EXTENSIVA: 'Trilha Extensiva — construa base sólida.',
      SEMI_EXTENSIVA: 'Trilha Semi-extensiva — equilibre teoria e prática.',
      INTENSIVA: 'Trilha Intensiva — seja direto, priorize tópicos mais cobrados.',
      SPRINT: 'Trilha Sprint — foque APENAS em questões e revisão. Zero teoria nova.',
    }

    const systemPrompt = `Você é o Mentor ENEM, tutor especializado em preparação para o ENEM com foco em Medicina.
Seja didático, direto e motivador. Use exemplos práticos. Responda sempre em português brasileiro.
Use markdown quando útil (listas, negrito). Seja conciso (máx 300 palavras).

${profile ? `PERFIL DO ALUNO:
- Meta: ${profile.targetScore} pontos em ${profile.targetCourse ?? 'Medicina'}
- ${profile.trail ? trailMessages[profile.trail] ?? profile.trail : ''}
- Streak: ${profile.streak} dias | XP: ${profile.totalXP}
${profile.examDate ? `- ENEM: ${new Date(profile.examDate).toLocaleDateString('pt-BR')}` : ''}` : ''}

${currentTopic ? `TÓPICO ATUAL: ${currentTopic.name} (${currentTopic.discipline.name} — ${currentTopic.discipline.area.name})` : ''}

${wrongQuestions.length > 0 ? `ÚLTIMAS QUESTÕES ERRADAS:
${wrongQuestions.map(q => `- ${q.question?.topic?.discipline?.name ?? '?'} / ${q.question?.topic?.name ?? '?'}`).join('\n')}` : ''}

${todayPlan.length > 0 ? `PLANO DE HOJE:
${todayPlan.map(p => `- ${p.title} (${p.duration}min)`).join('\n')}` : ''}`

    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const stream = await mimo.chat.completions.create({
      model: MIMO_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedMessages,
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(new TextEncoder().encode(text))
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('[Mentor MiMo Error]:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      `Erro ao chamar MiMo: ${message}`,
      { status: 500 }
    )
  }
}
