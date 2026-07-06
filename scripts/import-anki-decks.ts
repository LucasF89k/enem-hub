/**
 * scripts/import-anki-decks.ts
 * Importa decks Anki (.apkg) de "fonte de conteudo/" como FlashcardDeck + Flashcard.
 *
 * Suporta os dois formatos de .apkg:
 *  - Anki 2.1.50+: coleção comprimida em zstd em "collection.anki21b" (schema novo,
 *    tabela "decks" própria)
 *  - Anki antigo: SQLite puro em "collection.anki21" ou "collection.anki2"
 *    (decks ficam num blob JSON na coluna col.decks)
 *
 * Usage:
 *   npx tsx scripts/import-anki-decks.ts --dry-run
 *   npx tsx scripts/import-anki-decks.ts --all
 */

import "dotenv/config"
import { PrismaClient, FlashcardType } from "@prisma/client"
import AdmZip from "adm-zip"
import initSqlJs, { type Database } from "sql.js"
import { decompress } from "fzstd"
import { generateMimoJSON } from "../src/lib/mimo"
import { discoverFiles } from "./lib/discover-files"
import { parseCliFlags, sleep, tokenSet, jaccard } from "./lib/extract-text"

const db = new PrismaClient()

const DEDUP_THRESHOLD = 0.6
const GENERIC_DECK_NAME = "Importados do Anki"

const flags = parseCliFlags(process.argv.slice(2))
const isDryRun = flags["dry-run"] === true
const isAll = flags["all"] === true

if (!isDryRun && !isAll) {
  console.error("❌  Passe --dry-run ou --all")
  process.exit(1)
}

function stripHtml(raw: string): string {
  return raw
    .replace(/\[sound:[^\]]+\]/gi, "")
    .replace(/<img[^>]*>/gi, "[imagem]")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(div|p)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

interface AnkiNote {
  front: string
  back: string
  isCloze: boolean
  deckName: string
}

async function loadAnkiDb(SQL: Awaited<ReturnType<typeof initSqlJs>>, zip: AdmZip): Promise<Database | null> {
  const b21b = zip.getEntry("collection.anki21b")
  if (b21b) {
    try {
      const raw = decompress(b21b.getData())
      return new SQL.Database(raw)
    } catch {
      /* fall through */
    }
  }
  const b21 = zip.getEntry("collection.anki21")
  if (b21) return new SQL.Database(b21.getData())
  const b2 = zip.getEntry("collection.anki2")
  if (b2) return new SQL.Database(b2.getData())
  return null
}

function readDeckNames(sdb: Database): Map<number, string> {
  const map = new Map<number, string>()
  try {
    const res = sdb.exec("SELECT id, name FROM decks")
    for (const row of res[0]?.values ?? []) {
      map.set(Number(row[0]), String(row[1]).replace(/\x1f/g, " :: "))
    }
    if (map.size > 0) return map
  } catch {
    /* old schema — fall back to col.decks JSON blob */
  }

  try {
    const res = sdb.exec("SELECT decks FROM col LIMIT 1")
    const raw = res[0]?.values[0]?.[0]
    if (typeof raw === "string" && raw.length > 0) {
      const parsed = JSON.parse(raw) as Record<string, { id: number; name: string }>
      for (const deck of Object.values(parsed)) {
        map.set(deck.id, deck.name.replace(/\x1f/g, " :: "))
      }
    }
  } catch {
    /* give up — everything goes to "Default" */
  }
  return map
}

