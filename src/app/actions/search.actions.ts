"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export interface SearchResult {
  id: string
  type: "content" | "question" | "flashcard" | "note"
  title: string
  subtitle?: string
  href: string
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const q = query.trim()
  if (q.length < 2) return []

  const userId = session.user.id

  const [contents, questions, flashcards, notes] = await Promise.all([
    db.content.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        topic: {
          select: {
            slug: true,
            discipline: { select: { slug: true, area: { select: { slug: true } } } },
          },
        },
      },
      take: 5,
    }),

    db.question.findMany({
      where: {
        statement: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        statement: true,
        source: true,
        year: true,
        areaSlug: true,
      },
      take: 5,
    }),

    db.flashcard.findMany({
      where: {
        OR: [
          { front: { contains: q, mode: "insensitive" } },
          { back: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        front: true,
        deck: { select: { name: true } },
      },
      take: 5,
    }),

    db.note.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        folder: { select: { name: true } },
      },
      take: 5,
    }),
  ])

  const AREA_LABEL: Record<string, string> = {
    "ciencias-natureza": "Ciências da Natureza",
    "ciencias-humanas": "Ciências Humanas",
    linguagens: "Linguagens",
    matematica: "Matemática",
  }

  const results: SearchResult[] = []

  for (const c of contents) {
    const area = c.topic?.discipline?.area?.slug
    const discipline = c.topic?.discipline?.slug
    const topic = c.topic?.slug
    const href =
      area && discipline && topic
        ? `/study/${area}/${discipline}/${topic}`
        : "/study"
    results.push({
      id: c.id,
      type: "content",
      title: c.title,
      subtitle: c.topic?.discipline?.area?.slug
        ? AREA_LABEL[c.topic.discipline.area.slug]
        : undefined,
      href,
    })
  }

  for (const q2 of questions) {
    results.push({
      id: q2.id,
      type: "question",
      title: q2.statement.slice(0, 80) + (q2.statement.length > 80 ? "…" : ""),
      subtitle: [q2.source, q2.year].filter(Boolean).join(" · ") || undefined,
      href: `/questions/${q2.id}`,
    })
  }

  for (const f of flashcards) {
    results.push({
      id: f.id,
      type: "flashcard",
      title: f.front.slice(0, 80) + (f.front.length > 80 ? "…" : ""),
      subtitle: f.deck?.name ?? undefined,
      href: `/flashcards`,
    })
  }

  for (const n of notes) {
    results.push({
      id: n.id,
      type: "note",
      title: n.title,
      subtitle: n.folder?.name ?? undefined,
      href: `/notes/${n.id}`,
    })
  }

  return results
}
