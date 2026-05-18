'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import TrackCard from '@/components/TrackCard'
import { usePlayerStore } from '@/store/playerStore'
import type { Track, Artist } from '@/types/index'

interface ArtistData {
  artist: Artist
  topTracks: Track[]
  relatedArtists: Artist[]
}

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ArtistData | null>(null)
  const [loading, setLoading] = useState(true)
  const { playTrack } = usePlayerStore()

  useEffect(() => {
    fetch(`/api/artists/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[#4A4540]">Artist not found</p>
        <Link href="/search" className="text-[#FF6B35] text-sm hover:underline">← Back to search</Link>
      </div>
    )
  }

  const { artist, topTracks, relatedArtists } = data
  const genres = artist.genres ?? []
  const popularity = artist.popularity ?? 0

  return (
    <div className="min-h-full pb-32">
      {/* Hero */}
      <div className="relative h-[280px] overflow-hidden">
        {artist.image && (
          <>
            <Image src={artist.image} alt={artist.name} fill className="object-cover object-top scale-105" sizes="100vw" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-7">
          <p className="text-[11px] font-bold text-[#F97316] uppercase tracking-[0.16em] mb-1">Artist</p>
          <h1 className="text-[44px] font-black text-white leading-none tracking-tight">{artist.name}</h1>
          {genres.length > 0 && (
            <p className="text-[12px] text-white/40 mt-2 capitalize">{genres.slice(0, 3).join(' · ')}</p>
          )}
        </div>
      </div>

      {/* Play + stats */}
      <div className="px-8 py-5 flex items-center gap-4">
        {topTracks.length > 0 && (
          <button
            onClick={() => playTrack(topTracks[0], topTracks)}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #F97316, #A855F7)', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 2 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        )}
        {popularity > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-20 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${popularity}%`, background: 'linear-gradient(to right, #F97316, #A855F7)' }} />
            </div>
            <span className="text-[11px] text-white/30">{popularity}% popularity</span>
          </div>
        )}
      </div>

      <div className="px-5 flex flex-col gap-10">
        {/* Top tracks */}
        {topTracks.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold text-[#F5F0EB] mb-4 px-3">Popular</h2>
            <div className="flex flex-col gap-0.5">
              {topTracks.map((track, i) => (
                <TrackCard key={track.id} track={track} queue={topTracks} index={i} showIndex />
              ))}
            </div>
          </section>
        )}

        {/* Related artists */}
        {relatedArtists.length > 0 && (
          <section className="px-3">
            <h2 className="text-[17px] font-bold text-[#F5F0EB] mb-4">Fans also like</h2>
            <div className="grid grid-cols-3 gap-4">
              {relatedArtists.map(a => (
                <Link key={a.id} href={`/artist/${a.id}`} className="flex flex-col items-center gap-2 group">
                  <div className="relative w-full aspect-square rounded-full overflow-hidden bg-white/[0.06]"
                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                    {a.image && <Image src={a.image} alt={a.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="120px" />}
                  </div>
                  <p className="text-[12px] font-semibold text-[#C0BBB5] group-hover:text-white transition-colors text-center truncate w-full">
                    {a.name}
                  </p>
                  <p className="text-[10px] text-white/25 -mt-1">Artist</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
