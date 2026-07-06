/**
 * scripts/ingest-redacao.ts
 * Processa material de redação (temas, textos motivadores, redações-exemplo,
 * competências) de "fonte de conteudo/" e salva em public/data/redacao-extra.json
 * (material de apoio consultivo, mesmo espírito do redacao-bank.ts existente).
 *
 * Usage:
 *   npx tsx scripts/ingest-redacao.ts --dry-run
 *   npx tsx scripts/ingest-redacao.ts --all
 */

import "dotenv/config"
import fs from "node:fs/promises"
import path from "node:path"
import { generateMimoJSON } from "../src/lib/mimo"
import { discoverFiles } from "./lib/discover-files"
import { extractText, parseCliFlags, sleep } from "./lib/extract-text"

const OUTPUT_PATH = path.resolve(__dirname, "../public/data/redacao-extra.json")
const DELAY_MS = 10_000

const flags = parseCliFlags(process.argv.slice(2))
const isDryRun = flags["dry-run"] === true
const isAll = flags["all"] === true

if (!isDryRun && !isAll) {
  console.error("❌  Passe --dry-run ou --all")
  process.exit(1)
}

interface RedacaoEntry {
  source: string
  tipo: "tema" | "texto_motivador" | "redacao_exemplo" | "competencia" | "outro"
  tema: string
  conteudoFormatado: string
  competencias?: { competencia: string; trecho: string }[]
}

function buildPrompt(text: string, hint: string): string {
  return `Você organiza material de estudo de redação (ENEM e vestibulares) a partir de texto extraído de PDF/DOCX.

Origem do arquivo: ${hint}

Texto bruto (pode ter até algumas páginas):
"""
${text.slice(0, 6000)}
"""

Retorne SOMENTE um JSON (sem markdown):
{
  "tipo": "tema" | "texto_motivador" | "redacao_exemplo" | "competencia" | "outro",
  "tema": string (o tema da redação/proposta, ou assunto principal se não for um tema formal),
  "conteudoFormatado": string (HTML limpo com p/ul/strong, o conteúdo relevante organizado, até 2000 palavras),
  "competencias": [{"competencia": "C1"|"C2"|"C3"|"C4"|"C5", "trecho": string}] (SÓ inclua este campo se tipo for "redacao_exemplo" E a redação for nota 1000 ou claramente excelente — extraia um trecho ilustrativo de cada competência que conseguir identificar; omita o campo inteiramente caso contrário)
}`
}

function isValid(data: unknown): data is RedacaoEntry {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    typeof d.tipo === "string" &&
    typeof d.tema === "string" &&
    typeof d.conteudoFormatado === "string"
  )
}

async function loadExisting(): Promise<RedacaoEntry[]> {
  try {
    const raw = await fs.readFile(OUTPUT_PATH, "utf-8")
    return JSON.parse(raw) as RedacaoEntry[]
  } catch {
    return []
  }
}

async function main() {
  const files = discoverFiles("REDACAO")
  console.log(`✍️  ${files.length} arquivos REDACAO encontrados\n`)

  if (isDryRun) {
    for (const f of files) console.log(`  ${f.relPath}`)
    console.log(`\n🔍  DRY RUN — nenhuma chamada à MiMo, nenhum salvamento`)
    return
  }

  const existing = await loadExisting()
  const existingSources = new Set(existing.map((e) => e.source))

  let totalProcessed = 0
  let totalSaved = 0
  let totalErrors = 0

  for (const file of files) {
    if (existingSources.has(file.relPath)) {
      console.log(`  ⏭️  ${file.relPath} — já processado`)
      continue
    }

    totalProcessed++
    try {
      const text = await extractText(file.fullPath)
      if (text.trim().length < 100) {
        console.log(`  ⏭️  ${file.relPath} — texto insuficiente`)
        await sleep(DELAY_MS)
        continue
      }

      const prompt = buildPrompt(text, file.hint)
      const structured = await generateMimoJSON<RedacaoEntry>(prompt, 3072)
      if (!isValid(structured)) {
        console.log(`  ❌  ${file.relPath} — JSON inválido`)
        totalErrors++
        await sleep(DELAY_MS)
        continue
      }

      structured.source = file.relPath
      existing.push(structured)
      totalSaved++
      console.log(`  ✅  ${file.relPath} — ${structured.tipo}: ${structured.tema.slice(0, 60)}`)
    } catch (err) {
      console.log(`  ❌  ${file.relPath} — erro: ${err}`)
      totalErrors++
    }

    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(existing, null, 2))

    await sleep(DELAY_MS)
  }

  console.log("\n" + "─".repeat(50))
  console.log(`✅  Concluído!`)
  console.log(`   Arquivos processados: ${totalProcessed}`)
  console.log(`   Salvos:               ${totalSaved}`)
  console.log(`   Erros:                ${totalErrors}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
