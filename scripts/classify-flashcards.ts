/**
 * Classifica flashcards sem tópico (topicId null) lendo o CONTEÚDO de cada card
 * e escolhendo a matéria/conteúdo (Topic) correto via IA (Gemini).
 *
 * Resumível: só pega cards com topicId null; ao classificar, seta topicId, então
 * re-rodar continua de onde parou. Para/segue conforme a cota da IA.
 *
 * Uso: npx tsx scripts/classify-flashcards.ts [--limit=N] [--batch=25]
 */
import { PrismaClient } from "@prisma/client"
import { generateJSON } from "../src/lib/gemini"

const db = new PrismaClient()

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=") as [string, string]),
  )
  const batchSize = args.batch ? parseInt(args.batch) : 15
  const limit = args.limit ? parseInt(args.limit) : Infinity

  // Referência: todos os tópicos numerados (Matéria > Conteúdo)
  const topics = await db.topic.findMany({
    select: { id: true, name: true, discipline: { select: { name: true } } },
    orderBy: [{ discipline: { name: "asc" } }, { name: "asc" }],
  })
  const refList = topics
    .map((t, i) => `${i + 1}. ${t.discipline?.name ?? "Outros"} > ${t.name}`)
    .join("\n")
  console.log(`📚  ${topics.length} tópicos de referência`)

  const pendingWhere = {
    topicId: null,
    deckId: { not: null },
    NOT: { tags: { has: "sem-categoria" } },
  } as const

  const totalPending = await db.flashcard.count({ where: pendingWhere })
  console.log(`🗂️   ${totalPending} flashcards para classificar\n`)

  let processed = 0
  let classified = 0
  let lastKey = ""
  let batchFails = 0

  while (processed < limit) {
    const cards = await db.flashcard.findMany({
      where: pendingWhere,
      select: { id: true, front: true, back: true },
      take: batchSize,
    })
    if (cards.length === 0) break

    // Detecta lote "preso" (mesmo primeiro card falhando repetido) e o pula.
    const key = cards[0].id
    if (key !== lastKey) {
      lastKey = key
      batchFails = 0
    }

    const cardsBlock = cards
      .map(
        (c, i) =>
          `[${i + 1}] FRENTE: ${stripHtml(c.front).slice(0, 200)} | VERSO: ${stripHtml(c.back).slice(0, 200)}`,
      )
      .join("\n")

    const prompt = `Você classifica flashcards de estudo do ENEM na matéria e conteúdo corretos.

CONTEÚDOS DISPONÍVEIS (número. Matéria > Conteúdo):
${refList}

Analise o assunto de cada flashcard abaixo e escolha o NÚMERO do conteúdo que MELHOR corresponde ao tema do card. Se realmente nenhum servir, use 0.

FLASHCARDS:
${cardsBlock}

Responda SOMENTE um array JSON, um item por flashcard, no formato:
[{"card": 1, "topico": <número do conteúdo>}, {"card": 2, "topico": <número>}]`

    let result: { card: number; topico: number }[]
    try {
      result = await generateJSON<{ card: number; topico: number }[]>(prompt)
      if (!Array.isArray(result)) throw new Error("resposta não é array")
    } catch (e) {
      const msg = (e as Error).message
      const isQuota = /429|quota|rate|exhaust|resource/i.test(msg)
      batchFails++
      // Lote persistente com falha de parse → marca sem-categoria e segue.
      if (!isQuota && batchFails >= 3) {
        await Promise.all(
          cards.map((c) =>
            db.flashcard.update({ where: { id: c.id }, data: { tags: { set: ["sem-categoria"] } } }),
          ),
        )
        console.log(`⏭️   lote pulado após ${batchFails} falhas de parse`)
        processed += cards.length
        continue
      }
      const wait = isQuota ? 60 : 6
      console.log(`⚠️  ${isQuota ? "cota/limite" : "parse"} (${msg.slice(0, 60)}). Aguardando ${wait}s…`)
      await new Promise((r) => setTimeout(r, wait * 1000))
      continue
    }

    const updates: Promise<unknown>[] = []
    for (const r of result) {
      const card = cards[r.card - 1]
      if (!card) continue
      const t = topics[r.topico - 1]
      if (r.topico >= 1 && t) {
        updates.push(db.flashcard.update({ where: { id: card.id }, data: { topicId: t.id } }))
        classified++
      } else {
        // Não classificado nesta passada — marca com tag para não travar o loop.
        updates.push(
          db.flashcard.update({
            where: { id: card.id },
            data: { tags: { set: ["sem-categoria"] } },
          }),
        )
      }
    }
    await Promise.all(updates)

    processed += cards.length
    console.log(
      `[${processed}/${totalPending}] lote de ${cards.length} → ${classified} classificados`,
    )
    await new Promise((r) => setTimeout(r, 1500)) // respeita rate limit
  }

  console.log(`\n✅  Concluído: ${classified} classificados nesta rodada.`)
  await db.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await db.$disconnect()
  process.exit(1)
})
