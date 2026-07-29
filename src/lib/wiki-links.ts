import { db } from "@/lib/db"

/**
 * Links internos estilo Wikipedia no conteúdo teórico.
 *
 * No corpo (body) do conteúdo, use:
 *   [[slug-do-topico]]              → link com o nome do tópico
 *   [[slug-do-topico|texto exibido]] → link com um texto customizado
 *
 * Onde `slug-do-topico` é o Topic.slug de outro assunto. Esta função (server-only)
 * troca cada marcação por uma âncora HTML apontando para a página do tópico, que o
 * renderizador estiliza como "link azul". Slugs inexistentes viram texto simples.
 */
const WIKI_RE = /\[\[([^\]|[]+?)(?:\|([^\]]+?))?\]\]/g

export async function resolveWikiLinks(body: string): Promise<string> {
  if (!body || !body.includes("[[")) return body

  // Coleta os slugs referenciados
  const slugs = new Set<string>()
  for (const m of body.matchAll(WIKI_RE)) {
    const slug = m[1]?.trim()
    if (slug) slugs.add(slug)
  }
  if (slugs.size === 0) return body

  const topics = await db.topic.findMany({
    where: { slug: { in: [...slugs] } },
    select: {
      slug: true,
      name: true,
      discipline: { select: { slug: true, area: { select: { slug: true } } } },
    },
  })

  const map = new Map<string, { href: string; name: string }>()
  for (const t of topics) {
    map.set(t.slug, {
      href: `/study/${t.discipline.area.slug}/${t.discipline.slug}/${t.slug}`,
      name: t.name,
    })
  }

  return body.replace(WIKI_RE, (_full, rawSlug: string, rawText?: string) => {
    const slug = rawSlug.trim()
    const display = (rawText ?? "").trim()
    const hit = map.get(slug)
    if (!hit) return display || slug // sem página → texto puro
    const text = display || hit.name
    return `<a href="${hit.href}" data-wiki="1">${text}</a>`
  })
}
