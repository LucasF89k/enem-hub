"use client"

import { useState } from "react"
import { VideoCard } from "./VideoCard"
import { VideoModal } from "./VideoModal"
import type { VideoWithWatched } from "@/app/actions/video.actions"

const YoutubeEmptyIcon = () => (
  <svg viewBox="0 0 24 24" className="h-10 w-10 fill-muted-foreground/30" aria-hidden>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.5V8.5l6.3 3.5-6.3 3.5z" />
  </svg>
)

interface VideoListProps {
  initialVideos: VideoWithWatched[]
}

export function VideoList({ initialVideos }: VideoListProps) {
  const [videos, setVideos] = useState<VideoWithWatched[]>(initialVideos)
  const [selectedVideo, setSelectedVideo] = useState<VideoWithWatched | null>(null)

  function handleWatched(videoId: string) {
    const now = new Date()
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, watched: true, watchedAt: now } : v))
    )
    setSelectedVideo((prev) =>
      prev?.id === videoId ? { ...prev, watched: true, watchedAt: now } : prev
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <YoutubeEmptyIcon />
        <p className="text-sm font-medium">Vídeos em breve</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Estamos selecionando os melhores vídeos para este tópico. Use{" "}
          <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
            npm run search-videos
          </code>{" "}
          para popular o banco.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onOpen={setSelectedVideo} />
        ))}
      </div>

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onWatched={handleWatched}
        />
      )}
    </>
  )
}
