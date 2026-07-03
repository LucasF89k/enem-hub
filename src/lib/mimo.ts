import OpenAI from 'openai'

export const mimo = new OpenAI({
  apiKey: process.env.MIMO_API_KEY!,
  baseURL: 'https://api.xiaomimimo.com/v1',
})

export const MIMO_MODEL = 'mimo-v2.5'
export const MIMO_MODEL_PRO = 'mimo-v2.5-pro'
