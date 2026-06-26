import type { MetadataRoute } from "next"
import { db } from "@/lib/db"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://enem-hub.vercel.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const areas = await db.area.findMany({ select: { slug: true } })
  const disciplines = await db.discipline.findMany({
    select: { slug: true, area: { select: { slug: true } } },
  })
  const topics = await db.topic.findMany({
    select: { slug: true, discipline: { select: { slug: true, area: { select: { slug: true } } } } },
  })

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  const areaRoutes: MetadataRoute.Sitemap = areas.map((a) => ({
    url: `${BASE_URL}/study/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const disciplineRoutes: MetadataRoute.Sitemap = disciplines.map((d) => ({
    url: `${BASE_URL}/study/${d.area.slug}/${d.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const topicRoutes: MetadataRoute.Sitemap = topics.map((t) => ({
    url: `${BASE_URL}/study/${t.discipline.area.slug}/${t.discipline.slug}/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  return [...staticRoutes, ...areaRoutes, ...disciplineRoutes, ...topicRoutes]
}
