"use client"

import { useState } from "react"
import { Play, CheckCircle2 } from "lucide-react"
import type { VideoWithWatched } from "@/app/actions/video.actions"

interface VideoCardProps {
  video: VideoWithWatched
  onOpen: (video: VideoWithWatched) => void
}

export function VideoCard({ video, onOpen }: VideoCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      onClick={() => onOpen(video)}
      className="w-full text-left group rounded-xl overflow-hidden border bg-card hover:border-primary/30 transition-all active:scale-[0.99] touch-manipulation"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {!imgError ? (
          <img
            src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-200"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-12 w-12 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Badges */}
        {video.isHighlight && (
          <span className="absolute top-2 left-2 rounded-full bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 leading-5">
            ⭐ Recomendado
          </span>
        )}
        {video.watched && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 leading-5">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Assistido
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-0.5">
        <p className="text-sm font-medium line-clamp-2 leading-snug">{video.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
          <span className="line-clamp-1 flex-1">{video.channel}</span>
          {video.duration != null && (
            <span className="shrink-0 tabular-nums">{video.duration} min</span>
          )}
        </div>
      </div>
    </button>
  )
}
