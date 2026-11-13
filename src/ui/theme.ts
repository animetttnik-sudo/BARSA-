import { Platform, type TextStyle } from 'react-native';

export const C = {
  bg: '#0A0D14',
  bg2: '#121722',
  card: '#121722',
  card2: '#1A2030',
  line: 'rgba(255,255,255,0.12)',
  hairline: 'rgba(255,255,255,0.08)',
  grid: 'rgba(255,255,255,0.16)',
  blue: '#004D98',
  blueL: '#2F7BD8',
  garnet: '#A50044',
  garnetL: '#E0306E',
  gold: '#EDBB00',
  text: '#EEF2FA',
  sub: '#9AA7C2',
  dim: '#66718C',
  good: '#36C98E',
  warn: '#F2A93B',
  bad: '#F0506E',
  pitch: '#0E2A22',
  pitch2: '#103027',
  pitchLine: 'rgba(255,255,255,0.28)',
};

/** 8pt-сетка: 4 / 8 / 12 / 16 / 20 / 24 / 32 */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const nums: TextStyle = {
  fontVariant: ['tabular-nums'],
};

export const glass = {
  bg: '#091124',
  blue: '#163A86',
  garnet: '#3A0E22',
  line: 'rgba(255,255,255,0.14)',
  sheen: 'rgba(255,255,255,0.28)',
};

/** Apple HIG: основной текст от 17, вторичный не ниже 13. */
export const type = {
  title: {
    color: C.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  } as TextStyle,
  subtitle: {
    color: C.sub,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  } as TextStyle,
  body: {
    color: C.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,
  callout: {
    color: C.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  } as TextStyle,
  footnote: {
    color: C.sub,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  } as TextStyle,
  caption: {
    color: C.sub,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  } as TextStyle,
  tab: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  } as TextStyle,
  metric: {
    color: C.text,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
};

export const sevColor = (s: 'high' | 'medium' | 'low') => (s === 'high' ? C.bad : s === 'medium' ? C.warn : C.good);
export const riskColor = (r: number) => (r >= 60 ? C.bad : r >= 38 ? C.warn : C.good);
export const scoreColor = (v: number) => (v >= 75 ? C.good : v >= 55 ? C.gold : v >= 40 ? C.warn : C.bad);
export const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
export const SVG_FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Roboto, sans-serif' : undefined;
