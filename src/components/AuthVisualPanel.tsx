'use client'

import { useState, useEffect } from 'react'

// Pre-defined values — no Math.random() in render (avoids hydration mismatch)
const BAR_HEIGHTS  = [45, 80, 35, 65, 90, 50, 70, 30, 85, 60, 40, 75, 55, 88, 42, 68, 78, 38, 62, 82]
const BAR_DURATIONS= [1.2,0.9,1.4,1.1,0.8,1.3,1.0,1.5,0.85,1.25,1.1,0.95,1.35,0.88,1.2,1.05,0.92,1.4,1.15,0.88]

const CARDS = [
  { title: 'Blinding Lights', artist: 'The Weeknd',   gradient: 'linear-gradient(135deg,#FF416C,#FF4B2B)', top: '2%',  left: '4%',  rotate: -8, delay: 0,   parallax:  0.04 },
  { title: 'Levitating',      artist: 'Dua Lipa',     gradient: 'linear-gradient(135deg,#4776E6,#8E54E9)', top: '8%',  left: '46%', rotate:  6, delay: 0.7, parallax: -0.05 },
  { title: 'As It Was',       artist: 'Harry Styles', gradient: 'linear-gradient(135deg,#11998e,#38ef7d)', top: '52%', left: '20%', rotate: -4, delay: 1.4, parallax:  0.06 },
  { title: 'Flowers',         artist: 'Miley Cyrus',  gradient: 'linear-gradient(135deg,#f953c6,#b91d73)', top: '44%', left: '56%', rotate:  8, delay: 2.1, parallax: -0.03 },
]

function MusicNoteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
      <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

interface CardProps {
  title: string; artist: string; gradient: string
  top: string; left: string; rotate: number; delay: number; parallax: number
  mouseX: number; mouseY: number; floatDuration: number
}

function SongCard({ title, artist, gradient, top, left, rotate, delay, parallax, mouseX, mouseY, floatDuration }: CardProps) {
  return (
    // Outer: vertical float via CSS keyframes
    <div className="absolute" style={{
      top, left,
      animation: `authFloat ${floatDuration}s ease-in-out infinite alternate`,
      animationDelay: `${delay}s`,
    }}>
      {/* Inner: static rotate + mouse parallax */}
      <div style={{
        transform: `rotate(${rotate}deg) translate(${mouseX * parallax}px, ${mouseY * parallax}px)`,
        transition: 'transform 0.25s ease-out',
        width: 152,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Album art placeholder */}
        <div style={{ background: gradient, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MusicNoteIcon />
        </div>
        {/* Track info */}
        <div style={{ background: 'rgba(12,12,24,0.95)', padding: '10px 12px' }}>
          <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
        </div>
      </div>
    </div>
  )
}

export default function AuthVisualPanel() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth  - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Float durations per card (pre-defined, no Math.random in render)
  const floatDurations = [3.8, 4.5, 4.1, 3.6]

  return (
    <div
      className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #06060F 0%, #0D0D1E 60%, #0A0A16 100%)' }}
    >
      <style>{`
        @keyframes authFloat {
          from { transform: translateY(0px);   }
          to   { transform: translateY(-14px); }
        }
        @keyframes authEqualize {
          from { transform: scaleY(0.15); opacity: 0.35; }
          to   { transform: scaleY(1);    opacity: 0.65; }
        }
        @keyframes authOrbPulse {
          0%,100% { opacity: 0.18; transform: scale(1); }
          50%      { opacity: 0.30; transform: scale(1.08); }
        }
        @keyframes authSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Glowing orbs ────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', top: '5%', left: '0%',
          width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
          animation: 'authOrbPulse 7s ease-in-out infinite',
          transform: `translate(${mouse.x * 0.18}px, ${mouse.y * 0.18}px)`,
          transition: 'transform 0.3s ease-out',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '-5%',
          width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,127,255,0.28) 0%, transparent 70%)',
          animation: 'authOrbPulse 9s ease-in-out infinite', animationDelay: '3s',
          transform: `translate(${mouse.x * -0.12}px, ${mouse.y * -0.12}px)`,
          transition: 'transform 0.3s ease-out',
        }} />
        <div style={{
          position: 'absolute', top: '48%', right: '20%',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.22) 0%, transparent 70%)',
          animation: 'authOrbPulse 6s ease-in-out infinite', animationDelay: '1.5s',
          transform: `translate(${mouse.x * 0.08}px, ${mouse.y * 0.08}px)`,
          transition: 'transform 0.3s ease-out',
        }} />
      </div>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full p-10">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #4A7FFF, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(74,127,255,0.4)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.5 7 4 11 4 14a8 8 0 0 0 16 0c0-3-2.5-7-8-12z" />
            </svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>ember</span>
        </div>

        {/* Floating song cards */}
        <div className="relative flex-1 mt-6" style={{ minHeight: 0 }}>
          {CARDS.map((card, i) => (
            <SongCard
              key={card.title}
              {...card}
              mouseX={mouse.x}
              mouseY={mouse.y}
              floatDuration={floatDurations[i]}
            />
          ))}

          {/* Faint vinyl disc */}
          <div style={{
            position: 'absolute', bottom: '8%', right: '8%',
            width: 110, height: 110, borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #1a1a2e, #2a2a4e, #1a1a2e, #2a2a4e)',
            opacity: 0.5,
            animation: 'authSpin 8s linear infinite',
          }}>
            <div style={{
              position: 'absolute', inset: '30%', borderRadius: '50%',
              background: 'radial-gradient(circle, #4A7FFF44, #7C3AED22)',
            }} />
          </div>
        </div>

        {/* Headline + equalizer */}
        <div className="mt-auto">
          <h2 style={{
            fontSize: 42, fontWeight: 900, color: '#fff',
            lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0,
          }}>
            Every song<br />has a{' '}
            <span style={{
              background: 'linear-gradient(90deg, #4A7FFF 0%, #A855F7 50%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              feeling
            </span>.
          </h2>
          <p style={{ color: '#4A4565', fontSize: 13, marginTop: 10, marginBottom: 20 }}>
            Discover, listen, and feel every track.
          </p>

          {/* Animated equalizer bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  borderRadius: 99,
                  transformOrigin: 'bottom',
                  background: 'linear-gradient(to top, #4A7FFF, #A855F7)',
                  animation: `authEqualize ${BAR_DURATIONS[i]}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.06}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
