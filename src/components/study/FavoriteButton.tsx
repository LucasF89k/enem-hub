"use client"

import { useTransition } from "react"
import { toggleFavorite } from "@/app/actions/favorites.actions"
import { FavoriteType } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  type: FavoriteType
  itemId: string
  isFavorited: boolean
}

export function FavoriteButton({ type, itemId, isFavorited: initialFavorited }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(() => toggleFavorite(type, itemId))
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={initialFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          initialFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
    </Button>
  )
}
