// Farmix Design System - Award-Caliber Agricultural UI
// Deep fertile earth tones, luminous emerald vitality, golden harvest accents, and crisp typography

export const colors = {
  // Foundations
  ground: '#08120b',
  groundDark: '#040906',
  groundLight: '#0d1d12',
  
  // Surfaces & Glass
  surface: 'rgba(16, 32, 22, 0.75)',
  surfaceElevated: 'rgba(24, 46, 31, 0.88)',
  surfaceSolid: '#122317',
  surfaceCard: 'rgba(18, 36, 25, 0.82)',
  surfaceInput: 'rgba(255, 255, 255, 0.05)',
  
  // Borders & Dividers
  borderSubtle: 'rgba(255, 255, 255, 0.07)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  borderEmerald: 'rgba(52, 211, 153, 0.25)',
  borderGold: 'rgba(245, 158, 11, 0.25)',
  
  // Ink & Text
  ink: '#f4f7f4',
  inkSecondary: '#cbd5ce',
  muted: '#8e9f92',
  faint: 'rgba(255, 255, 255, 0.35)',
  
  // Accents & Signals
  emerald: '#34d399',
  emeraldGlow: 'rgba(52, 211, 153, 0.18)',
  emeraldDeep: '#059669',
  
  gold: '#fbbf24',
  goldGlow: 'rgba(251, 191, 36, 0.16)',
  
  coral: '#f87171',
  coralGlow: 'rgba(248, 113, 113, 0.18)',
  
  sky: '#38bdf8',
  skyGlow: 'rgba(56, 189, 248, 0.16)',
  
  clay: '#fb923c',
  clayGlow: 'rgba(251, 146, 60, 0.16)',
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 26,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const typography = {
  hero: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  h1: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  h2: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    lineHeight: 25,
  },
  h3: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.inkSecondary,
    lineHeight: 20,
  },
  bodySm: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.muted,
    lineHeight: 17,
  },
  meta: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
};

export const glassCard = {
  backgroundColor: colors.surfaceCard,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: colors.borderSubtle,
  padding: spacing.lg,
  overflow: 'hidden',
};

