"use client"

import { useEffect } from "react"
import { usePWAStore } from "@/store/pwa-store"
import { getPendingCount, flushOfflineQueue } from "@/lib/offline-queue"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function ServiceWorkerRegistrar() {
  const { setOffline, setDeferredPrompt, setInstalled, setPendingOfflineCount } = usePWAStore()

  useEffect(() => {
    // Register SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {})
    }

    // Online/offline listeners
    const handleOffline = () => setOffline(true)
    const handleOnline = async () => {
      setOffline(false)
      // Flush any queued offline actions when back online
      try {
        await flushOfflineQueue({})
        const count = await getPendingCount()
        setPendingOfflineCount(count)
      } catch {}
    }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    // Initial state
    setOffline(!navigator.onLine)

    // beforeinstallprompt: capture and store in Zustand
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handleInstallPrompt)

    // appinstalled
    const handleInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener("appinstalled", handleInstalled)

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true)
    }

    // Check pending offline count
    getPendingCount().then(setPendingOfflineCount).catch(() => {})

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt)
      window.removeEventListener("appinstalled", handleInstalled)
    }
  }, [setOffline, setDeferredPrompt, setInstalled, setPendingOfflineCount])

  return null
}
