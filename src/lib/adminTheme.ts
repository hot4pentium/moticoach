// Admin portal design tokens — light and dark

export const LIGHT_AC = {
  // Surfaces
  bg:      '#f4f6f9',
  surface: '#ffffff',
  hover:   '#f9fafb',

  // Borders
  border:  '#e5e7eb',
  border2: '#d1d5db',

  // Text
  text:    '#111827',
  sub:     '#4b5563',
  muted:   '#9ca3af',

  // Primary (blue)
  primary:      '#2563eb',
  primaryLight: '#eff6ff',
  primaryText:  '#1d4ed8',

  // Status
  green:       '#16a34a',
  greenLight:  '#dcfce7',
  greenText:   '#15803d',
  amber:       '#d97706',
  amberLight:  '#fef3c7',
  amberText:   '#b45309',
  red:         '#dc2626',
  redLight:    '#fee2e2',
  purple:      '#7c3aed',
  purpleLight: '#ede9fe',
  orange:      '#ea580c',
  orangeLight: '#ffedd5',

  // Sport accent colors
  soccer:     '#16a34a',
  baseball:   '#d97706',
  basketball: '#ea580c',

  // Sidebar
  sidebar:       '#ffffff',
  sidebarBorder: '#e5e7eb',
  navActive:     '#eff6ff',
  navActiveTxt:  '#1d4ed8',
  navInactive:   '#6b7280',

  // Demo banner
  banner:    '#1e3a5f',
  bannerTxt: '#ffffff',
} as const;

export const DARK_AC = {
  // Surfaces
  bg:      '#0f172a',
  surface: '#1e293b',
  hover:   '#273549',

  // Borders
  border:  '#334155',
  border2: '#475569',

  // Text
  text:    '#f1f5f9',
  sub:     '#94a3b8',
  muted:   '#64748b',

  // Primary (blue — lighter for dark mode legibility)
  primary:      '#60a5fa',
  primaryLight: '#1e3a5f',
  primaryText:  '#93c5fd',

  // Status
  green:       '#4ade80',
  greenLight:  '#052e16',
  greenText:   '#86efac',
  amber:       '#fbbf24',
  amberLight:  '#3f1e00',
  amberText:   '#fde68a',
  red:         '#f87171',
  redLight:    '#450a0a',
  purple:      '#a78bfa',
  purpleLight: '#2e1065',
  orange:      '#fb923c',
  orangeLight: '#431407',

  // Sport accent colors (brighter for dark backgrounds)
  soccer:     '#4ade80',
  baseball:   '#fbbf24',
  basketball: '#fb923c',

  // Sidebar
  sidebar:       '#1e293b',
  sidebarBorder: '#334155',
  navActive:     '#1e3a5f',
  navActiveTxt:  '#93c5fd',
  navInactive:   '#94a3b8',

  // Demo banner
  banner:    '#0c1830',
  bannerTxt: '#e2e8f0',
} as const;

export type ACPalette = typeof LIGHT_AC;

// Kept as alias for backward compatibility with non-demo screens
export const AC = LIGHT_AC;

// Font families from the shared theme — used with light colors
export { Fonts } from '../theme';

export type AdminSection = 'overview' | 'sports' | 'schedule' | 'comms' | 'coaches';

export const AR = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const AS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
