"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { markVideoWatched } from "@/app/actions/video.actions"
import type { VideoWithWatched } from "@/app/actions/video.actions"

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-red-600" aria-hidden>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.5V8.5l6.3 3.5-6.3 3.5z" />
  </svg>
)

interface VideoModalProps {
  video: VideoWithWatched
  onClose: () => void
  onWatched: (videoId: string) => void
}

export function VideoModal({ video, onClose, onWatched }: VideoModalProps) {
  const [localWatched, setLocalWatched] = useState(video.watched)
  const [isPending, startTransition] = useTransition()
  const [showXP, setShowXP] = useState(false)

  function handleMarkWatched() {
    startTransition(async () => {
      const result = await markVideoWatched(video.id)
      if (result.isNew) {
        setShowXP(true)
        setTimeout(() => setShowXP(false), 3000)
      }
      setLocalWatched(true)
      onWatched(video.id)
    })
  }

  const watchedDate = video.watchedAt
    ? new Date(video.watchedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : null

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 max-w-2xl w-full overflow-hidden max-h-[100dvh] sm:max-h-[90dvh] flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="text-sm font-semibold leading-snug line-clamp-2 pr-6">
            {video.title}
          </DialogTitle>
        </DialogHeader>

        {/* Player */}
        <div className="w-full aspect-video shrink-0 bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Info + actions */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Channel */}
          <div className="flex items-center gap-2">
            <YoutubeIcon />
            <span className="text-sm text-muted-foreground">{video.channel}</span>
            {video.duration != null && (
              <span className="text-xs text-muted-foreground">· {video.duration} min</span>
            )}
          </div>

          {/* Description */}
          {video.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{video.description}</p>
          )}

          {/* XP toast inline */}
          {showXP && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
              <span>⚡</span>
              <span className="font-medium">+15 XP — Vídeo concluído!</span>
            </div>
          )}

          {/* Watch action */}
          {!localWatched ? (
            <Button
              className="w-full gap-2"
              onClick={handleMarkWatched}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Marcar como assistido
            </Button>
          ) : (
            <div
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3"
              )}
            >
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Assistido
                {watchedDate && (
                  <span className="text-muted-foreground font-normal"> · {watchedDate}</span>
                )}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
