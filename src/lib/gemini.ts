import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const gemini = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
})

export const geminiPro = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.5,
    maxOutputTokens: 8192,
  },
})

/** Modelo de chat com instrução de sistema (para o Mentor, com streaming). */
export function geminiChatModel(systemInstruction: string) {
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  })
}

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