async function extractNotes(filePath: string): Promise<AnkiNote[]> {
  const SQL = await initSqlJs()
  const zip = new AdmZip(filePath)
  const sdb = await loadAnkiDb(SQL, zip)
  if (!sdb) return []

  const deckNames = readDeckNames(sdb)

  const cardToDeck = new Map<number, number>()
  const cardsRes = sdb.exec("SELECT nid, did FROM cards")
  for (const row of cardsRes[0]?.values ?? []) {
    const nid = Number(row[0])
    if (!cardToDeck.has(nid)) cardToDeck.set(nid, Number(row[1]))
  }

  const notesRes = sdb.exec("SELECT id, flds FROM notes")
  const notes: AnkiNote[] = []
  for (const row of notesRes[0]?.values ?? []) {
    const nid = Number(row[0])
    const flds = String(row[1])
    const fields = flds.split("\x1f")
    const front = stripHtml(fields[0] ?? "")
    const back = stripHtml(fields.slice(1).join(" ") ?? "")
    if (!front || front.length < 3) continue

    const isCloze = /\{\{c\d+::/i.test(flds)
    const deckId = cardToDeck.get(nid)
    const deckName = (deckId !== undefined ? deckNames.get(deckId) : undefined) ?? "Default"

    notes.push({ front, back, isCloze, deckName })
  }

  sdb.close()
  return notes
}

// ── Topic mapping (cached per unique deck name to limit MiMo calls) ─────────
async function buildTopicMapper(topics: { id: string; name: string }[]) {
  const cache = new Map<string, string | null>()
  const topicList = topics.map((t) => t.name).join(", ")

  return async function mapDeckToTopic(deckName: string, sampleFront: string): Promise<string | null> {
    if (cache.has(deckName)) return cache.get(deckName) ?? null

    try {
      const prompt = `Você mapeia decks de flashcard do Anki para o tópico de estudo correto de uma lista fixa.

Lista de tópicos disponíveis: ${topicList}

Nome do deck Anki: "${deckName}"
Exemplo de card desse deck (frente): "${sampleFront.slice(0, 200)}"

Retorne SOMENTE um JSON: {"topicName": string} — o nome EXATO de um tópico da lista acima que melhor corresponde, ou {"topicName": "NENHUM"} se nenhum corresponder claramente.`
      const result = await generateMimoJSON<{ topicName: string }>(prompt, 256)
      const match = topics.find((t) => t.name === result.topicName)
      const topicId = match?.id ?? null
      cache.set(deckName, topicId)
      return topicId
    } catch {
      cache.set(deckName, null)
      return null
    }
  }
}

async function main() {
  const files = discoverFiles("ANKI")
  console.log(`🃏  ${files.length} arquivos .apkg encontrados\n`)

  if (isDryRun) {
    let totalNotes = 0
    for (const file of files) {
      const notes = await extractNotes(file.fullPath)
      totalNotes += notes.length
      console.log(`  ${file.relPath} — ${notes.length} notas`)
    }
    console.log("\n" + "─".repeat(50))
    console.log(`🔍  DRY RUN — nenhum salvamento`)
    console.log(`   Total de arquivos: ${files.length}`)
    console.log(`   Total de notas:    ${totalNotes}`)
    await db.$disconnect()
    return
  }

  const topics = await db.topic.findMany({ select: { id: true, name: true } })
  const mapDeckToTopic = await buildTopicMapper(topics)

  const existingFrontsByTopic = new Map<string, Set<string>[]>()
  async function getExistingTokenSets(topicId: string | null): Promise<Set<string>[]> {
    const key = topicId ?? "__generic__"
    if (existingFrontsByTopic.has(key)) return existingFrontsByTopic.get(key)!
    const existing = topicId
      ? await db.flashcard.findMany({ where: { topicId }, select: { front: true } })
      : await db.flashcard.findMany({ where: { tags: { has: GENERIC_DECK_NAME } }, select: { front: true } })
    const sets = existing.map((f) => tokenSet(f.front))
    existingFrontsByTopic.set(key, sets)
    return sets
  }

  let totalDecks = 0
  let totalNotesExtracted = 0
  let totalMapped = 0
  let totalGeneric = 0
  let totalCreated = 0
  let totalDuplicates = 0

  for (const file of files) {
    const notes = await extractNotes(file.fullPath)
    if (notes.length === 0) continue

    const deckFileName = file.relPath.split(/[/\\]/).pop()!.replace(/\.apkg$/i, "")
    const deck = await db.flashcardDeck.upsert({
      where: { id: `anki-${Buffer.from(file.relPath).toString("base64url").slice(0, 40)}` },
      update: {},
      create: {
        id: `anki-${Buffer.from(file.relPath).toString("base64url").slice(0, 40)}`,
        name: deckFileName,
        description: `Importado de ${file.relPath}`,
        isPublic: true,
      },
    })
    totalDecks++
    totalNotesExtracted += notes.length

    let createdForFile = 0

    for (const note of notes) {
      const topicId = await mapDeckToTopic(note.deckName, note.front)
      if (topicId) totalMapped++
      else totalGeneric++

      const existingSets = await getExistingTokenSets(topicId)
      const candidateTokens = tokenSet(note.front)
      const isDuplicate = existingSets.some((e) => jaccard(e, candidateTokens) >= DEDUP_THRESHOLD)
      if (isDuplicate) {
        totalDuplicates++
        continue
      }

      const tags = topicId ? [note.deckName] : [GENERIC_DECK_NAME, note.deckName]

      await db.flashcard.create({
        data: {
          deckId: deck.id,
          topicId,
          front: note.front,
          back: note.back || "(ver frente)",
          type: note.isCloze ? FlashcardType.CLOZE : FlashcardType.BASIC,
          tags,
        },
      })
      existingSets.push(candidateTokens)
      totalCreated++
      createdForFile++
    }

    console.log(`  ✅  ${file.relPath} — ${notes.length} notas, ${createdForFile} novas`)
    await sleep(500)
  }

  console.log("\n" + "─".repeat(50))
  console.log(`✅  Concluído!`)
  console.log(`   Decks processados:     ${totalDecks}`)
  console.log(`   Notas extraídas:       ${totalNotesExtracted}`)
  console.log(`   Flashcards criados:    ${totalCreated}`)
  console.log(`   Mapeados p/ tópico:    ${totalMapped}`)
  console.log(`   Genéricos:             ${totalGeneric}`)
  console.log(`   Duplicados ignorados:  ${totalDuplicates}`)

  await db.$disconnect()
}

main().catch((err) => {
  console.error(err)
  db.$disconnect()
  process.exit(1)
})
