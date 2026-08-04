import OpenAI from 'openai'

/**
 * Cliente MiMo (mimo-v2.5 / mimo-v2.5-pro).
 *
 * Dois provedores suportados, escolhidos por env var:
 *  - OpenRouter  → se OPENROUTER_API_KEY estiver setada (paga em USD, cartão internacional)
 *  - Xiaomi      → fallback padrão (api.xiaomimimo.com, usa MIMO_API_KEY)
 *
 * Os exports (mimo, MIMO_MODEL, MIMO_MODEL_PRO, generateMimoJSON) têm a mesma
 * assinatura nos dois casos, então nenhum caller (mentor, generate-content,
 * extract-pdf-exams, etc.) precisa mudar — só a escolha do provedor.
 */
const useOpenRouter = !!process.env.OPENROUTER_API_KEY

export const MIMO_PROVIDER: 'openrouter' | 'xiaomi' = useOpenRouter ? 'openrouter' : 'xiaomi'

export const mimo = new OpenAI(
  useOpenRouter
    ? {
        apiKey: process.env.OPENROUTER_API_KEY!,
        baseURL: 'https://openrouter.ai/api/v1',
        // Headers opcionais do OpenRouter (ranking/analytics) — não afetam o custo.
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://enem-hub.vercel.app',
          'X-Title': 'Vion',
        },
      }
    : {
        apiKey: process.env.MIMO_API_KEY!,
        baseURL: 'https://api.xiaomimimo.com/v1',
      }
)

// No OpenRouter o model id é prefixado com "xiaomi/"; no endpoint direto da Xiaomi não.
export const MIMO_MODEL = useOpenRouter ? 'xiaomi/mimo-v2.5' : 'mimo-v2.5'
export const MIMO_MODEL_PRO = useOpenRouter ? 'xiaomi/mimo-v2.5-pro' : 'mimo-v2.5-pro'

/**
 * Chaves do MiMo para ROTAÇÃO (usa uma até estourar a cota, passa pra próxima).
 * Defina MIMO_API_KEYS separadas por vírgula; cai para a chave única do provedor.
 */
export function mimoKeys(): string[] {
  const multi = (process.env.MIMO_API_KEYS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (multi.length) return multi
  const single = useOpenRouter ? process.env.OPENROUTER_API_KEY : process.env.MIMO_API_KEY
  return single ? [single] : []
}

/** Cliente MiMo com uma chave específica (para rotação de chaves no Mentor). */
export function mimoClientWithKey(apiKey: string): OpenAI {
  return new OpenAI(
    useOpenRouter
      ? {
          apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://enem-hub.vercel.app',
            'X-Title': 'Vion',
          },
        }
      : { apiKey, baseURL: 'https://api.xiaomimimo.com/v1' },
  )
}

/** Extrai o JSON (objeto OU array) de uma resposta, ignorando cercas/reasoning/prosa. */
function extractJson(raw: string): string {
  const firstObj = raw.indexOf('{')
  const firstArr = raw.indexOf('[')
  let s = -1
  let e = -1
  if (firstArr >= 0 && (firstObj < 0 || firstArr < firstObj)) {
    s = firstArr
    e = raw.lastIndexOf(']')
  } else {
    s = firstObj
    e = raw.lastIndexOf('}')
  }
  return s >= 0 && e > s ? raw.slice(s, e + 1) : raw
}

export async function generateMimoJSON<T>(prompt: string, maxTokens = 8000): Promise<T> {
  // mimo-v2.5(-pro) é modelo de "reasoning": o raciocínio consome tokens, então o
  // orçamento precisa ser folgado pro JSON (content) sair completo. Tenta o pro e,
  // se falhar (parse/erro), cai pro modelo padrão.
  let lastErr: unknown = null
  for (const model of [MIMO_MODEL_PRO, MIMO_MODEL]) {
    try {
      const completion = await mimo.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.5,
      })
      const raw = (completion.choices[0]?.message?.content ?? '').trim()
      const clean = extractJson(raw)
      // Sanitiza barras invertidas inválidas (LaTeX etc.) que quebram o JSON.
      const sanitized = clean.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
      try {
        return JSON.parse(sanitized) as T
      } catch {
        return JSON.parse(clean) as T
      }
    } catch (err) {
      lastErr = err
      continue
    }
  }
  throw lastErr ?? new Error('generateMimoJSON: não foi possível obter JSON válido')
}
