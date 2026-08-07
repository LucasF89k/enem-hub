/**
 * scripts/enem-render-upload.ts
 * Renderiza as páginas de uma prova ENEM (PDF) com Ghostscript, sobe cada página
 * no Cloudinary e escreve um manifesto JSON (páginas + URLs + gabarito local).
 * O subagente Haiku lê as páginas e extrai as questões de imagem.
 *
 * Pilot 2022 (caminhos fixos). Uso: npx tsx scripts/enem-render-upload.ts
 */
import "dotenv/config"
import { execFileSync } from "node:child_process"
import { writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs"
import { PrismaClient } from "@prisma/client"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})
const db = new PrismaClient()

const GS = "C:/Program Files/gs/gs10.07.1/bin/gswin64c.exe"
const SP = "C:/Users/dilbe/AppData/Local/Temp/claude/d--enem-hub/97109b74-d515-4738-aee2-7a20fe647063/scratchpad/enem-img"

// Args: --year=YYYY --provas="p1.pdf,p2.pdf" --gabs="g1.pdf,g2.pdf"
const flags: Record<string, string> = {}
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)=(.*)$/)
  if (m) flags[m[1]] = m[2]
}
const YEAR = parseInt(flags["year"] ?? "0")
const provas = (flags["provas"] ?? "").split(",").map((s) => s.trim()).filter(Boolean)
const gabs = (flags["gabs"] ?? "").split(",").map((s) => s.trim()).filter(Boolean)
if (!YEAR || provas.length === 0 || provas.length !== gabs.length) {
  console.error('Uso: --year=YYYY --provas="p1,p2" --gabs="g1,g2" (provas e gabs alinhados por dia)')
  process.exit(1)
}
const DAYS = provas.map((prova, i) => ({ day: i + 1, prova, gab: gabs[i] }))

function render(pdf: string, prefix: string): string[] {
  execFileSync(GS, ["-dNOPAUSE", "-dBATCH", "-q", "-sDEVICE=png16m", "-r150", `-sOutputFile=${SP}/${prefix}-%d.png`, pdf])
  return readdirSync(SP).filter((f) => f.startsWith(prefix + "-") && f.endsWith(".png")).sort((a, b) => {
    const n = (s: string) => parseInt(s.match(/-(\d+)\.png$/)?.[1] ?? "0")
    return n(a) - n(b)
  }).map((f) => `${SP}/${f}`)
}

/** Gabarito oficial do api.enem.dev: { número da questão: letra }. Grátis. */
async function fetchGabarito(year: number): Promise<Record<number, string>> {
  const map: Record<number, string> = {}
  for (let offset = 0; offset < 200; offset += 50) {
    try {
      const r = await fetch(`https://api.enem.dev/v1/exams/${year}/questions?limit=50&offset=${offset}`)
      if (!r.ok) break
      const j = (await r.json()) as { questions?: { index: number; correctAlternative?: string }[] }
      const items = j.questions ?? []
      if (items.length === 0) break
      for (const q of items) if (q.index && q.correctAlternative) map[q.index] = q.correctAlternative
    } catch {
      break
    }
  }
  return map
}

async function main() {
  if (!existsSync(SP)) mkdirSync(SP, { recursive: true })

  const existing = await db.question.findMany({ where: { year: YEAR, source: `ENEM ${YEAR}` }, select: { number: true } })
  const existingNumbers = existing.map((q) => q.number).filter((n): n is number => n != null)

  const gabarito = await fetchGabarito(YEAR)
  console.log(`  gabarito api.enem.dev: ${Object.keys(gabarito).length} respostas`)

  const manifest: {
    year: number
    existingNumbers: number[]
    gabarito: Record<number, string>
    days: { day: number; gabaritoImages: string[]; pages: { page: number; localPath: string; url: string }[] }[]
  } = { year: YEAR, existingNumbers, gabarito, days: [] }

  for (const d of DAYS) {
    console.log(`\n== Dia ${d.day} ==`)
    const provaPages = render(d.prova, `y${YEAR}-d${d.day}p`)
    const gabPages = render(d.gab, `y${YEAR}-d${d.day}g`)
    console.log(`  prova: ${provaPages.length} páginas | gabarito: ${gabPages.length}`)

    const pages: { page: number; localPath: string; url: string }[] = []
    for (let i = 0; i < provaPages.length; i++) {
      const r = await cloudinary.uploader.upload(provaPages[i], {
        folder: `enem/${YEAR}/d${d.day}`,
        public_id: `p${i + 1}`,
        overwrite: true,
      })
      pages.push({ page: i + 1, localPath: provaPages[i], url: r.secure_url })
      process.stdout.write(".")
    }
    console.log("")
    manifest.days.push({ day: d.day, gabaritoImages: gabPages, pages })
  }

  writeFileSync(`${SP}/manifest-${YEAR}.json`, JSON.stringify(manifest, null, 2))
  console.log(`\n✅ Manifesto: ${SP}/manifest-${YEAR}.json`)
  console.log(`   já no banco: ${existingNumbers.length} questões | páginas subidas ao Cloudinary`)
  await db.$disconnect()
}
main().catch((e) => { console.error(e); db.$disconnect(); process.exit(1) })
