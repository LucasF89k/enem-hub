import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"

export async function extractPdfText(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath)
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}

export async function extractDocxText(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath)
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".pdf") return extractPdfText(filePath)
  if (ext === ".docx") return extractDocxText(filePath)
  throw new Error(`Extensão não suportada: ${ext}`)
}

export function normalizeForHash(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function md5(s: string): string {
  return crypto.createHash("md5").update(normalizeForHash(s)).digest("hex")
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\w\s]/g, "")
    .trim()
}

export function tokenSet(s: string): Set<string> {
  return new Set(normalize(s).split(/\s+/).filter(Boolean))
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const t of a) if (b.has(t)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

export interface CliFlags {
  [key: string]: string | true
}

export function parseCliFlags(argv: string[]): CliFlags {
  const flags: CliFlags = {}
  for (const a of argv) {
    if (!a.startsWith("--")) continue
    const [k, v] = a.slice(2).split("=")
    flags[k] = v ?? true
  }
  return flags
}
