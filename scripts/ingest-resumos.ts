/**
 * scripts/ingest-resumos.ts
 * Processa material de resumo/revisão (RESUMO) de "fonte de conteudo/" — incluindo
 * "Revisão ENEM.pdf" e as "RESOLUÇÃO COMENTADA" (comentários/explicações de questão,
 * com valor didático de revisão) — e anexa/cria Content para o Topic identificado.
 *
 * Usage:
 *   npx tsx scripts/ingest-resumos.ts --dry-run
 *   npx tsx scripts/ingest-resumos.ts --all
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { generateMimoJSON } from "../src/lib/mimo"
import { discoverFiles } from "./lib/discover-files"
import { extractText, parseCliFlags, sleep } from "./lib/extract-text"

const db = new PrismaClient()
const DELAY_MS = 15_000

const flags = parseCliFlags(process.argv.slice(2))
const isDryRun = flags["dry-run"] === true
const isAll = flags["all"] === true

if (!isDryRun && !isAll) {
  console.error("❌  Passe --dry-run ou --all")
  process.exit(1)
}

interface ResumoResult {
  topicName: string // nome exato de um Topic da lista, ou "NENHUM"
  formattedHtml: string
  extraTips: string[]
}

function buildPrompt(text: string, hint: string, topicList: string): string {
  return `Você organiza material de revisão/resumo de conteúdo (ENEM e vestibulares) a partir de texto extraído de PDF.

Origem do arquivo: ${hint}

Lista de tópicos disponíveis: ${topicList}

Texto bruto:
"""
${text.slice(0, 6000)}
"""

Retorne SOMENTE um JSON (sem markdown):
{
  "topicName": string (o nome EXATO de um tópico da lista que este conteúdo mais se relaciona, ou "NENHUM" se não houver correspondência clara),
  "formattedHtml": string (HTML limpo com h3/p/ul/strong reformatando o conteúdo relevante como material de revisão, até 800 palavras — ignore capa/instruções/lixo),
  "extraTips": string[] (até 5 dicas/macetes extraídas do texto, vazio se não houver)
}`
}

function isValid(data: unknown): data is ResumoResult {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    typeof d.topicName === "string" &&
    typeof d.formattedHtml === "string" &&
    Array.isArray(d.extraTips)
  )
}

async function main() {
  const files = discoverFiles("RESUMO")
  console.log(`📘  ${files.length} arquivos RESUMO encontrados\n`)

  if (isDryRun) {
    for (const f of files) console.log(`  ${f.relPath}`)
    console.log(`\n🔍  DRY RUN — nenhuma chamada à MiMo, nenhum salvamento`)
    return
  }

  const topics = await db.topic.findMany({
    select: { id: true, name: true, slug: true, importance: true, frequency: true },
  })
  const topicList = topics.map((t) => t.name).join(", ")
  const topicByName = new Map(topics.map((t) => [t.name, t]))

  let totalProcessed = 0
  let totalUpdated = 0
  let totalCreated = 0
  let totalUnidentified = 0
  const unidentifiedFiles: string[] = []

  for (const file of files) {
    totalProcessed++
    try {
      const text = await extractText(file.fullPath)
      if (text.trim().length < 100) {
        console.log(`  ⏭️  ${file.relPath} — texto insuficiente`)
        await sleep(DELAY_MS)
        continue
      }

      const prompt = buildPrompt(text, file.hint, topicList)
      const structured = await generateMimoJSON<ResumoResult>(prompt, 3072)
      if (!isValid(structured)) {
        console.log(`  ❌  ${file.relPath} — JSON inválido`)
        await sleep(DELAY_MS)
        continue
      }

      if (structured.topicName === "NENHUM" || !topicByName.has(structured.topicName)) {
        totalUnidentified++
        unidentifiedFiles.push(file.relPath)
        console.log(`  ❓  ${file.relPath} — tópico não identificado`)
        await sleep(DELAY_MS)
        continue
      }

      const topic = topicByName.get(structured.topicName)!
      const existingContent = await db.content.findFirst({ where: { topicId: topic.id } })

      if (existingContent) {
        const alreadyHasIt = existingContent.body.includes(structured.formattedHtml.slice(0, 100))
        if (!alreadyHasIt) {
          await db.content.update({
            where: { id: existingContent.id },
            data: {
              body: `${existingContent.body}\n\n<hr/>\n<h3>Material complementar</h3>\n${structured.formattedHtml}`,
              tips: Array.from(new Set([...existingContent.tips, ...structured.extraTips])),
            },
          })
          totalUpdated++
          console.log(`  ✅  ${file.relPath} — anexado a "${topic.name}"`)
        } else {
          console.log(`  ⏭️  ${file.relPath} — já anexado anteriormente`)
        }
      } else {
        await db.content.create({
          data: {
            topicId: topic.id,
            title: topic.name,
            slug: topic.slug,
            summary: structured.formattedHtml.replace(/<[^>]+>/g, "").slice(0, 200),
            body: structured.formattedHtml,
            keyConcepts: [],
            tips: structured.extraTips,
            formulas: [],
            tricks: [],
            importance: topic.importance,
            frequency: topic.frequency,
          },
        })
        totalCreated++
        console.log(`  ✅  ${file.relPath} — Content criado para "${topic.name}"`)
      }
    } catch (err) {
      console.log(`  ❌  ${file.relPath} — erro: ${err}`)
    }

    await sleep(DELAY_MS)
  }

  console.log("\n" + "─".repeat(50))
  console.log(`✅  Concluído!`)
  console.log(`   Processados:          ${totalProcessed}`)
  console.log(`   Tópicos atualizados:  ${totalUpdated}`)
  console.log(`   Tópicos criados:      ${totalCreated}`)
  console.log(`   Não identificados:    ${totalUnidentified}`)
  if (unidentifiedFiles.length > 0) {
    console.log(`\n   Arquivos não identificados (revisão manual):`)
    for (const f of unidentifiedFiles) console.log(`     ${f}`)
  }

  await db.$disconnect()
}

main().catch((err) => {
  console.error(err)
  db.$disconnect()
  process.exit(1)
})
