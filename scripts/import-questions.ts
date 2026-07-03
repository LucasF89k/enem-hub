/**
 * scripts/import-questions.ts
 * Importa questões reais do ENEM via api.enem.dev (2009–2023)
 * O endpoint de lista não retorna alternativas, então busca cada questão individualmente.
 *
 * Usage:
 *   $env:DATABASE_URL="..."; npx tsx scripts/import-questions.ts --all
 *   $env:DATABASE_URL="..."; npx tsx scripts/import-questions.ts --year=2023
 *   $env:DATABASE_URL="..."; npx tsx scripts/import-questions.ts --year=2023 --dry-run
 */

import "dotenv/config"
import { PrismaClient, Difficulty } from "@prisma/client"

const db = new PrismaClient()
const API_BASE = "https://api.enem.dev/v1"
const AVAILABLE_YEARS = [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023]

// ── CLI flags ─────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const flags: Record<string, string | true> = {}
for (const a of argv) {
  if (!a.startsWith("--")) continue
  const [k, v] = a.slice(2).split("=")
  flags[k] = v ?? true
}

const isDryRun  = flags["dry-run"] === true
const importAll = flags["all"]     === true
const yearFlag  = flags["year"]    ? parseInt(flags["year"] as string) : null

const yearsToImport = importAll
  ? AVAILABLE_YEARS
  : yearFlag
    ? [yearFlag]
    : (() => { console.error("❌  Passe --all ou --year=YYYY"); process.exit(1); return [] as number[] })()

// ── API Types ─────────────────────────────────────────────────────────────
interface ApiAlternative { letter: string; text: string; file?: string | null; isCorrect?: boolean }
interface ApiQuestion {
  index: number
  discipline: string
  language?: string | null
  files?: string[] | string
  context?: string | null
  alternativesIntroduction?: string
  title?: string
  alternatives?: ApiAlternative[] | string
  correctAlternative?: string
  year?: number
}
interface ApiListMeta { total: number; hasMore: boolean }
interface ApiListResponse { metadata: ApiListMeta; questions: ApiQuestion[] }

// ── Area mapping ──────────────────────────────────────────────────────────
const DISCIPLINE_TO_AREA: Record<string, string> = {
  linguagens:  "linguagens",
  matematica:  "matematica",
  humanas:     "ciencias-humanas",
  natureza:    "ciencias-natureza",
}

