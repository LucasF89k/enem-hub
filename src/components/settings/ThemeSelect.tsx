"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

type Theme = "dark" | "light"

/** Alterna claro/escuro AO VIVO: aplica a classe no <html> e salva no localStorage. */
export function ThemeSelect() {
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light")
  }, [])

  function apply(t: Theme) {
    setThemeState(t)
    document.documentElement.classList.toggle("dark", t === "dark")
    try {
      localStorage.setItem("theme", t)
    } catch {
      /* ignore */
    }
  }

  const opt = (t: Theme, label: string, Icon: typeof Moon) => (
    <button
      type="button"
      onClick={() => apply(t)}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
        theme === t
          ? "border-primary bg-primary/10 font-semibold text-primary"
          : "bg-background hover:bg-muted",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )

  return (
    <div className="flex gap-2">
      {opt("dark", "Escuro", Moon)}
      {opt("light", "Claro", Sun)}
    </div>
  )
}
