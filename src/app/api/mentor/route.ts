import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import OpenAI from 'openai'
import { geminiKeys, geminiChatModelWithKey } from '@/lib/gemini'
import { mimoKeys, mimoClientWithKey, MIMO_MODEL } from '@/lib/mimo'
import { findCurso, estimateCutoff, cursoMedia } from '@/constants/cursos'
import { findUniversidade } from '@/constants/universidades'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, topicId, planner, image } = await req.json()

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

Sempre que você CRIAR flashcards para o aluno, além de mostrá-los no texto, emita ao FINAL da resposta EXATAMENTE UM bloco de código com a tag vion-flashcards contendo um array JSON válido, assim:
\`\`\`vion-flashcards
[{"front":"pergunta do card","back":"resposta do card"}]
\`\`\`
Emita esse bloco só quando realmente criar flashcards, uma única vez, e não escreva nada depois dele.

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

    // Anexo (imagem/PDF) da última mensagem do usuário.
    const hasAttach = typeof image === 'string' && /^data:(image\/|application\/pdf)/.test(image)
    const attachIsImage = hasAttach && (image as string).startsWith('data:image/')

    // Mensagens no formato OpenAI (MiMo). MiMo lê imagem nativamente; PDF não →
    // nesse caso vai só o texto e o Gemini (fallback) é quem lê o PDF.
    const buildOpenAIMessages = (): OpenAI.Chat.ChatCompletionMessageParam[] => {
      const arr: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: finalSystem },
      ]
      const list = messages as { role: string; content: string }[]
      list.forEach((m, i) => {
        const role = m.role === 'assistant' ? 'assistant' : 'user'
        const isLast = i === list.length - 1
        if (isLast && role === 'user' && attachIsImage) {
          arr.push({
            role: 'user',
            content: [
              { type: 'text', text: m.content },
              { type: 'image_url', image_url: { url: image as string } },
            ],
          })
        } else {
          arr.push({ role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)
        }
      })
      return arr
    }

    // Conteúdo no formato Gemini (fallback) — aceita imagem e PDF.
    type Part = { text: string } | { inlineData: { mimeType: string; data: string } }
    const buildGeminiContents = () => {
      const contents = (messages as { role: string; content: string }[]).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }] as Part[],
      }))
      if (hasAttach) {
        const img = image as string
        const mimeType = img.slice(5, img.indexOf(';')) || 'image/jpeg'
        const data = img.slice(img.indexOf(',') + 1)
        const last = contents[contents.length - 1]
        if (last && last.role === 'user' && data) {
          last.parts.push({ inlineData: { mimeType, data } })
        }
      }
      return contents
    }

    // Geradores de stream (yield de deltas de texto).
    async function* mimoGen(apiKey: string): AsyncGenerator<string> {
      const client = mimoClientWithKey(apiKey)
      const stream = await client.chat.completions.create({
        model: MIMO_MODEL,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
        messages: buildOpenAIMessages(),
      })
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) yield delta
      }
    }
    async function* geminiGen(apiKey: string): AsyncGenerator<string> {
      const model = geminiChatModelWithKey(apiKey, finalSystem)
      const result = await model.generateContentStream({ contents: buildGeminiContents() })
      for await (const chunk of result.stream) {
        const t = chunk.text?.() ?? ''
        if (t) yield t
      }
    }

    // Ordem dos provedores: MiMo (rotação de chaves) → Gemini (fallback).
    // Cada provedor só é "confirmado" quando o primeiro chunk chega; se estourar
    // cota/erro antes disso, rotaciona pro próximo sem o usuário perceber.
    const starters: Array<() => AsyncGenerator<string>> = [
      ...mimoKeys().map((k) => () => mimoGen(k)),
      ...geminiKeys().map((k) => () => geminiGen(k)),
    ]
    if (starters.length === 0) {
      throw new Error('Nenhuma chave de IA configurada (MIMO_API_KEYS ou GEMINI_API_KEYS)')
    }

    let gen: AsyncGenerator<string> | null = null
    let firstChunk: IteratorResult<string> | null = null
    let lastErr: unknown = null
    for (const start of starters) {
      try {
        const g = start()
        const first = await g.next() // 429/erro estoura aqui → tenta o próximo provedor
        gen = g
        firstChunk = first
        break
      } catch (e) {
        lastErr = e
        continue
      }
    }
    if (!gen || !firstChunk) throw lastErr ?? new Error('Falha ao iniciar o Mentor')

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        try {
          let res = firstChunk!
          while (!res.done) {
            if (res.value) controller.enqueue(enc.encode(res.value))
            res = await gen!.next()
          }
        } catch {
          /* erro no meio do stream — encerra o que já veio */
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('[Mentor Error]:', error)
    const status = (error as { status?: number })?.status
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    const isQuota =
      status === 429 ||
      /429|quota|rate.?limit|RESOURCE_EXHAUSTED|Too Many Requests|insufficient/i.test(message)
    return new Response(
      isQuota
        ? '⚠️ O Mentor atingiu o limite de uso gratuito por enquanto. Tente novamente em alguns minutos.'
        : `Erro ao chamar o Mentor. Tente novamente.`,
      { status: isQuota ? 429 : 500 },
    )
  }
}
