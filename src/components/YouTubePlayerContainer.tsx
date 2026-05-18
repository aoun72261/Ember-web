'use client'

import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'

export default function YouTubePlayerContainer() {
  useYouTubePlayer('yt-player')
  return <div id="yt-player" className="hidden" aria-hidden="true" />
}
