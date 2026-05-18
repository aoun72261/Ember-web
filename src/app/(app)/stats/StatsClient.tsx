'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, useCallback } from 'react'
import { usePlayerStore } from '@/store/playerStore'

interface TopTrack  { title: string; artist: string; art: string; plays: number; spotifyId: string }
interface TopArtist { name: string; art: string; plays: number }
interface MonthData { label: string; plays: number }

interface Props {
  totalPlays: number
  uniqueTracks: number
  uniqueArtists: number
  streak: number
  listenTimeLabel: string
  topTracks: TopTrack[]
  topArtists: TopArtist[]
  byHour: number[]
  byDay: number[]
  months: MonthData[]
  topHour: number
  personality: { label: string; desc: string }
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[17px] font-bold text-[#F5F0EB] mb-5 tracking-tight">{children}</h2>
}

function StatBig({ value, label, sub }: { value: number | string; label: string; sub?: string }) {
  const display = typeof value === 'number' ? value.toLocaleString() : value
  return (
    <div className="flex flex-col gap-1 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-5 py-5 flex-1 min-w-0 overflow-hidden">
      <span className="text-[26px] font-black text-white leading-none truncate">{display}</span>
      <span className="text-[11.5px] text-[#4A4540] font-medium mt-1 truncate">{label}</span>
      {sub && <span className="text-[10.5px] text-[#4A7FFF] font-semibold truncate">{sub}</span>}
    </div>
  )
}

function BarChart({ values, labels, accent = '#4A7FFF', showValues = false }:
  { values: number[]; labels: string[]; accent?: string; showValues?: boolean }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-1 h-[80px]">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${Math.max((v / max) * 100, v > 0 ? 4 : 0)}%`,
                background: v === max ? accent : 'rgba(255,255,255,0.1)',
                minHeight: v > 0 ? 3 : 0,
              }}
            />
          </div>
          {labels[i] !== undefined && (
            <span className="text-[9px] text-[#3A3530] group-hover:text-[#6A6560] transition-colors leading-none">
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function generateRecapCanvas(opts: {
  totalPlays: number
  uniqueTracks: number
  streak: number
  personality: { label: string; desc: string }
  topTrack: { title: string; artist: string; art: string } | undefined
  topArtist: { name: string; art: string } | undefined
  topHour: number
}): Promise<string> {
  const W = 400, H = 700
  const canvas = document.createElement('canvas')
  canvas.width = W * 2; canvas.height = H * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)

  // Background
  ctx.fillStyle = '#0A0A0A'
  ctx.fillRect(0, 0, W, H)

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

  // Orange glow top-left
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 300)
  glow.addColorStop(0, 'rgba(74,127,255,0.18)')
  glow.addColorStop(1, 'rgba(74,127,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Top album art (blurred via drawn large rect)
  if (opts.topTrack?.art) {
    try {
      const img = await loadImage(opts.topTrack.art)
      ctx.save()
      ctx.globalAlpha = 0.12
      ctx.drawImage(img, -60, -60, W + 120, 320)
      ctx.restore()
    } catch { /* skip */ }
  }

  // Gradient overlay top→bg
  const topFade = ctx.createLinearGradient(0, 0, 0, 180)
  topFade.addColorStop(0, 'rgba(10,10,10,0)')
  topFade.addColorStop(1, '#0A0A0A')
  ctx.fillStyle = topFade
  ctx.fillRect(0, 0, W, 180)

  // EMBER wordmark
  ctx.font = 'bold 13px -apple-system, Arial'
  ctx.fillStyle = '#4A7FFF'
  ctx.letterSpacing = '0.2em'
  ctx.fillText('EMBER', 24, 36)
  ctx.letterSpacing = '0'

  // Top track art square
  if (opts.topTrack?.art) {
    try {
      const img = await loadImage(opts.topTrack.art)
      const artSize = 120
      const artX = W - artSize - 24, artY = 16
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(artX, artY, artSize, artSize, 14)
      ctx.clip()
      ctx.drawImage(img, artX, artY, artSize, artSize)
      ctx.restore()
    } catch { /* skip */ }
  }

  // Personality badge
  const badgeY = 88
  const grad = ctx.createLinearGradient(24, badgeY, 200, badgeY + 60)
  grad.addColorStop(0, 'rgba(74,127,255,0.2)')
  grad.addColorStop(1, 'rgba(29,78,216,0.08)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(24, badgeY, 230, 60, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(74,127,255,0.3)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.font = 'bold 10px -apple-system, Arial'
  ctx.fillStyle = '#4A7FFF'
  ctx.fillText('MUSIC PERSONALITY', 36, badgeY + 18)
  ctx.font = 'bold 19px -apple-system, Arial'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(opts.personality.label, 36, badgeY + 42)

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(24, 172); ctx.lineTo(W - 24, 172); ctx.stroke()

  // Stats grid
  const statY = 200
  const stats = [
    { value: opts.totalPlays.toLocaleString(), label: 'Total plays' },
    { value: opts.uniqueTracks.toLocaleString(), label: 'Tracks played' },
    { value: `${opts.streak}d`, label: 'Day streak' },
    { value: hourLabel(opts.topHour), label: 'Peak hour' },
  ]
  stats.forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const sx = 24 + col * 188, sy = statY + row * 90
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.beginPath(); ctx.roundRect(sx, sy, 172, 74, 12); ctx.fill()
    ctx.font = 'bold 26px -apple-system, Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(s.value, sx + 14, sy + 38)
    ctx.font = '11px -apple-system, Arial'
    ctx.fillStyle = '#6A6560'
    ctx.fillText(s.label, sx + 14, sy + 56)
  })

  // Top track row
  const trackY = 400
  ctx.font = 'bold 10px -apple-system, Arial'
  ctx.fillStyle = '#4A7FFF'
  ctx.fillText('TOP TRACK', 24, trackY)
  if (opts.topTrack) {
    const tImg = opts.topTrack.art ? await loadImage(opts.topTrack.art).catch(() => null) : null
    if (tImg) {
      ctx.save()
      ctx.beginPath(); ctx.roundRect(24, trackY + 8, 44, 44, 8); ctx.clip()
      ctx.drawImage(tImg, 24, trackY + 8, 44, 44)
      ctx.restore()
    }
    ctx.font = 'bold 14px -apple-system, Arial'
    ctx.fillStyle = '#F5F0EB'
    ctx.fillText(opts.topTrack.title.slice(0, 30), 78, trackY + 26)
    ctx.font = '11px -apple-system, Arial'
    ctx.fillStyle = '#6A6560'
    ctx.fillText(opts.topTrack.artist, 78, trackY + 44)
  }

  // Top artist row
  const artistY = 474
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.beginPath(); ctx.moveTo(24, artistY - 10); ctx.lineTo(W - 24, artistY - 10); ctx.stroke()
  ctx.font = 'bold 10px -apple-system, Arial'
  ctx.fillStyle = '#4A7FFF'
  ctx.fillText('TOP ARTIST', 24, artistY)
  if (opts.topArtist) {
    const aImg = opts.topArtist.art ? await loadImage(opts.topArtist.art).catch(() => null) : null
    if (aImg) {
      ctx.save()
      ctx.beginPath(); ctx.arc(24 + 22, artistY + 8 + 22, 22, 0, Math.PI * 2); ctx.clip()
      ctx.drawImage(aImg, 24, artistY + 8, 44, 44)
      ctx.restore()
    }
    ctx.font = 'bold 14px -apple-system, Arial'
    ctx.fillStyle = '#F5F0EB'
    ctx.fillText(opts.topArtist.name.slice(0, 30), 78, artistY + 30)
  }

  // Bottom bar
  ctx.fillStyle = 'rgba(74,127,255,0.12)'
  ctx.fillRect(0, H - 48, W, 48)
  ctx.font = '11px -apple-system, Arial'
  ctx.fillStyle = '#6A6560'
  ctx.fillText('ember.app · your music, your story', 24, H - 18)

  return canvas.toDataURL('image/png')
}