// ── Keyword → topic slug ──────────────────────────────────────────────────
const TOPIC_KEYWORDS: [string, RegExp][] = [
  // CN — Biologia
  ["bio-genetica",          /genétic|cromossomo|mendel|herança|alelo|gameta|DNA|RNA|proteína\s+síntes/i],
  ["bio-ecologia",          /ecologi|ecossistem|cadeia\s+alimentar|teia\s+tróf|bioma|cerrado|caatinga|biodiversidade/i],
  ["bio-citologia",         /célula|mitose|meiose|citoplasm|organela|membrana\s+celular|núcleo\s+celular/i],
  ["bio-fisiologia-animal", /fisiologi|sistema\s+(digestivo|respiratório|circulatório|nervoso|imunológico|excretor|endócrino)|hormônio|neurônio/i],
  // CN — Química
  ["qui-termoquimica",      /termoquímic|entalpia|combustão|exotérmic|endotérmic|hess/i],
  ["qui-equilibrio",        /equilíbrio\s+químic|Le\s+Chatelier|constante\s+de\s+equilíbrio|\bKp\b|\bKc\b/i],
  ["qui-funcoes-organicas", /hidrocarboneto|alcano|alceno|benzeno|álcool\s+(etílic|orgân)|éster|aldeído|cetona|ácido\s+carboxílic|saponificação/i],
  ["qui-acidos-bases",      /\bpH\b|\bpOH\b|neutralização|titulação|Arrhenius|Brønsted|ácido\s+(forte|fraco|clorídrico)|base\s+(forte|fraca)/i],
  ["qui-eletroquimica",     /eletrólise|pilha|eletrodo|cátodo|ânodo|oxidação|redução|potencial\s+padrão|eletroquímic/i],
  // CN — Física
  ["fis-cinematica",        /cinemátic|velocidade\s+(média|escalar|vetorial)|aceleração|MRUV|movimento\s+uniform/i],
  ["fis-eletrodinamica",    /resistência\s+elétric|tensão\s+elétric|corrente\s+elétric|lei\s+de\s+Ohm|resistor|circuito\s+elétric/i],
  ["fis-energia",           /energia\s+(cinética|potencial|mecânica)|trabalho\s+mecân|potência\s+mecân|conservação\s+de\s+energia/i],
  ["fis-fisica-moderna",    /efeito\s+fotoelétric|relatividade|fóton|radioatividade|fissão|fusão|partícula\s+(alfa|beta|gama)/i],
  ["fis-ondas",             /\bonda[s]?\b|acústic|frequência|comprimento\s+de\s+onda|efeito\s+Doppler/i],
  ["fis-optica",            /óptic|reflexão|refração|lente|espelho|índice\s+de\s+refração/i],
  // CH — História
  ["hist-ditadura-militar", /ditadura\s+militar|AI-5|regime\s+militar\s+brasileiro|1964.*brasil|brasil.*1968/i],
  ["hist-2a-guerra",        /segunda\s+guerra|holocausto|nazism|fascism|hitler|hiroshima/i],
  ["hist-revolucao-francesa",/revolução\s+francesa|bastilha|iluminism|robespierre|antigo\s+regime/i],
  ["hist-revolucao-industrial",/revolução\s+industrial|industrialização|proletariado|capitalismo\s+industrial|máquina\s+a\s+vapor/i],
  ["hist-escravidao",       /escravi|tráfico\s+negreiro|quilombo|abolição\s+da\s+escravidão|lei\s+áurea/i],
  ["hist-brasil-colonial",  /colonial|capitania|jesuíta|bandeirante|pau-brasil|ciclo\s+do\s+açúcar/i],
  // CH — Geografia
  ["geo-urbanizacao",       /urbanização|favela|metrópol|êxodo\s+rural|conurbação/i],
  ["geo-meio-ambiente",     /aquecimento\s+global|efeito\s+estufa|mudança\s+climática|desmatamento|camada\s+de\s+ozônio/i],
  ["geo-geopolitica",       /geopolítica|fronteira|território|soberania|conflito\s+(internacional|territorial)/i],
  ["geo-demografia",        /transição\s+demográfic|natalidade|mortalidade|crescimento\s+populacional|IDH/i],
  // CH — Filosofia e Sociologia
  ["fil-etica",             /ética|imperativo\s+categóric|Kant|utilitarism|deontologi/i],
  ["fil-politica",          /contrato\s+social|Rousseau|Locke|Hobbes|Montesquieu|separação\s+de\s+poderes/i],
  ["soc-desigualdade",      /desigualdade\s+(social|de\s+renda)|coeficiente\s+de\s+Gini|exclusão\s+social/i],
  ["soc-cultura",           /etnocentrism|relativism\s+cultural|multiculturalism|identidade\s+cultural/i],
  ["soc-cidadania",         /cidadania|direitos\s+(civis|políticos|sociais|humanos|fundamentais)/i],
  // LCT
  ["por-figuras-linguagem", /metáfor|metonímia|hipérbole|eufemismo|antítese|ironia|anáfora|figura[s]?\s+de\s+(linguagem|estilo)/i],
  ["por-variacao-linguistica",/variação\s+linguística|dialeto|registro\s+(formal|informal)|preconceito\s+linguístico/i],
  ["por-argumentacao",      /argumentação|tese|dissertativo|proposta\s+de\s+intervenção|competência\s+(IV|V)/i],
  ["por-generos-textuais",  /gênero[s]?\s+(textual|discursivo)|charge|tirinha|crônica|editorial|reportagem/i],
  ["por-coesao-coerencia",  /coesão|coerência|conectivo|conjunção|referência\s+textual/i],
  ["lit-modernismo",        /modernismo|semana\s+de\s+arte\s+moderna|drummond|Oswald\s+de\s+Andrade|Mário\s+de\s+Andrade|antropofag/i],
  ["lit-realismo",          /Machado\s+de\s+Assis|Eça\s+de\s+Queirós|Brás\s+Cubas|Dom\s+Casmurro|realismo\s+brasileiro/i],
  ["lit-africana",          /literatura\s+(africana|afro-brasileira)|Pepetela|Mia\s+Couto|colonialismo\s+literário/i],
  ["ing-interpretacao",     /\bDespite\b|\bAlthough\b|\bHowever\b|\bNevertheless\b|\bread\s+the\s+text\b/i],
  // MT
  ["mat-probabilidade",     /probabilidade|espaço\s+amostral|evento[s]?\s+aleatório|combinação\s+de\s+\d/i],
  ["mat-analise-combinatoria",/análise\s+combinatória|princípio\s+fundamental\s+da\s+contagem|fatorial|arranjo|permutação/i],
  ["mat-geometria-plana",   /geometria\s+plana|triângulo|circunferência|área\s+(do|de\s+um)\s+(triângulo|quadrado|retângulo|círculo)|pitágoras/i],
  ["mat-geometria-espacial",/volume|cubo|paralelepípedo|esfera|cilindro|cone|pirâmide|sólido\s+geométrico/i],
  ["mat-trigonometria",     /trigonometria|seno|cosseno|tangente|lei\s+dos\s+(senos|cossenos)|ângulo\s+de\s+(depressão|elevação)/i],
  ["mat-estatistica",       /estatística|média\s+aritmética|mediana|moda|desvio\s+padrão|variância|histograma/i],
  ["mat-funcoes-1grau",     /função\s+(afim|do\s+1[°º]?\s+grau|linear)|coeficiente\s+(angular|linear)(?!\s+da\s+parábola)/i],
  ["mat-funcoes-2grau",     /função\s+(quadrátic|do\s+2[°º]?\s+grau)|parábola|vértice\s+da\s+parábola|bhaskara|\bdelta\b/i],
  ["mat-funcoes-exponencial",/função\s+exponencial|crescimento\s+exponencial|decaimento\s+(exponencial|radioativo)/i],
  ["mat-financeira",        /juros\s+(simples|compostos)|montante|taxa\s+de\s+juros|amortização|financiamento/i],
  ["mat-sequencias-pa-pg",  /progressão\s+(aritmética|geométrica|\bPA\b|\bPG\b)|razão\s+da\s+P[AG]|soma\s+dos\s+termos/i],
  ["mat-geometria-analitica",/geometria\s+analítica|plano\s+cartesiano|distância\s+entre\s+pontos|equação\s+da\s+(reta|circunferência)/i],
]

