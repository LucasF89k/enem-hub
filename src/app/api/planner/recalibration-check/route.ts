import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
// Provedor de IA — trocar para o MiMo depois é só mudar esta importação/função.
import { generateJSON } from "@/lib/gemini"

interface Verdict {
  recommend: boolean
  reason: string
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })
  const userId = session.user.id

  const plan = await db.studyPlan.findFirst({
    where: { userId, isActive: true },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
  if (!plan) {
    return NextResponse.json({ recommend: false, reason: "Nenhum plano ativo." } satisfies Verdict)
  }

  const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0))

  const [overdue, answered, planItems] = await Promise.all([
    db.studyPlanItem.count({
      where: { planId: plan.id, completed: false, scheduledAt: { lt: todayStart } },
    }),
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

  // Pré-filtro barato: sem dados suficientes, não chama a IA.
  if (answered.length < 8 && overdue < 3) {
    return NextResponse.json({
      recommend: false,
      reason: "Ainda sem desempenho suficiente para reavaliar. Siga o plano.",
    } satisfies Verdict)
  }

  // Acurácia por matéria (desempenho recente).
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

  // Foco atual do plano (matérias mais priorizadas).
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

  try {
    const verdict = await generateJSON<Verdict>(prompt)
    return NextResponse.json({
      recommend: !!verdict.recommend,
      reason: String(verdict.reason ?? "").slice(0, 200),
    } satisfies Verdict)
  } catch {
    // Fallback: heurística simples se a IA falhar.
    const recommend = overdue >= 4 || answered.length >= 15
    return NextResponse.json({
      recommend,
      reason: recommend
        ? "Seu desempenho recente sugere reorganizar as prioridades."
        : "Você está no caminho — siga o plano.",
    } satisfies Verdict)
  }
}
