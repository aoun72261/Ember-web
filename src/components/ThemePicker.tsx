'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useThemeStore, THEMES, type ThemeId } from '@/store/themeStore'

interface Props {
  onClose: () => void
}

export default function ThemePicker({ onClose }: Props) {
  const { themeId, setTheme } = useThemeStore()

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const staticThemes  = THEMES.filter(t => t.type === 'static')
  const animatedThemes = THEMES.filter(t => t.type === 'animated')

  const handlePick = (id: ThemeId) => {
    setTheme(id)
    // Don't close — let the user see the live preview before dismissing
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(12,8,28,0.92)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(249,115,22,0.18)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-[18px] font-black text-white tracking-tight">Choose Theme</h2>
            <p className="text-[12px] text-white/35 mt-0.5">Changes apply instantly</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-5">
          {/* Static themes */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-3">Simple</p>
            <div className="grid grid-cols-4 gap-2.5">
              {staticThemes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  active={themeId === theme.id}
                  onPick={handlePick}
                />
              ))}
            </div>
          </div>

          {/* Animated themes */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-3">
              Live Wallpapers
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-black"
                style={{ background: 'rgba(249,115,22,0.2)', color: '#F97316' }}>
                ANIMATED
              </span>
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {animatedThemes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  active={themeId === theme.id}
                  onPick={handlePick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ThemeCard({
  theme, active, onPick,
}: {
  theme: typeof THEMES[0]
  active: boolean
  onPick: (id: ThemeId) => void
}) {
  return (
    <button
      onClick={() => onPick(theme.id)}
      className="flex flex-col items-center gap-2 group"
    >
      {/* Preview swatch */}
      <div
        className="w-full aspect-square rounded-2xl relative overflow-hidden transition-all duration-200"
        style={{
          background: theme.previewGradient,
          boxShadow: active
            ? '0 0 0 2.5px #F97316, 0 4px 20px rgba(249,115,22,0.4)'
            : '0 2px 12px rgba(0,0,0,0.5)',
          transform: active ? 'scale(1.04)' : undefined,
        }}
      >
        {/* Animated shimmer for live themes */}
        {theme.type === 'animated' && (
          <div className="absolute inset-0 opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.08) 100%)',
            }}
          />
        )}
        {/* Check mark */}
        {active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: '#F97316', boxShadow: '0 2px 8px rgba(249,115,22,0.6)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
        )}
        {/* Live badge */}
        {theme.type === 'animated' && !active && (
          <div className="absolute bottom-1.5 right-1.5">
            <div className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
          </div>
        )}
      </div>

      {/* Name */}
      <span className={`text-[11px] font-semibold transition-colors ${active ? 'text-white' : 'text-white/45 group-hover:text-white/75'}`}>
        {theme.name}
      </span>
    </button>
  )
}
