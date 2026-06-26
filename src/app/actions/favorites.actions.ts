"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { FavoriteType } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function toggleFavorite(type: FavoriteType, itemId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const userId = session.user.id

  const existing = await db.favorite.findUnique({
    where: { userId_type_itemId: { userId, type, itemId } },
  })

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } })
  } else {
    await db.favorite.create({ data: { userId, type, itemId } })
  }

  revalidatePath("/study", "layout")
}