function hourLabel(h: number) {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

function RecapModal({ onClose, dataUrl, generating }: { onClose: () => void; dataUrl: string | null; generating: boolean }) {
  const share = async () => {
    if (!dataUrl) return
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], 'ember-recap.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My Ember Recap' })
    }
  }
  const download = () => {
    if (!dataUrl) return
    const a = document.createElement('a'); a.href = dataUrl; a.download = 'ember-recap.png'; a.click()
  }
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex flex-col items-center gap-4 p-6 bg-[#111] rounded-3xl border border-white/[0.08] shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[#8A8580] hover:text-white transition-all">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <p className="text-[13px] font-bold text-[#F5F0EB] pr-8">Your recap card</p>
        {generating ? (
          <div className="w-[200px] h-[350px] rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#4A7FFF]/30 border-t-[#4A7FFF] rounded-full animate-spin" />
          </div>
        ) : dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="Recap card" className="w-[200px] rounded-2xl shadow-2xl" />
        ) : null}
        <div className="flex gap-2 w-full">
          <button
            onClick={download}
            disabled={!dataUrl}
            className="flex-1 py-2.5 rounded-xl bg-[#4A7FFF] hover:bg-[#6690FF] disabled:opacity-40 text-[13px] font-bold text-black transition-all"
          >
            Download
          </button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={share}
              disabled={!dataUrl}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 text-[13px] font-bold text-white transition-all"
            >
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StatsClient({
  totalPlays, uniqueTracks, uniqueArtists, streak, listenTimeLabel,
  topTracks, topArtists, byHour, byDay, months, topHour, personality,
}: Props) {
  const { playTrack } = usePlayerStore()
  const [recapOpen, setRecapOpen] = useState(false)
  const [recapUrl, setRecapUrl] = useState<string | null>(null)
  const [recapGenerating, setRecapGenerating] = useState(false)

  const openRecap = useCallback(async () => {
    setRecapOpen(true)
    if (recapUrl) return
    setRecapGenerating(true)
    try {
      const url = await generateRecapCanvas({
        totalPlays, uniqueTracks, streak, personality,
        topTrack: topTracks[0],
        topArtist: topArtists[0],
        topHour,
      })
      setRecapUrl(url)
    } finally {
      setRecapGenerating(false)
    }
  }, [recapUrl, totalPlays, uniqueTracks, streak, personality, topTracks, topArtists, topHour])

  const isEmpty = totalPlays === 0

  // Hour labels — show every 3 hours
  const hourLabels = byHour.map((_, i) => i % 3 === 0 ? hourLabel(i) : '')

  const maxMonth = Math.max(...months.map(m => m.plays), 1)

  return (
    <>
    {recapOpen && (
      <RecapModal onClose={() => setRecapOpen(false)} dataUrl={recapUrl} generating={recapGenerating} />
    )}
    <div className="min-h-full pb-32">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="relative px-8 pt-10 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4A7FFF]/[0.08] via-transparent to-[#1D4ED8]/[0.04] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[11px] font-bold text-[#4A7FFF] uppercase tracking-[0.16em]">Your stats</p>
              <h1 className="text-[36px] font-black text-white leading-tight tracking-tight mt-1">Listening recap</h1>
              <p className="text-[13px] text-[#4A4540] mt-1">All time · updated now</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Link href="/profile" className="text-[12px] text-[#4A4540] hover:text-[#4A7FFF] transition-colors font-semibold">
                ← Profile
              </Link>
              {!isEmpty && (
                <button
                  onClick={openRecap}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#4A7FFF]/10 hover:bg-[#4A7FFF]/20 border border-[#4A7FFF]/30 text-[12px] font-bold text-[#4A7FFF] transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Share recap
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-8">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.04] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="1.2">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <p className="text-[15px] font-bold text-[#F0EBE5]">No listening history yet</p>
          <p className="text-[13px] text-[#4A4540]">Play some music to see your stats here.</p>
          <Link href="/home" className="text-[13px] font-bold text-[#4A7FFF] hover:text-[#93C5FD] transition-colors">
            Start listening →
          </Link>
        </div>
      ) : (
        <div className="px-8 flex flex-col gap-10">

          {/* ── Big numbers ─────────────────────────────── */}
          <section>
            <div className="flex gap-3 flex-wrap">
              <StatBig value={totalPlays} label="Total plays" />
              <StatBig value={listenTimeLabel} label="Time listened" />
              <StatBig value={uniqueTracks} label="Unique tracks" />
              <StatBig value={uniqueArtists} label="Artists" />
              <StatBig value={streak} label="Day streak" sub={streak > 0 ? '🔥 Keep it up' : undefined} />
            </div>
          </section>

          {/* ── Music personality ────────────────────────── */}
          <section>
            <div className="relative overflow-hidden rounded-2xl px-6 py-5 flex items-center gap-5"
              style={{ background: 'linear-gradient(135deg, rgba(74,127,255,0.15), rgba(29,78,216,0.08))' }}>
              <div className="absolute inset-0 border border-[#4A7FFF]/20 rounded-2xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4A7FFF] to-[#1D4ED8] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#4A7FFF]/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.5 7 4 11 4 14a8 8 0 0 0 16 0c0-3-2.5-7-8-12z"/>
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#4A7FFF] uppercase tracking-widest">Your music personality</p>
                <p className="text-[22px] font-black text-white mt-0.5">{personality.label}</p>
                <p className="text-[13px] text-[#8A8580] mt-0.5">{personality.desc}</p>
              </div>
              <div className="ml-auto text-right flex-shrink-0">
                <p className="text-[11px] text-[#4A4540]">Most active at</p>
                <p className="text-[18px] font-black text-white">{hourLabel(topHour)}</p>
              </div>
            </div>
          </section>

          {/* ── Top tracks ──────────────────────────────── */}
          {topTracks.length > 0 && (
            <section>
              <SectionTitle>Top tracks</SectionTitle>
              <div className="flex flex-col gap-0.5">
                {topTracks.map((t, i) => {
                  const track = { id: t.spotifyId, title: t.title, artist: t.artist, album: '', albumArt: t.art, duration: 0, spotifyId: t.spotifyId, youtubeVideoId: null, previewUrl: null }
                  return (
                    <button
                      key={i}
                      onClick={() => playTrack(track, topTracks.map(x => ({ id: x.spotifyId, title: x.title, artist: x.artist, album: '', albumArt: x.art, duration: 0, spotifyId: x.spotifyId, youtubeVideoId: null, previewUrl: null })))}
                      className="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group text-left"
                    >
                      <span className="text-[13px] font-bold w-5 text-center flex-shrink-0"
                        style={{ color: i === 0 ? '#4A7FFF' : '#3A3530' }}>
                        {i + 1}
                      </span>
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.06]">
                        {t.art && <Image src={t.art} alt={t.title} fill className="object-cover" sizes="40px"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#E0DBD5] group-hover:text-white truncate transition-colors">{t.title}</p>
                        <p className="text-[11px] text-[#4A4540] truncate">{t.artist}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-[12px] font-semibold text-[#4A4540]">{t.plays}</span>
                        <span className="text-[10px] text-[#3A3530] ml-1">{t.plays === 1 ? 'play' : 'plays'}</span>
                      </div>
                      {/* play bar */}
                      <div className="w-20 flex-shrink-0">
                        <div className="h-1 rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-[#4A7FFF]/60 transition-all"
                            style={{ width: `${(t.plays / topTracks[0].plays) * 100}%` }} />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Top artists ─────────────────────────────── */}
          {topArtists.length > 0 && (
            <section>
              <SectionTitle>Top artists</SectionTitle>
              <div className="flex gap-4">
                {topArtists.map((a, i) => (
                  <div key={a.name} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white/[0.06]"
                      style={{ boxShadow: i === 0 ? '0 8px 32px rgba(74,127,255,0.25)' : 'none' }}>
                      {a.art && <Image src={a.art} alt={a.name} fill className="object-cover" sizes="120px"/>}
                      {i === 0 && (
                        <div className="absolute top-2 left-2 bg-[#4A7FFF] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          #1
                        </div>
                      )}
                    </div>
                    <p className="text-[11.5px] font-semibold text-[#C0BBB5] truncate w-full text-center">{a.name}</p>
                    <p className="text-[10px] text-[#4A4540] -mt-1">{a.plays} plays</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Listening by hour ───────────────────────── */}
          <section>
            <SectionTitle>When you listen</SectionTitle>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <BarChart values={byHour} labels={hourLabels} />
              <p className="text-[11px] text-[#4A4540] mt-3 text-center">
                Most active at <span className="text-[#4A7FFF] font-semibold">{hourLabel(topHour)}</span>
              </p>
            </div>
          </section>

          {/* ── Listening by day ────────────────────────── */}
          <section>
            <SectionTitle>Favourite day</SectionTitle>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <BarChart values={byDay} labels={DAY_LABELS} />
              <p className="text-[11px] text-[#4A4540] mt-3 text-center">
                Most plays on <span className="text-[#4A7FFF] font-semibold">{DAY_LABELS[byDay.indexOf(Math.max(...byDay))]}</span>
              </p>
            </div>
          </section>

          {/* ── Month-by-month ──────────────────────────── */}
          <section>
            <SectionTitle>Monthly plays</SectionTitle>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-end gap-3 h-[100px]">
                {months.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] text-[#4A4540] group-hover:text-[#8A8580] transition-colors">
                      {m.plays > 0 ? m.plays : ''}
                    </span>
                    <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
                      <div
                        className="w-full rounded-lg transition-all duration-700"
                        style={{
                          height: `${Math.max((m.plays / maxMonth) * 100, m.plays > 0 ? 8 : 0)}%`,
                          background: m.plays === maxMonth
                            ? 'linear-gradient(to top, #4A7FFF, #93C5FD)'
                            : 'rgba(255,255,255,0.08)',
                          minHeight: m.plays > 0 ? 4 : 0,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-[#4A4540] font-medium">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
    </>
  )
}
