import { headers } from "next/headers"

/**
 * Rate limiting simples, com dois modos.
 *
 * O problema: em serverless (Vercel) cada requisição pode cair numa instância
 * diferente e efêmera. Um contador em memória, por isso, NÃO barra de verdade
 * um ataque distribuído: o atacante espalha as tentativas entre instâncias e
 * cada uma acha que é a primeira. Rate limiting confiável precisa de um lugar
 * compartilhado (Redis).
 *
 * A saída aqui é adaptativa:
 *  - SE as env vars do Upstash existirem (UPSTASH_REDIS_REST_URL e _TOKEN),
 *    usa Upstash Redis, que é compartilhado entre todas as instâncias e barra
 *    de verdade.
 *  - SENÃO, cai pra um contador em memória. Não segura ataque distribuído,
 *    mas ainda corta o caso comum (um script martelando rápido tende a cair
 *    na mesma instância quente) e não exige nenhum setup nem dependência.
 *
 * Assim o código funciona hoje sem infra nenhuma, e vira robusto no dia que
 * o Upstash for ligado: é só criar a conta e adicionar as duas env vars,
 * sem mexer aqui de novo.
 *
 * O Upstash é chamado pela REST API (fetch puro), então não há pacote novo
 * pra instalar.
 */

interface RateLimitResult {
  /** true se a requisição pode seguir; false se estourou o limite */
  allowed: boolean
  /** segundos até poder tentar de novo (só quando bloqueado) */
  retryAfter: number
}

// ── Fallback em memória ──────────────────────────────────────────────
// Map de chave -> lista de timestamps (ms) das tentativas dentro da janela.
// Vive só no processo atual; some quando a instância é reciclada.
const memoria = new Map<string, number[]>()

function limitarEmMemoria(chave: string, max: number, janelaMs: number): RateLimitResult {
  const agora = Date.now()
  const inicioJanela = agora - janelaMs
  const tentativas = (memoria.get(chave) ?? []).filter((t) => t > inicioJanela)

  if (tentativas.length >= max) {
    const maisAntiga = tentativas[0]
    const retryAfter = Math.ceil((maisAntiga + janelaMs - agora) / 1000)
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) }
  }

  tentativas.push(agora)
  memoria.set(chave, tentativas)

  // Faxina oportunista: sem isso o Map cresceria sem parar com chaves velhas.
  if (memoria.size > 5000) {
    for (const [k, ts] of memoria) {
      const vivas = ts.filter((t) => t > inicioJanela)
      if (vivas.length === 0) memoria.delete(k)
      else memoria.set(k, vivas)
    }
  }

  return { allowed: true, retryAfter: 0 }
}

// ── Upstash (quando configurado) ─────────────────────────────────────
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
const temUpstash = !!upstashUrl && !!upstashToken

/**
 * Janela deslizante no Redis via INCR + EXPIRE (pipeline REST do Upstash).
 * Primeira tentativa cria a chave e marca o TTL; as seguintes só incrementam.
 * Se o Redis estiver fora do ar, deixa passar (fail-open): rate limiting não
 * deve derrubar o login por conta de uma indisponibilidade do cache.
 */
async function limitarNoUpstash(
  chave: string,
  max: number,
  janelaMs: number,
): Promise<RateLimitResult> {
  const janelaSeg = Math.ceil(janelaMs / 1000)
  try {
    const resp = await fetch(`${upstashUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", chave],
        ["EXPIRE", chave, String(janelaSeg), "NX"],
        ["TTL", chave],
      ]),
      cache: "no-store",
    })

    if (!resp.ok) return { allowed: true, retryAfter: 0 }

    const dados = (await resp.json()) as { result: unknown }[]
    const contagem = Number(dados[0]?.result ?? 0)
    const ttl = Number(dados[2]?.result ?? janelaSeg)

    if (contagem > max) {
      return { allowed: false, retryAfter: ttl > 0 ? ttl : janelaSeg }
    }
    return { allowed: true, retryAfter: 0 }
  } catch {
    // Fail-open: cache indisponível não pode bloquear login legítimo.
    return { allowed: true, retryAfter: 0 }
  }
}

/**
 * Limita `acao` a `max` ocorrências por `janelaMs`, por identificador.
 *
 * @param acao      rótulo curto (ex.: "login", "mentor") que separa os
 *                  contadores de operações diferentes
 * @param id        quem está sendo limitado (IP, ou userId): a mesma pessoa
 *                  martelando cai na mesma chave
 */
export async function rateLimit(
  acao: string,
  id: string,
  max: number,
  janelaMs: number,
): Promise<RateLimitResult> {
  const chave = `rl:${acao}:${id}`
  return temUpstash
    ? limitarNoUpstash(chave, max, janelaMs)
    : limitarEmMemoria(chave, max, janelaMs)
}

/**
 * IP de quem fez a requisição, lido do x-forwarded-for (o header que a Vercel
 * preenche). Cai pra "desconhecido" quando não há como saber, o que agrupa
 * esses casos numa chave só em vez de deixar todo mundo sem limite.
 */
export async function ipDaRequisicao(): Promise<string> {
  const h = await headers()
  const fwd = h.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return h.get("x-real-ip") ?? "desconhecido"
}
