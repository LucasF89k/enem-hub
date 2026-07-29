"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import { updateProfileImage } from "@/app/actions/profile.actions"

interface AvatarUploadProps {
  currentImage: string | null
  initials: string
}

export function AvatarUpload({ currentImage, initials }: AvatarUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentImage)
  const [isPending, startTransition] = useTransition()

  // Redimensiona/recorta a imagem para um quadrado pequeno (JPEG leve) no cliente.
  function resizeImage(file: File, size = 256): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("canvas"))
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL("image/jpeg", 0.85))
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("load"))
      }
      img.src = url
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // permite reselecionar o mesmo arquivo
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 8MB.")
      return
    }

    startTransition(async () => {
      try {
        const dataUrl = await resizeImage(file)
        setPreview(dataUrl)
        const result = await updateProfileImage(dataUrl)
        if (result.success) {
          toast.success("Foto atualizada!")
          router.refresh()
        } else {
          toast.error(result.error ?? "Erro ao salvar foto")
          setPreview(currentImage)
        }
      } catch {
        toast.error("Erro ao processar a foto")
        setPreview(currentImage)
      }
    })
  }

  return (
    <div className="relative">
      <Avatar className="h-16 w-16">
        <AvatarImage src={preview ?? undefined} alt="Avatar" />
        <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
        aria-label="Alterar foto de perfil"
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Camera className="h-3 w-3" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
