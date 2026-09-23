"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

/**
 * Direitos do titular dos dados (LGPD, Art. 18).
 *
 * Duas operações: baixar tudo que o app guarda sobre a pessoa
 * (portabilidade, Art. 18 V) e apagar a conta (eliminação, Art. 18 VI).
 *
 * As duas pedem a senha de novo antes de executar. Só ter a sessão aberta
 * não basta: são ações destrutivas ou que expõem o histórico inteiro, e um
 * celular desbloqueado esquecido na mesa não pode ser suficiente pra
 * qualquer uma das duas.
 */

/** Tudo que o app guarda sobre a pessoa, num objeto serializável. */
export interface DadosExportados {
  exportadoEm: string
  conta: unknown
  perfil: unknown
  sessoesDeEstudo: unknown[]
  questoesRespondidas: unknown[]
  revisoesDeFlashcard: unknown[]
  simulados: unknown[]
  redacoes: unknown[]
  anotacoes: unknown[]
  videosAssistidos: unknown[]
  conquistas: unknown[]
}

/**
 * Confere a senha antes de uma operação sensível.
 *
 * Contas criadas por provedor externo (Google) não têm senha no banco. Nesse
 * caso não dá pra exigir uma, então o gesto de confirmação fica por conta da
 * tela (digitar o próprio e-mail).
 */
async function conferirSenha(
  userId: string,
  senha: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  })

  if (!user) return { ok: false, erro: "Conta não encontrada." }

  // Sem senha cadastrada: login por provedor externo.
  if (!user.password) return { ok: true }

  const confere = await bcrypt.compare(senha, user.password)
  if (!confere) return { ok: false, erro: "Senha incorreta." }

  return { ok: true }
}

/**
 * Exporta os dados da pessoa (LGPD Art. 18 V, portabilidade).
 *
 * Traz o histórico inteiro, não uma amostra: é o que a lei pede. A senha
 * (mesmo em hash) fica de fora de propósito, porque não é dado que sirva à
 * pessoa e é material de ataque se o arquivo vazar.
 */
export async function exportarMeusDados(
  senha: string,
): Promise<{ success: boolean; dados?: DadosExportados; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autorizado" }
  const userId = session.user.id

  const check = await conferirSenha(userId, senha)
  if (!check.ok) return { success: false, error: check.erro }

  try {
    const [
      conta,
      perfil,
      sessoesDeEstudo,
      questoesRespondidas,
      revisoesDeFlashcard,
      simulados,
      redacoes,
      anotacoes,
      videosAssistidos,
      conquistas,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        // password fica de fora: não serve à pessoa e é risco se vazar.
        select: { id: true, name: true, email: true, image: true, createdAt: true },
      }),
      db.userProfile.findUnique({ where: { userId } }),
      db.studySession.findMany({ where: { userId } }),
      db.userQuestion.findMany({ where: { userId } }),
      db.flashcardReview.findMany({ where: { userId } }),
      db.userSimulado.findMany({ where: { userId }, include: { answers: true } }),
      db.essay.findMany({ where: { userId } }),
      db.note.findMany({ where: { userId } }),
      db.videoWatched.findMany({ where: { userId } }),
      db.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
    ])

    return {
      success: true,
      dados: {
        exportadoEm: new Date().toISOString(),
        conta,
        perfil,
        sessoesDeEstudo,
        questoesRespondidas,
        revisoesDeFlashcard,
        simulados,
        redacoes,
        anotacoes,
        videosAssistidos,
        conquistas,
      },
    }
  } catch {
    return { success: false, error: "Não foi possível gerar seus dados agora." }
  }
}

/**
 * Apaga a conta e tudo que está ligado a ela (LGPD Art. 18 VI).
 *
 * Quase todas as relações do schema usam `onDelete: Cascade`, então apagar o
 * User leva junto sessões de estudo, respostas, revisões, simulados,
 * redações, anotações e conquistas.
 *
 * A exceção é FlashcardDeck, que usa `onDelete: SetNull` porque um deck pode
 * ser público e estar em uso por outras pessoas: apagar a conta de quem criou
 * não pode destruir o material alheio. Só que, pra LGPD, deixar o deck
 * PRIVADO da pessoa órfão no banco seria manter dado dela depois do pedido de
 * eliminação. Então os privados são apagados explicitamente antes, e só os
 * públicos ficam, já desvinculados do titular.
 */
export async function excluirMinhaConta(
  senha: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autorizado" }
  const userId = session.user.id

  const check = await conferirSenha(userId, senha)
  if (!check.ok) return { success: false, error: check.erro }

  try {
    await db.$transaction([
      // Decks privados: sem isso ficariam órfãos (SetNull), ou seja, dado da
      // pessoa sobrevivendo à exclusão da conta.
      db.flashcardDeck.deleteMany({ where: { userId, isPublic: false } }),
      // O resto cai por cascata junto com o User.
      db.user.delete({ where: { id: userId } }),
    ])

    return { success: true }
  } catch {
    return { success: false, error: "Não foi possível excluir a conta agora." }
  }
}
