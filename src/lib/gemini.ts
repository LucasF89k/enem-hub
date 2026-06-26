import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const gemini = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
})

export const geminiPro = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.5,
    maxOutputTokens: 4096,
  },
})

export async function generateText(prompt: string): Promise<string> {
  const result = await gemini.generateContent(prompt)
  return result.response.text()
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const result = await geminiPro.generateContent(
    prompt + "\n\nRetorne SOMENTE JSON válido, sem markdown, sem explicações."
  )
  const text = result.response.text().trim()
  const clean = text.replace(/^```json\n?/m, "").replace(/\n?```$/m, "").trim()
  return JSON.parse(clean) as T
}
