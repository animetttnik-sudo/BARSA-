import type { Player, Role } from './types';
import { roleKeyPos } from './data';

export const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const has = (p: Player, ps: string) => (p.playstylesPlus.includes(ps) ? 2 : p.playstyles.includes(ps) ? 1 : 0);
/** PlayStyle bonus: base = b, PlayStyle+ = 2b */
const psb = (p: Player, list: string[], b: number) => list.reduce((s, ps) => s + has(p, ps) * b, 0);

export interface Profile {
  pace: number; burst: number; recovery: number; stamina: number; aerial: number; defending: number; passing: number;
  pressRes: number; finishing: number; crossing: number; dribbling: number; strength: number; aggression: number;
  gkSweep: number; gkPass: number; isGK: boolean;
}
const cache = new Map<string, Profile>();
export function profile(p: Player): Profile {
  const c = cache.get(p.id);
  if (c) return c;
  const a = (k: string) => p.attr[k] ?? 50;
  const heightScore = clamp(((p.heightCm - 165) / 35) * 100);
  const pr: Profile = {
    pace: clamp(0.45 * a('Acceleration') + 0.55 * a('Sprint Speed') + psb(p, ['Rapid'], 2) + psb(p, ['Quick Step'], 1.5)),
    burst: clamp(a('Acceleration') + psb(p, ['Quick Step'], 4)),
    recovery: clamp(0.65 * a('Sprint Speed') + 0.35 * a('Acceleration') + psb(p, ['Relentless'], 1.5)),
    stamina: clamp(a('Stamina') + psb(p, ['Relentless'], 5)),
    aerial: clamp(0.35 * a('Heading Acc.') + 0.3 * a('Jumping') + 0.2 * a('Strength') + 0.15 * heightScore + psb(p, ['Aerial Fortress'], 6) + psb(p, ['Precision Header'], 3)),
    defending: clamp(0.35 * a('Def. Awareness') + 0.25 * a('Stand Tackle') + 0.25 * a('Interceptions') + 0.15 * a('Slide Tackle') + psb(p, ['Anticipate', 'Intercept', 'Jockey', 'Block', 'Bruiser', 'Slide Tackle', 'Enforcer'], 2)),
    passing: clamp(0.35 * a('Short Pass') + 0.25 * a('Vision') + 0.25 * a('Long Pass') + 0.15 * a('Composure') + psb(p, ['Incisive Pass', 'Pinged Pass', 'Long Ball Pass', 'Tiki Taka', 'Whipped Pass', 'Inventive'], 2)),
    pressRes: clamp(0.3 * a('Ball Control') + 0.25 * a('Dribbling') + 0.25 * a('Composure') + 0.2 * a('Agility') + psb(p, ['Press Proven'], 5) + psb(p, ['Technical', 'First Touch'], 3)),
    finishing: clamp(0.5 * a('Finishing') + 0.2 * a('Att. Position') + 0.15 * a('Composure') + 0.15 * a('Shot Power') + psb(p, ['Finesse Shot', 'Power Shot', 'Low Driven Shot', 'Chip Shot', 'Gamechanger', 'Acrobatic'], 2)),
    crossing: clamp(0.6 * a('Crossing') + 0.4 * a('Curve') + psb(p, ['Whipped Pass'], 4)),
    dribbling: clamp(0.4 * a('Dribbling') + 0.3 * a('Ball Control') + 0.2 * a('Agility') + 0.1 * a('Balance') + psb(p, ['Technical', 'Trickster', 'Rapid', 'Quick Step', 'First Touch'], 2)),
    strength: a('Strength'),
    aggression: a('Aggression'),
    gkSweep: clamp(0.6 * a('Sprint Speed') + 0.4 * a('Reactions') + psb(p, ['Rush Out'], 6)),
    gkPass: clamp(0.4 * a('GK Kicking') + 0.35 * a('Short Pass') + 0.25 * a('Long Pass') + psb(p, ['Footwork', 'Far Throw'], 2)),
    isGK: p.positions.includes('GK'),
  };
  cache.set(p.id, pr);
  return pr;
}

const RELATED: Record<string, string[]> = {
  LB: ['LWB'], LWB: ['LB', 'LM'], RB: ['RWB'], RWB: ['RB', 'RM'], CB: [], CDM: ['CM'], CM: ['CDM', 'CAM'], CAM: ['CM', 'ST'],
  LM: ['LW', 'LWB'], RM: ['RW', 'RWB'], LW: ['LM', 'ST'], RW: ['RM', 'ST'], ST: ['CAM', 'LW', 'RW'], GK: [],
};
export type Familiarity = 'role++' | 'role+' | 'natural' | 'related' | 'oop';
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export function roleLevel(p: Player, pos: string, role: Role): number {
  const tags = p.roles[pos] ?? p.roles[roleKeyPos(pos)] ?? (pos === 'LWB' ? p.roles['LB'] : pos === 'RWB' ? p.roles['RB'] : undefined) ?? [];
  const t = tags.find((x) => norm(x.role) === norm(role.nameEn));
  return t ? t.level : 0;
}
export function posFamiliarity(p: Player, pos: string): 'natural' | 'related' | 'oop' {
  if (p.positions.includes(pos)) return 'natural';
  if (pos === 'LWB' && p.positions.includes('LB')) return 'related';
  if (pos === 'RWB' && p.positions.includes('RB')) return 'related';
  if ((RELATED[pos] ?? []).some((q) => p.positions.includes(q))) return 'related';
  return 'oop';
}
export function familiarity(p: Player, pos: string, role: Role): Familiarity {
  const pf = posFamiliarity(p, pos);
  const lvl = roleLevel(p, pos, role);
  if (lvl === 2 && pf !== 'oop') return 'role++';
  if (lvl === 1 && pf !== 'oop') return 'role+';
  return pf;
}
export const FAM_MULT: Record<Familiarity, number> = { 'role++': 1.08, 'role+': 1.04, natural: 1.0, related: 0.95, oop: 0.86 };
export const FAM_RU: Record<Familiarity, string> = { 'role++': 'Роль++', 'role+': 'Роль+', natural: 'Своя позиция', related: 'Смежная позиция', oop: 'Не своя позиция' };

/** How well player's attributes fit a role's key attributes (0..100). Uses detailed attributes, never OVR. */
export function roleFit(p: Player, role: Role): number {
  const pr = profile(p);
  const map: Record<string, number> = {
    'Sprint Speed': pr.pace, Acceleration: pr.burst, Stamina: pr.stamina, Crossing: pr.crossing, Dribbling: pr.dribbling,
    'Short Pass': pr.passing, 'Long Pass': pr.passing, Vision: pr.passing, Composure: pr.pressRes, Finishing: pr.finishing,
    'Att. Position': pr.finishing, 'Def. Awareness': pr.defending, 'Stand Tackle': pr.defending, Interceptions: pr.defending,
    Strength: pr.strength, Aggression: pr.aggression, 'Heading Acc.': pr.aerial, Jumping: pr.aerial, 'Long Shots': p.attr['Long Shots'] ?? 50,
    'GK Reflexes': p.attr['GK Reflexes'] ?? 30, 'GK Positioning': p.attr['GK Positioning'] ?? 30, 'GK Handling': p.attr['GK Handling'] ?? 30,
    'GK Kicking': pr.gkPass, 'Rush Out': pr.gkSweep,
  };
  const vals = role.keyAttrs.map((k) => map[k] ?? p.attr[k] ?? 50);
  return vals.reduce((s, v) => s + v, 0) / Math.max(1, vals.length);
}
