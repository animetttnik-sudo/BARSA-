import { Platform } from 'react-native';
export const C = {
  bg: '#070B16',
  bg2: '#0D1324',
  card: '#121A30',
  card2: '#18223D',
  line: '#24304F',
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
export const sevColor = (s: 'high' | 'medium' | 'low') => (s === 'high' ? C.bad : s === 'medium' ? C.warn : C.good);
export const riskColor = (r: number) => (r >= 60 ? C.bad : r >= 38 ? C.warn : C.good);
export const scoreColor = (v: number) => (v >= 75 ? C.good : v >= 55 ? C.gold : v >= 40 ? C.warn : C.bad);
export const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
export const SVG_FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Roboto, sans-serif' : undefined;
