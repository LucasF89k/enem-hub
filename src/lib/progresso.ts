import { db } from "@/lib/db"

/**
 * Conjunto de tópicos que o aluno já estudou.
 *
 * Antes cada tela de estudo montava um `WHERE userId = ? AND topicId IN (...)`
 * com a lista inteira de ids vinda do catálogo: centenas de ids viajando na
 * query. Além do tamanho, StudySession só tem índice em `userId` e em
 * `(userId, date)`, nenhum em `topicId`, então o banco usava o índice de
 * usuário e filtrava o resto do jeito mais caro possível.
 *
 * Aqui a leitura é só pelo `userId` (usando o índice que existe), com
 * `distinct` pra trazer cada tópico uma vez só. O cruzamento com o catálogo
 * acontece em memória, sobre dois conjuntos pequenos. O resultado é o mesmo,
 * com uma query mais simples e que de fato usa índice.
 *
 * Não entra em cache de propósito: é dado por usuário e muda toda vez que
 * ele estuda algo, então tem que refletir na hora.
 */
export async function getTopicosEstudados(userId: string): Promise<Set<string>> {
  const sessoes = await db.studySession.findMany({
    where: { userId, topicId: { not: null } },
    select: { topicId: true },
    distinct: ["topicId"],
  })

  const set = new Set<string>()
  for (const s of sessoes) {
    if (s.topicId) set.add(s.topicId)
  }
  return set
}
