'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ThemeId =
  | 'dark'       // Spotify-like solid dark
  | 'amoled'     // Pure black
  | 'midnight'   // Deep navy
  | 'forest'     // Dark emerald
  | 'aurora'     // Animated northern lights
  | 'cosmos'     // Animated starfield
  | 'ember-glow' // Animated warm fire
  | 'ocean'      // Animated deep ocean

export interface ThemeDef {
  id: ThemeId
  name: string
  type: 'static' | 'animated'
  previewGradient: string   // used in the picker thumbnail
  description: string
}

export const THEMES: ThemeDef[] = [
  // ── Static ──────────────────────────────────────────────────
  {
    id: 'dark',
    name: 'Dark',
    type: 'static',
    previewGradient: 'linear-gradient(135deg,#141414,#0A0A0A)',
    description: 'Classic dark — like Spotify',
  },
  {
    id: 'amoled',
    name: 'AMOLED',
    type: 'static',
    previewGradient: 'linear-gradient(135deg,#0a0a0a,#000000)',
    description: 'Pure black — saves battery on OLED',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    type: 'static',
    previewGradient: 'linear-gradient(135deg,#060818,#0e0a1e)',
    description: 'Deep space navy',
  },
  {
    id: 'forest',
    name: 'Forest',
    type: 'static',
    previewGradient: 'linear-gradient(135deg,#040d08,#081a0e)',
    description: 'Dark woodland green',
  },
  // ── Animated / Live ─────────────────────────────────────────
  {
    id: 'aurora',
    name: 'Aurora',
    type: 'animated',
    previewGradient: 'linear-gradient(135deg,#001a0f,#00261f,#0d003d)',
    description: 'Northern lights — animated glow',
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    type: 'animated',
    previewGradient: 'linear-gradient(135deg,#03050f,#07082a,#12042a)',
    description: 'Deep space starfield',
  },
  {
    id: 'ember-glow',
    name: 'Ember Glow',
    type: 'animated',
    previewGradient: 'linear-gradient(135deg,#120400,#1f0800,#200a00)',
    description: 'Warm fire pulse — matches Ember\'s brand',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    type: 'animated',
    previewGradient: 'linear-gradient(135deg,#000d1a,#001428,#001a33)',
    description: 'Deep ocean drift',
  },
]

interface ThemeState {
  themeId: ThemeId
  setTheme: (id: ThemeId) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: 'dark',
      setTheme: (id) => set({ themeId: id }),
    }),
    {
      name: 'ember-theme',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') return {
          getItem: () => null, setItem: () => {}, removeItem: () => {},
        }
        return localStorage
      }),
    }
  )
)
