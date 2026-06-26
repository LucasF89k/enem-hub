"use client"

import { useState } from "react"
import { usePWAStore } from "@/store/pwa-store"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function InstallPrompt() {
  const { deferredPrompt, isInstalled, setDeferredPrompt } = usePWAStore()
  const [dismissed, setDismissed] = useState(false)

  // Show only if: prompt is available, not installed, not dismissed
  if (!deferredPrompt || isInstalled || dismissed) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setDeferredPrompt(null)
    }
  }

  function handleDismiss() {
    setDismissed(true)
    setDeferredPrompt(null)
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Instalar ENEM Hub</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acesse offline e receba notificações de revisão
          </p>
          <div className="flex gap-2 mt-2.5">
            <Button size="sm" className="h-7 text-xs px-3" onClick={handleInstall}>
              Instalar
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={handleDismiss}>
              Agora não
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
