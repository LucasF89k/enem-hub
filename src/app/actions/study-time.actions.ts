"use server"

import { auth } from "@/lib/auth"
import { recordStudyActivity } from "@/lib/xp"

/**
 * Registra minutos REAIS de leitura de conteúdo (teoria), medidos pelo relógio
 * do dispositivo enquanto a página está visível. Chamado periodicamente pelo
 * StudyTimer (1x por minuto de tempo ativo) e no fim da sessão.
 */
export async function recordReadingMinutes(minutes: number): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return
  const m = Math.min(120, Math.max(0, Math.floor(Number(minutes) || 0)))
  if (m <= 0) return
  await recordStudyActivity(session.user.id, m, "CONTENT")
}
