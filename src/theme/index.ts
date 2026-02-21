// MOTIcoach Design System
// Extracted from HTML prototypes

export const Colors = {
  // Backgrounds
  bg: '#070b12',
  bgDeep: '#030609',
  card: 'rgba(12,20,40,0.92)',
  card2: 'rgba(8,14,30,0.96)',
  cardSolid: '#0a1428',

  // Borders
  border: 'rgba(40,90,180,0.2)',
  border2: 'rgba(60,130,255,0.35)',

  // Text
  text: '#e8f0ff',
  dim: '#8aa0cc',
  muted: '#3a5080',

  // Accents
  cyan: '#00d4ff',
  blue: '#3d8fff',
  amber: '#d4a853',
  green: '#2ecc71',
  red: '#e74c3c',
  purple: '#9b59b6',

  // Event type colors
  game: '#d4a853',
  practice: '#2ecc71',
  film: '#9b59b6',
} as const;

// Font families — use these directly as fontFamily values.
// Note: with Expo Google Fonts, fontWeight in StyleSheet is ignored;
// use the specific family name for each weight.
export const Fonts = {
  orbitron: 'Orbitron_900Black',      // Primary display font (heavy)
  orbitronBold: 'Orbitron_700Bold',
  orbitronLight: 'Orbitron_400Regular',
  mono: 'JetBrainsMono_400Regular',   // Labels, data, badges
  monoBold: 'JetBrainsMono_600SemiBold',
  rajdhani: 'Rajdhani_600SemiBold',   // Body text
  rajdhaniBold: 'Rajdhani_700Bold',
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;