function classifyTopic(text: string, topicMap: Record<string, string>): string | null {
  for (const [slug, re] of TOPIC_KEYWORDS) {
    if (re.test(text) && topicMap[slug]) return topicMap[slug]
  }
  return null
}

function difficultyFromIndex(index: number, total: number): Difficulty {
  const pct = index / total
  if (pct < 0.3) return Difficulty.EASY
  if (pct < 0.7) return Difficulty.MEDIUM
  return Difficulty.HARD
}

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)) }

// ── Fetch total count for a year ──────────────────────────────────────────
async function fetchTotal(year: number): Promise<number> {
  const url = `${API_BASE}/exams/${year}/questions?limit=1&offset=0`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json() as ApiListResponse
  return data.metadata?.total ?? 90
}

// ── Fetch single question by index ────────────────────────────────────────
async function fetchQuestion(year: number, index: number): Promise<ApiQuestion | null> {
  const res = await fetch(`${API_BASE}/exams/${year}/questions/${index}`)
  if (!res.ok) return null
  return res.json() as Promise<ApiQuestion>
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  if (isDryRun) console.log("🔍  DRY RUN — não salva no DB\n")

  const topics = await db.topic.findMany({ select: { id: true, slug: true } })
  const topicMap: Record<string, string> = {}
  for (const t of topics) topicMap[t.slug] = t.id

  // Fallback: first topic per area
  const areaTopics = await db.topic.findMany({
    select: { id: true, discipline: { select: { area: { select: { slug: true } } } } },
    orderBy: { order: "asc" },
  })
  const fallbackTopic: Record<string, string> = {}
  for (const t of areaTopics) {
    const area = t.discipline.area.slug
    if (!fallbackTopic[area]) fallbackTopic[area] = t.id
  }

  let totalSaved = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const year of yearsToImport) {
    let total: number
    try {
      total = await fetchTotal(year)
    } catch (err) {
      console.log(`\n❌  ENEM ${year} — falha ao obter total: ${err}`)
      totalErrors++
      continue
    }

    console.log(`\n📅  ENEM ${year} — ${total} questões`)

    for (let idx = 1; idx <= total; idx++) {
      let q: ApiQuestion | null = null
      try {
        q = await fetchQuestion(year, idx)
      } catch { /* skip */ }

      if (!q) { totalSkipped++; await sleep(150); continue }

      // Build statement
      const parts = [q.context, q.alternativesIntroduction].filter(Boolean)
      const statement = parts.join("\n\n").trim() || q.title || ""
      if (statement.length < 10) { totalSkipped++; await sleep(150); continue }

      // Map discipline → area
      const areaSlug = DISCIPLINE_TO_AREA[(q.discipline ?? "").toLowerCase().trim()]
      if (!areaSlug) { totalSkipped++; await sleep(150); continue }

      // Parse alternatives (may be array or empty string)
      const alts: ApiAlternative[] = Array.isArray(q.alternatives) ? q.alternatives : []
      if (alts.length === 0) { totalSkipped++; await sleep(150); continue }

      const correctLetter = q.correctAlternative ?? alts.find((a) => a.isCorrect)?.letter ?? null

      const topicId = classifyTopic(statement, topicMap) ?? fallbackTopic[areaSlug] ?? null
      const difficulty = difficultyFromIndex(idx, total)
      const source = `ENEM ${year}`

      if (isDryRun) {
        process.stdout.write(`  [${year}/${idx}] ${areaSlug.padEnd(18)} ${statement.slice(0, 50).replace(/\n/g, " ")}…\n`)
        totalSaved++
        await sleep(50)
        continue
      }

      try {
        const existing = await db.question.findFirst({
          where: { source, number: idx, year },
          select: { id: true },
        })
        if (existing) { totalSkipped++; await sleep(100); continue }

        const files = Array.isArray(q.files) ? q.files : []

        const created = await db.question.create({
          data: {
            topicId,
            areaSlug,
            source,
            year,
            number:      idx,
            statement,
            explanation: `Questão ${idx} do ENEM ${year}. Gabarito oficial: ${correctLetter ?? "ver INEP"}.`,
            difficulty,
            images:      files.filter(Boolean),
            tags:        [areaSlug, String(year)],
            options: {
              create: alts.map((opt, i) => ({
                letter: opt.letter,
                text:   opt.text || opt.letter,
                order:  i + 1,
              })),
            },
          },
          include: { options: true },
        })

        if (correctLetter) {
          const correct = created.options.find((o) => o.letter === correctLetter)
          if (correct) {
            await db.question.update({
              where: { id: created.id },
              data: { correctId: correct.id },
            })
          }
        }

        totalSaved++
        if (totalSaved % 100 === 0) console.log(`  → ${totalSaved} salvas (ano ${year}, Q${idx}/${total})`)
      } catch (err) {
        totalErrors++
        if (totalErrors <= 3) console.error(`  Erro Q${idx}/${year}: ${err}`)
      }

      await sleep(150) // ~6 req/s — evita rate limit
    }
  }

  console.log("\n" + "─".repeat(50))
  console.log(`✅  Concluído!`)
  console.log(`   Questões salvas:   ${totalSaved}`)
  console.log(`   Questões puladas:  ${totalSkipped}  (sem alternativas, sem disciplina, ou duplicadas)`)
  console.log(`   Erros:             ${totalErrors}`)

  await db.$disconnect()
}

main().catch((err) => {
  console.error(err)
  db.$disconnect()
  process.exit(1)
})
