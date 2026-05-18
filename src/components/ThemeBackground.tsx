'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/store/themeStore'

// Static background styles
const STATIC_STYLES: Record<string, string> = {
  dark:     '#0A0A0A',
  amoled:   '#000000',
  midnight: 'linear-gradient(160deg,#060818 0%,#0e0a1e 100%)',
  forest:   'linear-gradient(160deg,#040d08 0%,#081a0e 100%)',
}

export default function ThemeBackground() {
  const { themeId } = useThemeStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // During SSR and first render, show a neutral dark background
  if (!mounted) return <div className="fixed inset-0 -z-10 bg-[#0A0A0A]" />

  if (STATIC_STYLES[themeId]) {
    const bg = STATIC_STYLES[themeId]
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{ background: bg }}
      />
    )
  }

  // ── Animated themes ──────────────────────────────────────────
  if (themeId === 'aurora') return <AuroraBackground />
  if (themeId === 'cosmos')  return <CosmosBackground />
  if (themeId === 'ember-glow') return <EmberGlowBackground />
  if (themeId === 'ocean')   return <OceanBackground />

  // fallback
  return <div className="fixed inset-0 -z-10 bg-[#0A0A0A]" />
}

// ── Aurora ───────────────────────────────────────────────────
function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: '#020c08' }}>
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      {/* subtle grain overlay */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
    </div>
  )
}

// ── Cosmos ───────────────────────────────────────────────────
function CosmosBackground() {
  // Generate deterministic star positions using a simple seeded pattern
  const stars = Array.from({ length: 120 }, (_, i) => ({
    x: ((i * 137.5) % 100).toFixed(2),
    y: ((i * 97.3 + 11) % 100).toFixed(2),
    size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.2,
    delay: ((i * 0.23) % 4).toFixed(2),
    duration: (3 + (i % 4)).toFixed(1),
  }))

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #12042a 0%, #07082a 40%, #03050f 100%)' }}>
      {/* Nebula blobs */}
      <div className="cosmos-nebula cosmos-nebula-1" />
      <div className="cosmos-nebula cosmos-nebula-2" />
      {/* Stars */}
      <svg className="absolute inset-0 w-full h-full">
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.size}
            fill="white"
            style={{
              animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              opacity: 0.7,
            }}
          />
        ))}
      </svg>
    </div>
  )
}

// ── Ember Glow ───────────────────────────────────────────────
function EmberGlowBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: '#0a0200' }}>
      <div className="ember-blob ember-blob-1" />
      <div className="ember-blob ember-blob-2" />
      <div className="ember-blob ember-blob-3" />
    </div>
  )
}

// ── Ocean ────────────────────────────────────────────────────
function OceanBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: '#000d1a' }}>
      <div className="ocean-blob ocean-blob-1" />
      <div className="ocean-blob ocean-blob-2" />
      <div className="ocean-blob ocean-blob-3" />
    </div>
  )
}
