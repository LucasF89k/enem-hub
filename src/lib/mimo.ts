import OpenAI from 'openai'

export const mimo = new OpenAI({
  apiKey: process.env.MIMO_API_KEY!,
  baseURL: 'https://api.xiaomimimo.com/v1',
})

export const MIMO_MODEL = 'mimo-v2.5'
export const MIMO_MODEL_PRO = 'mimo-v2.5-pro'

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
