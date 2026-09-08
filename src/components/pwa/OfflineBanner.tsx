"use client"

import { usePWAStore } from "@/store/pwa-store"
import { WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function OfflineBanner() {
  const { isOffline, pendingOfflineCount } = usePWAStore()

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2",
        "bg-amber-500 text-amber-950 text-xs font-medium py-1.5 px-4",
        "transition-transform duration-300",
        isOffline ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>
        Você está offline
        {pendingOfflineCount > 0 && ` (${pendingOfflineCount} ação${pendingOfflineCount > 1 ? "ões" : ""} pendente${pendingOfflineCount > 1 ? "s" : ""})`}
      </span>
    </div>
  )
}
