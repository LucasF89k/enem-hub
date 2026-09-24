import "dotenv/config"
import { PrismaClient } from "@prisma/client"

/**
 * Atualiza os metadados dos vídeos guardados e remove os que saíram do ar.
 *
 * Por que isto existe: as Políticas de Desenvolvedor do YouTube (seção
 * III.E.4) dizem que dados "Non-Authorized" da API (título, canal, duração,
 * contagem de views) só podem ser guardados por no máximo 30 dias; depois, o
 * app tem que deletar ou dar refresh. Também exigem verificar, a cada 30
 * dias, que o vídeo não foi deletado. O `youtubeId` em si pode ficar pra
 * sempre (é o identificador, não "dados"), mas o resto precisa desta rotina.
 *
 * O que faz:
 *  1. Lê todos os TopicVideo do banco.
 *  2. Consulta a API do YouTube em lotes de 50 (1 unidade de cota por lote).
 *  3. Atualiza título, canal e duração dos que ainda existem.
 *  4. Remove os que a API não retornou: vídeo deletado, privado ou com o
 *     canal encerrado. Manter um desses seria mostrar ao aluno um vídeo que
 *     não toca, além de reter dado que já deveria ter saído.
 *
 * Uso: rodar de tempos em tempos (idealmente a cada menos de 30 dias, por
 * cron/agendador). Comando: `npm run refresh-videos`.
 */

const db = new PrismaClient()

interface VideoApiItem {
  id: string
  snippet?: { title: string; channelTitle: string; description?: string }
  contentDetails?: { duration: string }
}

/** ISO 8601 (PT#M#S) -> minutos inteiros, igual ao search-videos.ts. */
function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  const horas = Number(m[1] ?? 0)
  const min = Number(m[2] ?? 0)
  const seg = Number(m[3] ?? 0)
  return Math.max(1, Math.round(horas * 60 + min + seg / 60))
}

/** Divide um array em pedaços de tamanho fixo. */
function emLotes<T>(arr: T[], tamanho: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += tamanho) out.push(arr.slice(i, i + tamanho))
  return out
}

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.error("❌  YOUTUBE_API_KEY não está no .env")
    process.exit(1)
  }

  const videos = await db.topicVideo.findMany({
    select: { id: true, youtubeId: true },
  })
  if (videos.length === 0) {
    console.log("Nenhum vídeo no banco. Nada a fazer.")
    return
  }

  console.log(`Verificando ${videos.length} vídeos na API do YouTube...`)

  const idsVivos = new Set<string>()
  let atualizados = 0
  let quotaUsada = 0

  // A API aceita até 50 ids por chamada (part=snippet,contentDetails).
  for (const lote of emLotes(videos, 50)) {
    const ids = lote.map((v) => v.youtubeId)
    const p = new URLSearchParams({
      id: ids.join(","),
      part: "snippet,contentDetails",
      key: apiKey,
    })

    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${p}`)
    quotaUsada += 1
    if (!res.ok) {
      console.error(`  ⚠️  lote falhou (HTTP ${res.status}), pulando`)
      // Sem confirmação da API, NÃO removemos: um erro de rede não pode
      // apagar vídeos bons. Marca todos como vivos pra preservar.
      for (const v of lote) idsVivos.add(v.youtubeId)
      continue
    }

    const data = (await res.json()) as { items?: VideoApiItem[] }
    for (const item of data.items ?? []) {
      idsVivos.add(item.id)
      if (!item.snippet) continue
      await db.topicVideo.updateMany({
        where: { youtubeId: item.id },
        data: {
          title: item.snippet.title.slice(0, 200),
          channel: item.snippet.channelTitle,
          description: item.snippet.description?.slice(0, 150) || null,
          duration: item.contentDetails
            ? parseDuration(item.contentDetails.duration)
            : undefined,
        },
      })
      atualizados++
    }
  }

  // Os que a API não devolveu (e não caíram em lote com erro) sumiram do
  // YouTube: deletados, privados ou canal encerrado.
  const mortos = videos.filter((v) => !idsVivos.has(v.youtubeId))
  if (mortos.length > 0) {
    await db.topicVideo.deleteMany({
      where: { id: { in: mortos.map((v) => v.id) } },
    })
  }

  console.log(`✅  ${atualizados} atualizados, ${mortos.length} removidos (fora do ar).`)
  console.log(`    Cota usada: ~${quotaUsada} unidades.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
