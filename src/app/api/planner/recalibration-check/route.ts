import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
// Provedor de IA: trocar para o MiMo depois é só mudar esta importação/função.
import { generateJSON } from "@/lib/gemini"
import { rateLimit } from "@/lib/rate-limit"

interface Verdict {
  recommend: boolean
  reason: string
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 horas

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })
  const userId = session.user.id

  // Cinto de segurança contra chamadas em rajada a esta rota. O cache de 6h e
  // o pré-filtro abaixo já evitam a maioria das idas à IA; este limite cobre
  // o caso de alguém forçar a barra manipulando o estado pra furar o cache.
  const limite = await rateLimit("recal-check", userId, 30, 60 * 60 * 1000)
  if (!limite.allowed) {
    return NextResponse.json({ recommend: false, reason: "Aguarde para reavaliar." } satisfies Verdict)
  }

  const plan = await db.studyPlan.findFirst({
    where: { userId, isActive: true },
    select: {
      id: true,
      createdAt: true,
      recalCheckedAt: true,
      recalRecommend: true,
      recalReason: true,
      recalSignature: true,
    },
    orderBy: { createdAt: "desc" },
  })
  if (!plan) {
    return NextResponse.json({ recommend: false, reason: "Nenhum plano ativo." } satisfies Verdict)
  }

  const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0))

  // Sinais baratos (contagens) que formam a "assinatura" do desempenho atual.
  const [answeredSinceCount, overdue, completedCount] = await Promise.all([
    db.userQuestion.count({ where: { userId, answeredAt: { gt: plan.createdAt } } }),
    db.studyPlanItem.count({
      where: { planId: plan.id, completed: false, scheduledAt: { lt: todayStart } },
    }),
    db.studyPlanItem.count({ where: { planId: plan.id, completed: true } }),
  ])
  const signature = `${answeredSinceCount}:${overdue}:${completedCount}`

  // Cache válido: mesma assinatura e dentro do TTL → reaproveita, sem chamar a IA.
  const fresh =
    plan.recalCheckedAt && Date.now() - plan.recalCheckedAt.getTime() < CACHE_TTL_MS
  if (fresh && plan.recalSignature === signature) {
    return NextResponse.json({
      recommend: plan.recalRecommend,
      reason: plan.recalReason ?? "",
    } satisfies Verdict)
  }

  const persist = (v: Verdict) =>
    db.studyPlan
      .update({
        where: { id: plan.id },
        data: {
          recalCheckedAt: new Date(),
          recalSignature: signature,
          recalRecommend: v.recommend,
          recalReason: v.reason,
        },
      })
      .catch(() => {})

  // Pré-filtro barato: sem dados suficientes, não chama a IA.
  if (answeredSinceCount < 8 && overdue < 3) {
    const v: Verdict = {
      recommend: false,
      reason: "Ainda sem desempenho suficiente para reavaliar. Siga o plano.",
    }
    await persist(v)
    return NextResponse.json(v)
  }

  // Desempenho recente por matéria + foco atual do plano (para a IA analisar).
  const [answered, planItems] = await Promise.all([
    db.userQuestion.findMany({
      where: { userId, answeredAt: { gt: plan.createdAt } },
      select: {
        isCorrect: true,
        question: { select: { topic: { select: { discipline: { select: { name: true } } } } } },
      },
      orderBy: { answeredAt: "desc" },
      take: 300,
    }),
    db.studyPlanItem.findMany({
      where: { planId: plan.id, topicId: { not: null } },
      select: { topic: { select: { discipline: { select: { name: true } } } } },
    }),
  ])

  const perDisc = new Map<string, { correct: number; total: number }>()
  for (const a of answered) {
    const name = a.question?.topic?.discipline?.name ?? "Outros"
    const e = perDisc.get(name) ?? { correct: 0, total: 0 }
    e.total++
    if (a.isCorrect) e.correct++
    perDisc.set(name, e)
  }
  const desempenho = [...perDisc.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, s]) => `- ${name}: ${Math.round((s.correct / s.total) * 100)}% (${s.total} questões)`)
    .join("\n")

  const focoCount = new Map<string, number>()
  for (const it of planItems) {
    const name = it.topic?.discipline?.name
    if (name) focoCount.set(name, (focoCount.get(name) ?? 0) + 1)
  }
  const foco = [...focoCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([n]) => n)
    .join(", ")

  const daysIn = Math.max(0, Math.floor((Date.now() - plan.createdAt.getTime()) / 86_400_000))

  const prompt = `Você é o Mentor de estudos para o ENEM. Decida se vale RECALIBRAR o plano do aluno AGORA.
Recalibrar = reordenar as prioridades para focar nas matérias com pior desempenho recente.

DADOS DO ALUNO:
- Dias desde a criação do plano: ${daysIn}
- Itens atrasados não concluídos: ${overdue}
- Foco atual do plano (matérias priorizadas): ${foco || "não definido"}
- Desempenho recente por matéria:
${desempenho || "- (sem questões respondidas)"}

REGRAS:
- Recomende recalibrar (true) se houver matérias com desempenho claramente fraco (ex.: <60%) que NÃO estão no foco atual, OU se houver muitos itens atrasados, OU se o desempenho mudou bastante desde o início.
- NÃO recomende (false) se o aluno vai bem em geral, se as matérias fracas já são o foco, ou se há poucos dados.

Responda SOMENTE JSON: {"recommend": boolean, "reason": "frase curta em português do Brasil, no máximo 140 caracteres, explicando a decisão de forma motivadora"}.`

  let verdict: Verdict
  try {
    const raw = await generateJSON<Verdict>(prompt)
    verdict = { recommend: !!raw.recommend, reason: String(raw.reason ?? "").slice(0, 200) }
  } catch {
    const recommend = overdue >= 4 || answeredSinceCount >= 15
    verdict = {
      recommend,
      reason: recommend
        ? "Seu desempenho recente sugere reorganizar as prioridades."
        : "Você está no caminho, siga o plano.",
    }
  }

  await persist(verdict)
  return NextResponse.json(verdict)
}
