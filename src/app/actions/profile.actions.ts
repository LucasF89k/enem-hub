"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateProfileImage(
  base64: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autorizado" }

  if (!base64.startsWith("data:image/")) {
    return { success: false, error: "Formato inválido. Use uma imagem." }
  }

  // ~2MB limit: base64 encoding is ~4/3 of binary size
  if (base64.length > 2_800_000) {
    return { success: false, error: "Imagem muito grande. Máximo 2MB." }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { image: base64 },
  })

  revalidatePath("/profile")
  revalidatePath("/")
  return { success: true }
}
