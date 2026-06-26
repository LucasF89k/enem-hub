"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { awardXP } from "@/lib/xp"
import { revalidatePath } from "next/cache"

export interface VideoWithWatched {
  id: string
  youtubeId: string
  title: string
  channel: string
  duration: number | null
  description: string | null
  order: number
  isHighlight: boolean
  watched: boolean
  watchedAt: Date | null
}

export async function markVideoWatched(
  videoId: string
): Promise<{ success: boolean; isNew: boolean }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const existing = await db.videoWatched.findUnique({
    where: { userId_videoId: { userId, videoId } },
    select: { id: true },
  })

  if (existing) {
    return { success: true, isNew: false }
  }

  await db.videoWatched.create({ data: { userId, videoId } })
  await awardXP(userId, 15)
  revalidatePath("/study", "layout")

  return { success: true, isNew: true }
}

export async function getTopicVideos(topicId: string): Promise<VideoWithWatched[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const userId = session.user.id

  const videos = await db.topicVideo.findMany({
    where: { topicId },
    orderBy: [{ isHighlight: "desc" }, { order: "asc" }],
    include: {
      watched: {
        where: { userId },
        select: { watchedAt: true },
        take: 1,
      },
    },
  })

  return videos.map((v) => ({
    id: v.id,
    youtubeId: v.youtubeId,
    title: v.title,
    channel: v.channel,
    duration: v.duration,
    description: v.description,
    order: v.order,
    isHighlight: v.isHighlight,
    watched: v.watched.length > 0,
    watchedAt: v.watched[0]?.watchedAt ?? null,
  }))
}
