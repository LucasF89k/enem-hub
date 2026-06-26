import { create } from "zustand"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

interface MentorStore {
  messages: ChatMessage[]
  isLoading: boolean
  addMessage: (msg: Omit<ChatMessage, "id">) => string
  appendToMessage: (id: string, chunk: string) => void
  setLoading: (v: boolean) => void
  clear: () => void
}

export const useMentorStore = create<MentorStore>((set) => ({
  messages: [],
  isLoading: false,

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

  setLoading: (v) => set({ isLoading: v }),

  clear: () => set({ messages: [], isLoading: false }),
}))
