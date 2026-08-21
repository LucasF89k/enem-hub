import { create } from "zustand"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  image?: string // data URL (mensagem do usuário com imagem anexada)
}

export interface PendingSend {
  text: string
  image?: string // data URL (imagem ou PDF)
}

interface MentorStore {
  messages: ChatMessage[]
  isLoading: boolean
  pending: PendingSend | null
  addMessage: (msg: Omit<ChatMessage, "id">) => string
  appendToMessage: (id: string, chunk: string) => void
  /** Descarta a bolha do assistente se ela ficou sem conteúdo (ex.: usuário
   *  interrompeu antes do primeiro token). Sem isso a bolha vazia continua na
   *  lista e o indicador de "digitando" nunca some. */
  dropIfEmpty: (id: string) => void
  setLoading: (v: boolean) => void
  setPending: (p: PendingSend | null) => void
  clear: () => void
}

export const useMentorStore = create<MentorStore>((set) => ({
  messages: [],
  isLoading: false,
  pending: null,
  setPending: (p) => set({ pending: p }),

  addMessage: (msg) => {
    const id = crypto.randomUUID()
    set((state) => ({
      messages: [...state.messages, { ...msg, id }],
    }))
    return id
  },

  appendToMessage: (id, chunk) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + chunk } : m
      ),
    }))
  },

  dropIfEmpty: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => !(m.id === id && m.content.trim() === "")),
    })),

  setLoading: (v) => set({ isLoading: v }),

  clear: () => set({ messages: [], isLoading: false }),
}))
