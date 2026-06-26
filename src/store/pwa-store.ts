"use client"

import { create } from "zustand"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

interface PWAStore {
  isOffline: boolean
  deferredPrompt: BeforeInstallPromptEvent | null
  isInstalled: boolean
  pendingOfflineCount: number
  setOffline: (v: boolean) => void
  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => void
  setInstalled: (v: boolean) => void
  setPendingOfflineCount: (n: number) => void
}

export const usePWAStore = create<PWAStore>((set) => ({
  isOffline: false,
  deferredPrompt: null,
  isInstalled: false,
  pendingOfflineCount: 0,
  setOffline: (v) => set({ isOffline: v }),
  setDeferredPrompt: (e) => set({ deferredPrompt: e }),
  setInstalled: (v) => set({ isInstalled: v }),
  setPendingOfflineCount: (n) => set({ pendingOfflineCount: n }),
}))
