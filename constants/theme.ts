// Design tokens from the "Serene Ritual" design system (Stitch export).
export const colors = {
  bg: '#071526',
  bgGradientTop: '#102D49',
  bgGradientBottom: '#071526',
  card: '#10243C',
  cardAlt: '#122B46',
  cardDeep: '#0B1B2E',
  border: '#203D5A',
  borderActive: '#5F8872',
  accent: '#A9F06B',
  accentSoft: '#D7F3BE',
  accentMuted: '#2A4A22',
  accentDark: '#071526',
  text: '#F4F8FC',
  textMuted: '#849AAF',
  textMutedDark: '#72889C',
  heart: '#F58B8B',
  activePrayerBg: '#234D52',
  warnBg: '#3A2E1A',
  warnText: '#E8CE9A',
  quoteCard: '#F2F6F5',
  quoteText: '#183952',
  quoteMuted: '#78909F',
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export const spacing = {
  screen: 20,
  card: 16,
  gap: 12,
} as const;

export const tabColors = {
  active: colors.accent,
  inactive: colors.textMuted,
  barBg: colors.card,
  barBorder: colors.border,
} as const;
