"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useMentorStore } from "@/store/mentor-store"
import { fileToAttachment, ATTACH_ACCEPT, REDACAO_CORRECTION_PROMPT } from "@/lib/attach"

/**
 * Envia uma foto/arquivo de redação em papel direto para o Mentor corrigir.
 * Guarda o anexo no store e abre a aba do Mentor, que auto-envia e corrige
 * usando os critérios reais do ENEM (5 competências).
 */
export function PaperEssayButton({
  variant = "outline",
  label = "Corrigir do papel",
}: {
  variant?: "outline" | "default"
  label?: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const setPending = useMentorStore((s) => s.setPending)

  async function handleFile(file?: File | null) {
    if (!file) return
    setLoading(true)
    try {
      const data = await fileToAttachment(file)
      if (!data) {
        toast.error("Envie uma foto (JPG/PNG) ou um PDF da redação.")
        return
      }
      setPending({ text: REDACAO_CORRECTION_PROMPT, image: data })
      toast.success("Enviando para o Mentor corrigir…")
      router.push("/mentor")
    } catch {
      toast.error("Não consegui ler o arquivo. Tente outra foto.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ATTACH_ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      <Button
        variant={variant}
        size="sm"
        className="gap-1"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {label}
      </Button>
    </>
  )
}
