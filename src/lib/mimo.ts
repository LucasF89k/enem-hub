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
          'X-Title': 'ENEM Hub',
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

export async function generateMimoJSON<T>(prompt: string, maxTokens = 4096): Promise<T> {
  const completion = await mimo.chat.completions.create({
    model: MIMO_MODEL_PRO,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.5,
  })
  const raw = (completion.choices[0]?.message?.content ?? '').trim()
  const clean = raw.replace(/^```json\n?/m, '').replace(/^```\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(clean) as T
}
