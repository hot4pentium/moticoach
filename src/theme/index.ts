// LeagueMatrix Design System

export const Colors = {
  // Backgrounds
  bg:        '#0d1b2e',
  bgDeep:    '#081525',
  card:      '#142035',
  card2:     '#1a2a40',
  cardSolid: '#142035',

  // Borders
  border:  'rgba(255,255,255,0.08)',
  border2: 'rgba(99,160,255,0.2)',

  // Text (light for dark bg)
  text:  '#e8f0fe',
  dim:   '#7aa0c0',
  muted: '#3d5570',

  // Accents
  cyan:   '#00b4d8',
  blue:   '#3b82f6',
  amber:  '#f59e0b',
  green:  '#22c55e',
  red:    '#ef4444',
  purple: '#a855f7',

  // Event type colors
  game:     '#f59e0b',
  practice: '#22c55e',
  film:     '#a855f7',
} as const;

// Hero overlay text (always on blue gradient backgrounds)
export const HeroText = {
  primary:   '#ffffff',
  secondary: 'rgba(255,255,255,0.75)',
  muted:     'rgba(255,255,255,0.5)',
} as const;

export const Fonts = {
  orbitron:      'Orbitron_900Black',      // Large numbers/scores only
  orbitronBold:  'Orbitron_700Bold',
  orbitronLight: 'Orbitron_400Regular',
  mono:          'JetBrainsMono_400Regular',  // Labels, data, badges
  monoBold:      'JetBrainsMono_600SemiBold',
  rajdhani:      'Rajdhani_600SemiBold',      // Body text
  rajdhaniBold:  'Rajdhani_700Bold',          // Display headings
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   18,
  xl:   24,
  full: 999,
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
} as const;

export const Gradients = {
  hero:    ['#42a5f5', '#1565c0'] as const,  // bright sky blue → deep blue
  heroAlt: ['#29b6f6', '#0d47a1'] as const,  // alternate hero
  auth:    ['#42a5f5', '#1565c0'] as const,  // auth screen
} as const;
