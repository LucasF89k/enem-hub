import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { mimo, MIMO_MODEL } from '@/lib/mimo'
import { findCurso, estimateCutoff, cursoMedia } from '@/constants/cursos'
import { findUniversidade } from '@/constants/universidades'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, topicId, planner } = await req.json()

    const [profile, wrongQuestions, todayPlan, currentTopic] = await Promise.all([
      db.userProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          targetScore: true,
          targetCourse: true,
          targetInstitution: true,
          trail: true,
          streak: true,
          totalXP: true,
          examDate: true,
          dailyStudyGoal: true,
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

    const curso = findCurso(profile?.targetCourse) ?? findCurso('medicina')!
    const uni = findUniversidade(profile?.targetInstitution)
    const metaFaculdade = uni
      ? `${uni.sigla} (${uni.cidade}/${uni.uf}) — nota de corte estimada ~${estimateCutoff(curso, uni)}`
      : `ainda não definida (corte típico de ${curso.nome} ~${cursoMedia(curso)})`

    const systemPrompt = `Você é o Mentor ENEM, tutor especializado em preparação para o ENEM com foco no curso de ${curso.nome}.
Adapte todos os conselhos, prioridades de estudo e exemplos ao curso de ${curso.nome} e às competências mais cobradas para essa carreira.
Seja didático, direto e motivador. Use exemplos práticos. Responda sempre em português brasileiro.
Use markdown quando útil (listas, negrito). Seja conciso (máx 300 palavras).

${profile ? `PERFIL DO ALUNO:
- Curso desejado: ${curso.nome}
- Universidade-alvo: ${metaFaculdade}
- Meta de nota: ${profile.targetScore} pontos
- ${profile.trail ? trailMessages[profile.trail] ?? profile.trail : ''}
- Streak: ${profile.streak} dias | XP: ${profile.totalXP}
${profile.examDate ? `- ENEM: ${new Date(profile.examDate).toLocaleDateString('pt-BR')}` : ''}` : ''}

${currentTopic ? `TÓPICO ATUAL: ${currentTopic.name} (${currentTopic.discipline.name} — ${currentTopic.discipline.area.name})` : ''}

${wrongQuestions.length > 0 ? `ÚLTIMAS QUESTÕES ERRADAS:
${wrongQuestions.map(q => `- ${q.question?.topic?.discipline?.name ?? '?'} / ${q.question?.topic?.name ?? '?'}`).join('\n')}` : ''}

${todayPlan.length > 0 ? `PLANO DE HOJE:
${todayPlan.map(p => `- ${p.title} (${p.duration}min)`).join('\n')}` : ''}`

    const plannerInstructions = `

MODO PLANEJADOR — MONTAR ROTINA DE ESTUDOS
Seu objetivo agora é ENTREVISTAR o aluno e, ao final, montar uma rotina de estudos personalizada.

Regras da entrevista:
- Faça UMA pergunta por vez, curta e objetiva. NUNCA despeje várias perguntas juntas. Espere a resposta antes da próxima.
- Faça no máximo 5 perguntas. Seja acolhedor e rápido.
- Você JÁ SABE (confirme rapidamente, não pergunte do zero): curso desejado (${curso.nome}), universidade-alvo (${metaFaculdade}), meta de nota (${profile?.targetScore ?? '—'}), meta diária atual (${profile?.dailyStudyGoal ?? 120} min)${profile?.examDate ? `, data do ENEM (${new Date(profile.examDate).toLocaleDateString('pt-BR')})` : ''}.
- Cubra: (1) quantos dias por semana e quanto tempo por dia; (2) matérias/disciplinas em que tem mais dificuldade (priorizar); (3) ponto de partida (começando do zero, revisando, ou reta final); (4) preferência entre mais teoria, equilibrado ou mais questões; (5) alguma restrição de horário/compromisso.

Ao terminar de coletar as respostas:
1. Escreva um resumo curto e motivador do plano em 2-3 frases.
2. Em seguida, emita EXATAMENTE UM bloco de código com a tag vion-plan e um JSON válido (sem comentários), assim:
\`\`\`vion-plan
{"daysCount": 30, "dailyGoalMinutes": 120, "weekDays": [1,2,3,4,5], "focusDisciplines": ["Matemática","Química"], "balance": "equilibrado", "resumo": "..."}
\`\`\`
Regras do JSON:
- weekDays: 0=domingo, 1=segunda, ... 6=sábado.
- daysCount: número de dias até o ENEM (se houver data) ou entre 14 e 45.
- dailyGoalMinutes: minutos por dia combinados.
- focusDisciplines: nomes das matérias a priorizar (as que o aluno tem mais dificuldade).
- balance: "teoria", "equilibrado" ou "questoes".
- Emita o bloco vion-plan UMA ÚNICA VEZ, só quando tiver as respostas, e não escreva nada depois dele.`

    const finalSystem = planner ? systemPrompt + plannerInstructions : systemPrompt

    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const stream = await mimo.chat.completions.create({
      model: MIMO_MODEL,
      messages: [
        { role: 'system', content: finalSystem },
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
