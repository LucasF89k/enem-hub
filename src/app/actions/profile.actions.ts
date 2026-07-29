"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

/**
 * Salva a foto de perfil como data URL (JPEG pequeno, já redimensionado no cliente)
 * direto no banco — sem depender de serviço externo (Cloudinary não é necessário).
 */
export async function updateProfileImage(
  base64: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autorizado" }

  if (!base64.startsWith("data:image/")) {
    return { success: false, error: "Formato inválido. Use uma imagem." }
  }
  // O cliente já reduz para ~256px; isto é só uma trava de segurança (~500KB).
  if (base64.length > 700_000) {
    return { success: false, error: "Imagem muito grande. Tente outra." }
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { image: base64 },
    })
  } catch {
    return { success: false, error: "Não foi possível salvar a foto." }
  }

  revalidatePath("/profile")
  revalidatePath("/")
  return { success: true }
}
