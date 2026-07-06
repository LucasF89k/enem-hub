import fs from "node:fs"
import path from "node:path"

export const CONTENT_ROOT = path.resolve(__dirname, "../../fonte de conteudo")
const EXCLUDE_DIRNAME = "01 - ENEM 1998 - 2008 - bem antigas kkk"

export type Category = "PROVA" | "REDACAO" | "RESUMO" | "ANKI" | "OUTRO" | "ARCHIVE"

function classify(relDirLower: string, nameLower: string): Category {
  const ext = path.extname(nameLower)

  if (ext === ".apkg") return "ANKI"
  if (ext === ".zip" || ext === ".rar") return "ARCHIVE"

  if (nameLower === ".ds_store" || ext === ".png") return "OUTRO"
  if (ext === ".docx") return "OUTRO"
  if (ext !== ".pdf") return "OUTRO"

  if (
    nameLower.includes("resolução") ||
    nameLower.includes("resolucao") ||
    relDirLower.includes("resolução") ||
    relDirLower.includes("resolucao")
  ) {
    return "RESUMO" // walkthrough/commentary — didactic value, treated as study material
  }

  if (
    nameLower.includes("critério de correção") ||
    nameLower.includes("criterio de correcao") ||
    nameLower.includes("critérios de correção")
  ) {
    return "OUTRO" // grading rubric, not exam content
  }

  if (nameLower.includes("modelo folha de redação") || nameLower.includes("modelo gab")) {
    return "OUTRO" // blank templates
  }

  if (nameLower.includes("não foi realizada") || nameLower.includes("nao foi realizada")) {
    return "OUTRO"
  }

  if (relDirLower.includes("redação competências inep")) return "REDACAO"

  if (nameLower.includes("revisão enem") || nameLower.includes("revisao enem")) return "RESUMO"

  if (
    (nameLower.includes("discursiv") || nameLower.includes("redação") || nameLower.includes("redacao")) &&
    !nameLower.includes("objetiva")
  ) {
    return "REDACAO"
  }

  return "PROVA"
}

function shouldSkipDir(relDirLower: string): boolean {
  if (relDirLower.includes("encceja") && relDirLower.includes("ensino fund")) return true
  return false
}

export interface DiscoveredFile {
  fullPath: string
  relPath: string
  /** Human-readable folder chain + filename, for LLM context (source inference) */
  hint: string
}

export function discoverFiles(category: Category): DiscoveredFile[] {
  const results: DiscoveredFile[] = []

  function walk(dir: string) {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.name === EXCLUDE_DIRNAME) continue
      if (entry.name.startsWith("_")) continue // our own scripts (_extract.py, etc.)

      const fullPath = path.join(dir, entry.name)
      const relPath = path.relative(CONTENT_ROOT, fullPath).normalize("NFC")
      const relDirLower = path.dirname(relPath).toLowerCase()

      if (entry.isDirectory()) {
        if (shouldSkipDir(relPath.toLowerCase())) continue
        walk(fullPath)
        continue
      }

      const nameLower = entry.name.normalize("NFC").toLowerCase()
      if (shouldSkipDir(relDirLower)) continue

      const cat = classify(relDirLower, nameLower)
      if (cat !== category) continue

      const hint = relPath.split(path.sep).join(" > ")
      results.push({ fullPath, relPath, hint })
    }
  }

  walk(CONTENT_ROOT)
  return results
}
