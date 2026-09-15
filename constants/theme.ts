export const colors = {
  bg: '#071526',
  bgGradientTop: '#153957',
  bgGradientBottom: '#071526',
  card: '#10243C',
  cardAlt: '#122B46',
  border: '#203D5A',
  borderActive: '#5F8872',
  accent: '#A9F06B',
  accentSoft: '#D7F3BE',
  accentDark: '#0A1C31',
  text: '#F4F8FC',
  textMuted: '#849AAF',
  textMutedDark: '#72889C',
  heart: '#F58B8B',
  activePrayerBg: '#234D52',
  quoteCard: '#F2F6F5',
  quoteText: '#183952',
  quoteMuted: '#78909F',
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
} as const;

export const spacing = {
  screen: 24,
  screenTop: 58,
  card: 15,
  gap: 10,
} as const;

export const tabColors = {
  active: colors.accent,
  inactive: '#95A4B8',
  barBg: '#10243C',
  barBorder: '#24415F',
} as const;
