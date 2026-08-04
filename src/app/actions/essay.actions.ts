"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateMimoJSON } from "@/lib/mimo"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { awardXP } from "@/lib/xp"

const createSchema = z.object({
  theme: z.string().min(5).max(300),
  title: z.string().min(3).max(200),
})

export async function createEssay(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const parsed = createSchema.safeParse({
    theme: formData.get("theme"),
    title: formData.get("title"),
  })
  if (!parsed.success) throw new Error("Dados inválidos")

  const essay = await db.essay.create({
    data: {
      userId,
      theme: parsed.data.theme,
      title: parsed.data.title,
      body: "",
    },
    select: { id: true },
  })

  redirect(`/redacao/${essay.id}`)
}

export async function saveEssayBody(
  essayId: string,
  body: string,
  wordCount: number,
  lineCount: number
): Promise<{ saved: boolean }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const essay = await db.essay.findFirst({
    where: { id: essayId, userId: session.user.id },
    select: { id: true },
  })
  if (!essay) return { saved: false }

  await db.essay.update({
    where: { id: essayId },
    data: { body, wordCount, lineCount, updatedAt: new Date() },
  })

  return { saved: true }
}

interface EssayEvaluation {
  comp1: number
  comp2: number
  comp3: number
  comp4: number
  comp5: number
  feedback: string
  suggestionsPerComp: string[]
  errors: string[]
}

/** Gera um tema de redação atual/possível de cair, via IA (como o Mentor). */
export async function generateEssayTheme(): Promise<{ theme?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Não autenticado" }

  const prompt = `Você é um elaborador de provas do ENEM. Proponha UM tema de redação inédito, no estilo ENEM (problema social brasileiro que exige proposta de intervenção), baseado em temas atuais e relevantes da atualidade brasileira que têm chance real de cair na prova.
Regras:
- O tema deve ser uma frase única, no formato do ENEM (ex.: "Desafios para..." / "Caminhos para..." / "O papel de... no Brasil").
- Deve ser socialmente relevante, atual, e permitir proposta de intervenção.
- NÃO repita temas já cobrados pelo ENEM.
Responda SOMENTE JSON: {"theme": "<o tema, uma frase>"}.`

  try {
    const result = await generateMimoJSON<{ theme: string }>(prompt)
    const theme = String(result.theme ?? "").trim().slice(0, 300)
    if (theme.length < 8) return { error: "Não foi possível gerar um tema. Tente de novo." }
    return { theme }
  } catch {
    return { error: "Falha ao gerar o tema. Tente novamente." }
  }
}

export async function evaluateEssay(essayId: string): Promise<{
  success: boolean
  totalScore?: number
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const essay = await db.essay.findFirst({
    where: { id: essayId, userId },
    select: { id: true, theme: true, body: true },
  })
  if (!essay) return { success: false, error: "Redação não encontrada" }
  if (!essay.body || essay.body.trim().length < 50) {
    return { success: false, error: "Redação muito curta para avaliar" }
  }

  const prompt = `Você é um corretor especialista do ENEM. Avalie a redação abaixo seguindo rigorosamente os critérios das 5 competências do ENEM. Cada competência vale de 0 a 200 pontos (use apenas múltiplos de 40: 0, 40, 80, 120, 160 ou 200).

TEMA: ${essay.theme}

REDAÇÃO:
${essay.body}

Retorne SOMENTE JSON válido (sem markdown) no formato exato:
{
  "comp1": <número>,
  "comp2": <número>,
  "comp3": <número>,
  "comp4": <número>,
  "comp5": <número>,
  "feedback": "<parágrafo geral de feedback de até 150 palavras>",
  "suggestionsPerComp": [
    "<sugestão competência 1>",
    "<sugestão competência 2>",
    "<sugestão competência 3>",
    "<sugestão competência 4>",
    "<sugestão competência 5>"
  ],
  "errors": [
    "<erro específico cometido, citando o trecho ou o problema — ex.: 'Desvio gramatical: ...', 'Fuga parcial ao tema em ...', 'Falta de conectivo entre parágrafos', 'Proposta de intervenção sem agente/meio'>"
  ]
}

No campo "errors", liste de 3 a 8 erros concretos e específicos que o aluno cometeu (gramática, coesão, argumentação, tangenciamento, proposta incompleta, etc.), cada um curto e objetivo, como um corretor profissional apontaria. Se a redação for excelente e sem erros relevantes, retorne uma lista vazia.

Competências:
1. Domínio da modalidade escrita formal da língua portuguesa
2. Compreensão da proposta de redação e aplicação de conceitos das áreas do conhecimento
3. Capacidade de selecionar, relacionar, organizar e interpretar informações
4. Conhecimento dos mecanismos linguísticos para construção da argumentação
5. Elaboração de proposta de intervenção para o problema abordado`

  try {
    const result = await generateMimoJSON<EssayEvaluation>(prompt)

    const clamp = (v: number) => {
      const clamped = Math.max(0, Math.min(200, v))
      return Math.round(clamped / 40) * 40
    }

    const c1 = clamp(result.comp1)
    const c2 = clamp(result.comp2)
    const c3 = clamp(result.comp3)
    const c4 = clamp(result.comp4)
    const c5 = clamp(result.comp5)
    const total = c1 + c2 + c3 + c4 + c5

    await db.essay.update({
      where: { id: essayId },
      data: {
        comp1Score: c1,
        comp2Score: c2,
        comp3Score: c3,
        comp4Score: c4,
        comp5Score: c5,
        totalScore: total,
        feedback: result.feedback + "\n\n" + (result.suggestionsPerComp ?? []).join("\n"),
        errors: Array.isArray(result.errors) ? result.errors.slice(0, 8).map(String) : [],
      },
    })

    await awardXP(userId, 20)
    revalidatePath(`/redacao/${essayId}`)
    revalidatePath("/redacao")

    return { success: true, totalScore: total }
  } catch {
    return { success: false, error: "Falha ao avaliar. Tente novamente." }
  }
}

export async function deleteEssay(essayId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await db.essay.deleteMany({
    where: { id: essayId, userId: session.user.id },
  })

  revalidatePath("/redacao")
  redirect("/redacao")
}
