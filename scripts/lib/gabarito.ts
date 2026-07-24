/**
 * scripts/lib/gabarito.ts
 *
 * Lê PDFs de gabarito ("Gabarito ...") e devolve um mapa questão→letra.
 * Usado para preencher a resposta certa das questões extraídas das provas
 * (os PDFs de prova não trazem o gabarito embutido).
 *
 * Formatos suportados (tolerante):
 *   - inline com traço:  "1 - E   2 - E   3 - C"        (FAMERP, UNESP...)
 *   - tabela:            "46 \t A" / "47 \t B"           (ENEM: QUESTÃO / GABARITO)
 *   - inline compacto:   "01A 02B 03C" / "1A 2B"
 *
 * Segurança: quando o mesmo número aparece com letras diferentes (provas de
 * cores/versões distintas no mesmo arquivo), marcamos como AMBÍGUO e NÃO
 * preenchemos — resposta errada é pior que resposta nula.
 */
import fs from "node:fs"
import path from "node:path"
import { extractPdfText } from "./extract-text"

export interface GabaritoMap {
  answers: Map<number, string> // número da questão → letra (A–E), só os não-ambíguos
  ambiguous: Set<number>
  count: number
}

const LETTERS = new Set(["A", "B", "C", "D", "E"])

/** Extrai todos os pares (número, letra) de um texto de gabarito. */
export function parseGabaritoText(text: string): GabaritoMap {
  const pairs: Array<[number, string]> = []

  // Estratégia 1 — inline com separador (traço/ponto): "12 - B", "12. B", "12) B"
  for (const m of text.matchAll(/(\d{1,3})\s*[-–—.)]\s*([A-Ea-e])(?![A-Za-z0-9])/g)) {
    pairs.push([parseInt(m[1], 10), m[2].toUpperCase()])
  }

  // Estratégia 2 — pares "número <espaços/tabs> letra" em qualquer posição da
  // linha. Cobre tabelas de 1 coluna (ENEM) E grades multi-coluna (UERJ:
  // "1 D  22 D  41 C" numa linha só). Lookbehind evita casar dígito interno de
  // ano (ex "2013 A" não vira "13 A"); a letra não pode ser seguida de alfanum.
  for (const m of text.matchAll(/(?<!\d)(\d{1,3})[ \t]+([A-Ea-e])(?![A-Za-z0-9])/g)) {
    pairs.push([parseInt(m[1], 10), m[2].toUpperCase()])
  }

  // Estratégia 3 — inline compacto colado: "01A 02B" ou "1A2B3C"
  if (pairs.length < 4) {
    for (const m of text.matchAll(/(\d{1,3})\s*([A-Ea-e])(?![A-Za-z0-9])/g)) {
      pairs.push([parseInt(m[1], 10), m[2].toUpperCase()])
    }
  }

  const seen = new Map<number, string>()
  const ambiguous = new Set<number>()
  for (const [num, letter] of pairs) {
    if (!LETTERS.has(letter)) continue
    if (num < 1 || num > 300) continue
    const prev = seen.get(num)
    if (prev === undefined) seen.set(num, letter)
    else if (prev !== letter) ambiguous.add(num)
  }
  for (const n of ambiguous) seen.delete(n)

  return { answers: seen, ambiguous, count: seen.size }
}

/** Ordinal do exame no nome (1º/2º/3º EQ, "1 dia", etc.) — para casar prova↔gabarito. */
export function detectOrdinal(name: string): string | null {
  const m = name.toLowerCase().normalize("NFC").match(/\b([1-4])\s*[ºo°]/)
  return m ? m[1] : null
}

/** Um caderno tem cor? (branca/azul/amarela/rosa/cinza/verde) */
export function detectColor(name: string): string | null {
  const m = name.toLowerCase().normalize("NFC").match(/\b(branc[ao]|azul|amarel[ao]|ros[ao]|cinza|verde)\b/)
  return m ? m[1].replace(/[ao]$/, "") : null
}

/** Lista arquivos de gabarito no mesmo diretório (e pai) de uma prova. */
export function findGabaritoFiles(provaFullPath: string): string[] {
  const dir = path.dirname(provaFullPath)
  const dirs = [dir, path.dirname(dir)]
  const found: string[] = []
  for (const d of dirs) {
    let entries: string[]
    try { entries = fs.readdirSync(d) } catch { continue }
    for (const e of entries) {
      const lower = e.toLowerCase().normalize("NFC")
      if (!lower.endsWith(".pdf")) continue
      if (!lower.includes("gabarito")) continue
      if (lower.includes("resolu") || lower.includes("comentad")) continue // resolução comentada, não é grade seca
      found.push(path.join(d, e))
    }
    if (found.length) break // prefere o diretório mais próximo
  }
  return found
}

/**
 * Constrói o mapa de gabarito para uma prova específica.
 * Se houver cor detectável na prova, tenta casar com o gabarito da mesma cor;
 * caso contrário, usa/combina os gabaritos disponíveis (marcando conflito como ambíguo).
 */
export async function loadGabaritoForProva(provaFullPath: string): Promise<GabaritoMap> {
  const provaColor = detectColor(path.basename(provaFullPath))
  const provaBase = path.basename(provaFullPath)
  let files = findGabaritoFiles(provaFullPath)

  // Casa por ordinal do exame (UERJ: "1º Exame" → "Gabarito 1º EQ"): se a prova
  // tem ordinal e há gabaritos com ordinais, fica só com os do mesmo ordinal.
  const provaOrd = detectOrdinal(provaBase)
  if (provaOrd) {
    const sameOrd = files.filter((f) => detectOrdinal(path.basename(f)) === provaOrd)
    const anyOrd = files.some((f) => detectOrdinal(path.basename(f)) !== null)
    if (sameOrd.length) files = sameOrd
    else if (anyOrd) return { answers: new Map(), ambiguous: new Set(), count: 0 } // só há de outro ordinal
  }

  // Segurança de cor: se a prova tem cor (ENEM embaralha questões por cor),
  // SÓ casamos com o gabarito da mesma cor. Sem gabarito da mesma cor → vazio
  // (não arriscamos casar número com a cor errada, o que daria resposta errada).
  let chosen = files
  if (provaColor) {
    const sameColor = files.filter((f) => {
      const c = detectColor(path.basename(f))
      return c === provaColor || c === null // gabarito sem cor explícita é aceitável
    })
    const strictSame = files.filter((f) => detectColor(path.basename(f)) === provaColor)
    if (strictSame.length) chosen = strictSame
    else if (files.some((f) => detectColor(path.basename(f)) !== null)) {
      return { answers: new Map(), ambiguous: new Set(), count: 0 } // só há gabarito de outra cor → aborta
    } else chosen = sameColor
  }

  const merged = new Map<number, string>()
  const ambiguous = new Set<number>()
  for (const f of chosen) {
    let text: string
    try { text = await extractPdfText(f) } catch { continue }
    const g = parseGabaritoText(text)
    for (const [num, letter] of g.answers) {
      const prev = merged.get(num)
      if (prev === undefined) merged.set(num, letter)
      else if (prev !== letter) ambiguous.add(num)
    }
  }
  for (const n of ambiguous) merged.delete(n)
  return { answers: merged, ambiguous, count: merged.size }
}
