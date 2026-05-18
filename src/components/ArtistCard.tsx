'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Artist } from '@/types/index'

interface ArtistCardProps {
  artist: Artist
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] transition-all duration-150 cursor-pointer"
    >
      {/* Artist image — circular */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#2E2E2E] flex-shrink-0 ring-2 ring-transparent group-hover:ring-[#4A7FFF]/30 transition-all">
        {artist.image ? (
          <Image src={artist.image} alt={artist.name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#5A5550">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}
      </div>
      <div className="text-center min-w-0 w-full">
        <p className="text-sm font-medium text-[#F5F0EB] truncate group-hover:text-[#4A7FFF] transition-colors">
          {artist.name}
        </p>
        {artist.genres[0] && (
          <p className="text-xs text-[#5A5550] mt-0.5 truncate capitalize">{artist.genres[0]}</p>
        )}
      </div>
    </Link>
  )
}
