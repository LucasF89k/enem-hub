import "dotenv/config"
import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync, readFileSync as rf } from "node:fs"
import { mimoClientWithKey, mimoKeys, MIMO_MODEL } from "../src/lib/mimo"

const SP = "C:/Users/dilbe/AppData/Local/Temp/claude/d--enem-hub/97109b74-d515-4738-aee2-7a20fe647063/scratchpad/enem-img"
const GS = "C:/Program Files/gs/gs10.07.1/bin/gswin64c.exe"
const GAB_PDF =
  "fonte de conteudo/Provas ENEM normal e ENEM PPL/Provas ENEM normal e ENEM PPL/ENEM - 2009 - normal/Segundo dia/ENEM - 2009 - 2°dia - Gabarito - Prova amarela.pdf"
const TARGETS = [98, 101, 104, 125, 126, 140, 157, 166, 180]

const client = mimoClientWithKey(mimoKeys()[0])

function extractJson(raw: string): string {
  const a = raw.indexOf("[")
  const b = raw.lastIndexOf("]")
  return a >= 0 && b > a ? raw.slice(a, b + 1) : raw
}
function extractObj(raw: string): string {
  const a = raw.indexOf("{")
  const b = raw.lastIndexOf("}")
  return a >= 0 && b > a ? raw.slice(a, b + 1) : raw
}

async function mimoImage(url: string, prompt: string, arr = true): Promise<string> {
  const r = await client.chat.completions.create({
    model: MIMO_MODEL,
    max_tokens: 8000,
    temperature: 0.2,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url } }] as never }],
  })
  const raw = (r.choices[0]?.message?.content ?? "").trim()
  return arr ? extractJson(raw) : extractObj(raw)
}

async function main() {
  // 1) Gabarito amarela (dia 2) — render + MiMo
  execFileSync(GS, ["-dNOPAUSE", "-dBATCH", "-q", "-sDEVICE=png16m", "-r150", `-sOutputFile=${SP}/g2009d2-%d.png`, GAB_PDF])
  const gabDataUrl = "data:image/png;base64," + rf(`${SP}/g2009d2-1.png`).toString("base64")
  const gabRaw = await client.chat.completions.create({
    model: MIMO_MODEL, max_tokens: 4000, temperature: 0,
    messages: [{ role: "user", content: [
      { type: "text", text: `Esta é a folha de GABARITO OFICIAL do ENEM 2009, 2º dia, Caderno AMARELO. Extraia o mapa número→letra para as questões ${TARGETS.join(", ")}. Responda SOMENTE JSON: {"98":"X",...}` },
      { type: "image_url", image_url: { url: gabDataUrl } },
    ] as never }],
  })
  let gab: Record<string, string> = {}
  try { gab = JSON.parse(extractObj((gabRaw.choices[0]?.message?.content ?? "").trim())) } catch {}
  console.log("gabarito amarela:", JSON.stringify(gab))

  // 2) Varre páginas do dia 2, para quando achar as 9
  const manifest = JSON.parse(readFileSync(`${SP}/manifest-2009.json`, "utf8")) as {
    days: { day: number; pages: { url: string }[] }[]
  }
  const day2 = manifest.days.find((d) => d.day === 2)!
  const found: Record<number, unknown> = {}

  for (const page of day2.pages) {
    const remaining = TARGETS.filter((n) => !(n in found))
    if (remaining.length === 0) break
    const prompt = `Página do ENEM 2009 (2º dia). Extraia SOMENTE as questões cujo número esteja em [${remaining.join(",")}] que APAREÇAM nesta página. Para cada uma: {"number":N,"statement":"enunciado completo (descreva figura em [Figura: ...])","options":[{"letter":"A","text":"..."},...E]}. Se nenhuma estiver aqui, responda []. SOMENTE JSON array.`
    let items: { number: number; statement: string; options: unknown[] }[] = []
    try { items = JSON.parse(await mimoImage(page.url, prompt)) } catch { items = [] }
    for (const it of items) {
      if (TARGETS.includes(it.number) && !(it.number in found)) {
        found[it.number] = { ...it, correct: gab[String(it.number)] ?? null, imageUrl: page.url }
        console.log(`  ✓ ${it.number}`)
      }
    }
  }

  const out = Object.values(found)
  writeFileSync(`${SP}/out-2009b.json`, JSON.stringify(out, null, 2))
  console.log(`\nExtraídas: ${out.length}/${TARGETS.length} | faltaram: ${TARGETS.filter((n) => !(n in found)).join(",") || "—"}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
