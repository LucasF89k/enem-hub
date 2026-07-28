// Horário de Brasília (UTC-3, sem horário de verão desde 2019).
// O servidor roda em UTC; usamos estas funções para que "o dia" reinicie à
// meia-noite de Brasília, não à meia-noite UTC (que seria 21h aqui).
const BR_OFFSET_MIN = 180 // minutos que Brasília está atrás do UTC

/** Instante UTC correspondente à 00:00 de Brasília do dia da data informada. */
export function startOfDayBR(d: Date = new Date()): Date {
  const shifted = new Date(d.getTime() - BR_OFFSET_MIN * 60_000)
  const midnightWall = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  )
  return new Date(midnightWall + BR_OFFSET_MIN * 60_000)
}

/** Início do dia de Brasília N dias a partir de `d` (N pode ser negativo). */
export function addDaysBR(d: Date, days: number): Date {
  return new Date(startOfDayBR(d).getTime() + days * 86_400_000)
}
