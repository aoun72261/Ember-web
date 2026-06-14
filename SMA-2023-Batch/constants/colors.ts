export const Colors = {
  // Backgrounds
  bg: '#f2f2f7',
  bgCard: '#ffffff',
  bgGlass: 'rgba(255,255,255,0.72)',
  bgGlassStrong: 'rgba(255,255,255,0.88)',
  bgGlassDim: 'rgba(255,255,255,0.40)',

  // Borders
  borderGlass: 'rgba(255,255,255,0.65)',
  borderLight: 'rgba(0,0,0,0.07)',
  borderMid: 'rgba(0,0,0,0.12)',

  // Accents — no purple
  rose: '#ff375f',
  roseSoft: '#ff6b88',
  roseLight: '#ffe4ea',
  sky: '#007aff',
  skySoft: '#5ac8fa',
  skyLight: '#e1f4ff',
  gold: '#f7b731',
  goldLight: '#fff4cc',
  sage: '#30d158',
  sageLight: '#d4f5dc',
  peach: '#ff9500',
  peachLight: '#fff0d4',
  coral: '#ff6b6b',

  // Text
  text: '#1c1c1e',
  textSec: '#636366',
  textMuted: '#aeaeb2',
  white: '#ffffff',

  // Lock screen gradient background (shown behind glass)
  lockGrad: ['#ffd6e7', '#ffb3c6', '#ffc8a0', '#c8eaff', '#a8d8ff'] as string[],

  // Per-type soft badge colors [bg, text, border]
  typeColors: {
    Funny:   { bg: '#fff4cc', text: '#b8860b', border: '#f7b731' },
    Chill:   { bg: '#e1f4ff', text: '#0060c0', border: '#5ac8fa' },
    Hype:    { bg: '#ffe4ea', text: '#c0002a', border: '#ff375f' },
    Smart:   { bg: '#d4f5dc', text: '#1a7a3a', border: '#30d158' },
    Foodie:  { bg: '#fff0d4', text: '#a05a00', border: '#ff9500' },
    Artist:  { bg: '#f0e8ff', text: '#5a00b0', border: '#af52de' },
    Athlete: { bg: '#e1f4ff', text: '#004888', border: '#007aff' },
    Leader:  { bg: '#fff4cc', text: '#806000', border: '#f7b731' },
    Chaos:   { bg: '#ffe4ea', text: '#a00020', border: '#ff375f' },
    Vibes:   { bg: '#f5e8ff', text: '#6000a0', border: '#bf5af2' },
  } as Record<string, { bg: string; text: string; border: string }>,
} as const;
