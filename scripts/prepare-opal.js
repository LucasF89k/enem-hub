/**
 * Prepara as imagens da opala geradas por IA para uso no app.
 *
 * O que faz, por imagem:
 *  1. classifica a fase pela saturação média (rocha opaca → gema pura)
 *  2. recorta o fundo preto por flood fill a partir das bordas — flood fill e
 *     não threshold simples de propósito: a rocha tem sombras tão escuras
 *     quanto o fundo, e um threshold global abriria buracos dentro da pedra.
 *     Partindo das bordas, só some o preto que está REALMENTE ligado ao fundo.
 *  3. recorta a moldura vazia, redimensiona e salva como WebP com alpha
 *
 * Uso: node scripts/prepare-opal.js "<pasta com os 4 PNGs>"
 */
/* eslint-disable @typescript-eslint/no-require-imports -- script Node standalone, roda fora do bundle */
const fs = require("node:fs")
const path = require("node:path")
const sharp = require("sharp")

const SRC_DIR = process.argv[2]
const OUT_DIR = path.join(process.cwd(), "public", "opal")
// Abaixo disso, E ligado à borda, é fundo. Tem que ser BEM baixo: a rocha das
// fases iniciais tem sombras quase pretas, e com limiar alto o flood fill
// entrava por elas e abria buracos no meio da pedra.
const BG_LUMA = 7
const OUT_SIZE = 640

async function stats(file) {
  const { data, info } = await sharp(file)
    .resize(160, 160, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true })
  let sat = 0
  let n = 0
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const mx = Math.max(r, g, b)
    const mn = Math.min(r, g, b)
    if (mx < 16) continue // ignora o fundo
    sat += mx === 0 ? 0 : (mx - mn) / mx
    n++
  }
  return { file, sat: n ? sat / n : 0 }
}

async function cutout(file, outName) {
  const img = sharp(file).ensureAlpha()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info

  // flood fill a partir das bordas
  const bg = new Uint8Array(W * H)
  const stack = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const p = y * W + x
    if (bg[p]) return
    const i = p * C
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    if (luma > BG_LUMA) return
    bg[p] = 1
    stack.push(p)
  }
  for (let x = 0; x < W; x++) {
    push(x, 0)
    push(x, H - 1)
  }
  for (let y = 0; y < H; y++) {
    push(0, y)
    push(W - 1, y)
  }
  while (stack.length) {
    const p = stack.pop()
    const x = p % W
    const y = (p / W) | 0
    push(x + 1, y)
    push(x - 1, y)
    push(x, y + 1)
    push(x, y - 1)
  }

  for (let p = 0; p < W * H; p++) {
    if (bg[p]) data[p * C + 3] = 0
  }

  const kept = W * H - bg.reduce((a, b) => a + b, 0)
  await sharp(data, { raw: { width: W, height: H, channels: C } })
    .trim({ threshold: 1 })
    .resize(OUT_SIZE, OUT_SIZE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(path.join(OUT_DIR, outName))
  return kept / (W * H)
}

;(async () => {
  if (!SRC_DIR || !fs.existsSync(SRC_DIR)) {
    console.error("pasta inválida:", SRC_DIR)
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .map((f) => path.join(SRC_DIR, f))

  const measured = await Promise.all(files.map(stats))
  measured.sort((a, b) => a.sat - b.sat) // menos colorida = fase mais inicial

  console.log("ordem detectada (saturação crescente):")
  for (let i = 0; i < measured.length; i++) {
    console.log(`  stage-${i}  sat=${measured[i].sat.toFixed(3)}  ${path.basename(measured[i].file)}`)
  }

  for (let i = 0; i < measured.length; i++) {
    const ratio = await cutout(measured[i].file, `stage-${i}.webp`)
    const outPath = path.join(OUT_DIR, `stage-${i}.webp`)
    console.log(
      `stage-${i}.webp  ${(fs.statSync(outPath).size / 1024).toFixed(0)} KB  (${(ratio * 100).toFixed(1)}% da área mantida)`,
    )
  }
})()
