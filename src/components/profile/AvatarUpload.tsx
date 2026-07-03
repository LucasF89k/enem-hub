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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.")
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.")
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setPreview(base64)
      startTransition(async () => {
        try {
          const result = await updateProfileImage(base64)
          if (result.success) {
            toast.success("Foto atualizada!")
            router.refresh()
          } else {
            toast.error(result.error ?? "Erro ao salvar foto")
            setPreview(currentImage)
          }
        } catch {
          toast.error("Erro ao salvar foto")
          setPreview(currentImage)
        }
      })
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ""
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
