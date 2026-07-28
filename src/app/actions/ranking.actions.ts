"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // sem I/O/0/1 (confusão)

function genCode(len = 6): string {
  let c = ""
  for (let i = 0; i < len; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return c
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = genCode()
    const exists = await db.rankingGroup.findUnique({ where: { code }, select: { id: true } })
    if (!exists) return code
  }
  return genCode(8) // fallback improvável
}

/** Cria um grupo de ranking e adiciona o criador como membro. */
export async function createRankingGroup(
  name: string,
): Promise<{ success: boolean; code?: string; groupId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autenticado" }

  const trimmed = (name || "").trim()
  if (trimmed.length < 2 || trimmed.length > 40) {
    return { success: false, error: "Nome do grupo deve ter entre 2 e 40 caracteres" }
  }

  const code = await uniqueCode()
  const group = await db.rankingGroup.create({
    data: {
      name: trimmed,
      code,
      ownerId: session.user.id,
      members: { create: { userId: session.user.id } },
    },
    select: { id: true, code: true },
  })

  revalidatePath("/ranking")
  return { success: true, code: group.code, groupId: group.id }
}

/** Entra em um grupo pelo código de convite. */
export async function joinRankingGroup(
  code: string,
): Promise<{ success: boolean; groupId?: string; name?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autenticado" }

  const normalized = (code || "").trim().toUpperCase()
  if (!normalized) return { success: false, error: "Informe o código" }

  const group = await db.rankingGroup.findUnique({
    where: { code: normalized },
    select: { id: true, name: true },
  })
  if (!group) return { success: false, error: "Grupo não encontrado. Confira o código." }

  await db.rankingGroupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
    create: { groupId: group.id, userId: session.user.id },
    update: {},
  })

  revalidatePath("/ranking")
  return { success: true, groupId: group.id, name: group.name }
}

/** Sai de um grupo (o dono não pode sair; deleta o grupo se quiser). */
export async function leaveRankingGroup(
  groupId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Não autenticado" }

  await db.rankingGroupMember.deleteMany({
    where: { groupId, userId: session.user.id },
  })
  revalidatePath("/ranking")
  return { success: true }
}
