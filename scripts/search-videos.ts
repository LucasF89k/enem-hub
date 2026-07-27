import "dotenv/config"
import { PrismaClient, Prisma } from "@prisma/client"

const db = new PrismaClient()

// ── Types ────────────────────────────────────────────────────────────
interface SearchItem {
  id: { videoId: string }
  snippet: { title: string; channelTitle: string; description: string }
}

interface VideoItem {
  id: string
  contentDetails: { duration: string }
}

// ── Helpers ─────────────────────────────────────────────────────────
function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return Math.round((parseInt(m[1] || "0") * 60) + parseInt(m[2] || "0") + parseInt(m[3] || "0") / 60)
}

const KNOWN_CHANNELS = [
  "noslen", "ferretto", "me salva", "descomplica", "parabólica",
  "professor boaro", "kuadro", "geobrasil", "química com potássio",
  "física e afins", "equaciona", "matemática rio", "biologia total",
  "redação nota mil", "português com letícia", "canal do slow",
  "victor dalton", "stoodi", "estratégia vestibulares",
]

function isKnown(channel: string) {
  const lower = channel.toLowerCase()
  return KNOWN_CHANNELS.some((k) => lower.includes(k))
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ── YouTube API ──────────────────────────────────────────────────────
async function searchYouTube(query: string, key: string): Promise<SearchItem[]> {
  const p = new URLSearchParams({
    q: query,
    part: "snippet",
    type: "video",
    maxResults: "10",
    relevanceLanguage: "pt",
    regionCode: "BR",
    videoDuration: "medium",
    key,
  })
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${p}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(`YouTube search ${res.status}`), { status: res.status, err })
  }
  const data = await res.json()
  return (data.items ?? []) as SearchItem[]
}

