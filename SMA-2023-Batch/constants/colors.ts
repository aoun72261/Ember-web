export const Colors = {
  bg: '#0d0d14',
  bgCard: '#16162a',
  bgElevated: '#1e1e36',
  border: '#2a2a4a',
  borderLight: '#3a3a6a',

  // Primary neons
  pink: '#ff2d78',
  pinkLight: '#ff6aa0',
  cyan: '#00d4ff',
  cyanLight: '#66e8ff',
  purple: '#b44dff',
  purpleLight: '#d080ff',
  lime: '#39ff14',
  orange: '#ff6b00',
  orangeLight: '#ff9a44',
  gold: '#ffd700',
  goldLight: '#ffe566',

  white: '#ffffff',
  textPrimary: '#f0f0ff',
  textSecondary: '#9090b0',
  textMuted: '#5050708',

  // Card type gradients [bg1, bg2, border, badge]
  typeColors: {
    Funny:   { bg: ['#2a1a00', '#3d2800'] as [string, string], border: '#ff9a00', text: '#ff9a00' },
    Chill:   { bg: ['#001a2a', '#002a3d'] as [string, string], border: '#00d4ff', text: '#00d4ff' },
    Hype:    { bg: ['#2a0010', '#3d0018'] as [string, string], border: '#ff2d78', text: '#ff2d78' },
    Smart:   { bg: ['#001a1a', '#002a2a'] as [string, string], border: '#39ff14', text: '#39ff14' },
    Foodie:  { bg: ['#2a1500', '#3d2000'] as [string, string], border: '#ff6b00', text: '#ff6b00' },
    Artist:  { bg: ['#1a0028', '#280040'] as [string, string], border: '#b44dff', text: '#b44dff' },
    Athlete: { bg: ['#001a28', '#002840'] as [string, string], border: '#00d4ff', text: '#00d4ff' },
    Leader:  { bg: ['#00001a', '#000028'] as [string, string], border: '#ffd700', text: '#ffd700' },
    Chaos:   { bg: ['#280000', '#3d0000'] as [string, string], border: '#ff2d78', text: '#ff2d78' },
    Vibes:   { bg: ['#20002a', '#30003d'] as [string, string], border: '#b44dff', text: '#b44dff' },
  } as Record<string, { bg: [string, string]; border: string; text: string }>,
} as const;