async function fetchDurations(ids: string[], key: string): Promise<Map<string, number>> {
  if (!ids.length) return new Map()
  const p = new URLSearchParams({ id: ids.join(","), part: "contentDetails", key })
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${p}`)
  if (!res.ok) return new Map()
  const data = await res.json()
  const map = new Map<string, number>()
  for (const item of (data.items ?? []) as VideoItem[]) {
    map.set(item.id, parseDuration(item.contentDetails.duration))
  }
  return map
}

const MAX_VIDEOS = 6

function pickVideos(items: SearchItem[]) {
  const known = items.filter((i) => isKnown(i.snippet.channelTitle))
  const others = items.filter((i) => !isKnown(i.snippet.channelTitle))
  // Prioriza canais conhecidos, completa com outros até MAX_VIDEOS (sem repetir).
  const seen = new Set<string>()
  const selected = [...known, ...others]
    .filter((v) => (seen.has(v.id.videoId) ? false : (seen.add(v.id.videoId), true)))
    .slice(0, MAX_VIDEOS)
  return selected.map((v, idx) => ({ video: v, order: idx, isHighlight: idx === 0 }))
}

// Nomes de tópico com "—", ":", abreviações ou "ENEM 20XX" atrapalham a busca.
// Limpa pra deixar só o assunto principal.
function cleanTopicName(name: string): string {
  return name
    .replace(/\bENEM\s*\d{4}\b/gi, "")
    .split(/[—–:]/)[0]
    .replace(/\bCent\.?\b/gi, "Centrais")
    .replace(/\s+/g, " ")
    .trim()
}

// ── Main ─────────────────────────────────────────────────────────────
// Skip non-flag args (e.g. the script path injected by npx/tsx)
const argv = process.argv.filter((a) => a.startsWith("--"))
const flags: Record<string, string | true> = {}
for (const a of argv) {
  const [k, v] = a.slice(2).split("=")
  flags[k] = v ?? true
}

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) { console.error("❌  YOUTUBE_API_KEY not set in .env"); process.exit(1) }

  const isDryRun = flags["dry-run"] === true
  const skipExisting = flags["skip-existing"] === true
  const limitN = flags["limit"] ? parseInt(flags["limit"] as string) : undefined
  const areaFilter = flags["area"] as string | undefined
  const discFilter = flags["discipline"] as string | undefined

  if (isDryRun) console.log("🔍  DRY RUN — not saving to DB\n")

  // Build topic filter
  const where: Prisma.TopicWhereInput = {}
  if (discFilter || areaFilter) {
    const disciplineFilter: Prisma.DisciplineWhereInput = {}
    if (discFilter) disciplineFilter.slug = discFilter
    if (areaFilter) disciplineFilter.area = { slug: areaFilter }
    where.discipline = disciplineFilter
  }
  if (skipExisting) where.videos = { none: {} }
  const isFill = flags["fill"] === true // completa até MAX_VIDEOS por tópico (resumível)

  let topics = await db.topic.findMany({
    where,
    include: {
      discipline: { include: { area: { select: { name: true, slug: true } } } },
      _count: { select: { videos: true } },
    },
    orderBy: { order: "asc" },
    ...(limitN ? { take: limitN } : {}),
  })

  // --fill: só tópicos que ainda têm menos de MAX_VIDEOS vídeos (retoma entre dias de cota).
  if (isFill) topics = topics.filter((t) => t._count.videos < MAX_VIDEOS)

  console.log(`📚  ${topics.length} topics to process${isFill ? ` (com <${MAX_VIDEOS} vídeos)` : ""}\n`)

  let totalSaved = 0
  let totalEmpty = 0
  let quotaUsed = 0

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    const query = `${cleanTopicName(topic.name)} ${topic.discipline.name} ENEM`

    process.stdout.write(`[${i + 1}/${topics.length}] ${topic.name} (${topic.discipline.area.name}) … `)

    let items: SearchItem[] = []

    const doSearch = async () => {
      items = await searchYouTube(query, apiKey)
      quotaUsed += 100
    }

    try {
      await doSearch()
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e.status === 403 || e.status === 429) {
        console.log("⚠️  quota/rate hit, waiting 60s…")
        await sleep(60_000)
        try { await doSearch() } catch {
          console.log("❌  skip after retry")
          totalEmpty++
          await sleep(200)
          continue
        }
      } else {
        console.log(`❌  ${String(err)}`)
        totalEmpty++
        await sleep(200)
        continue
      }
    }

    if (!items.length) {
      console.log("no results")
      totalEmpty++
      await sleep(200)
      continue
    }

    const selected = pickVideos(items)
    const ids = selected.map((s) => s.video.id.videoId)

    let durations = new Map<string, number>()
    try { durations = await fetchDurations(ids, apiKey); quotaUsed += 1 } catch { /* skip */ }

    if (!isDryRun) {
      for (const { video, order, isHighlight } of selected) {
        const youtubeId = video.id.videoId
        await db.topicVideo.upsert({
          where: { youtubeId },
          create: {
            topicId: topic.id,
            youtubeId,
            title: video.snippet.title.slice(0, 200),
            channel: video.snippet.channelTitle,
            description: video.snippet.description?.slice(0, 150) || null,
            duration: durations.get(youtubeId) || null,
            order,
            isHighlight,
          },
          update: {
            title: video.snippet.title.slice(0, 200),
            channel: video.snippet.channelTitle,
            description: video.snippet.description?.slice(0, 150) || null,
            duration: durations.get(youtubeId) || null,
            order,
            isHighlight,
          },
        })
        totalSaved++
      }
    } else {
      for (const { video, isHighlight } of selected) {
        console.log(`\n    ${isHighlight ? "⭐" : "  "} ${video.snippet.title.slice(0, 60)} — ${video.snippet.channelTitle}`)
        totalSaved++
      }
      process.stdout.write("")
    }

    if (!isDryRun) console.log(`✓ ${selected.length} saved`)

    await sleep(200)
  }

  console.log("\n" + "─".repeat(50))
  console.log(`✅  Done!`)
  console.log(`   Videos ${isDryRun ? "found" : "saved"}: ${totalSaved}`)
  console.log(`   Topics with no results:    ${totalEmpty}`)
  console.log(`   Estimated quota used:      ${quotaUsed} units`)

  await db.$disconnect()
}

main().catch((err) => {
  console.error(err)
  db.$disconnect()
  process.exit(1)
})
