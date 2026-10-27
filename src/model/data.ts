import playersJson from '../../data/players.json';
import rolesJson from '../../data/roles.json';
import formationsJson from '../../data/formations.json';
import tacticsJson from '../../data/tactics.json';
import type { Player, Role, Formation, DefApproach, BuildUp } from './types';

export const PLAYERS: Player[] = (playersJson as any).players;
export const PLAYERS_META: any = (playersJson as any)._meta;
export const ROLES: Role[] = (rolesJson as any).roles;
export const ROLES_META: any = (rolesJson as any)._meta;
export const FORMATIONS: Formation[] = (formationsJson as any).formations;
export const TACTICS: any = tacticsJson;

const pById = new Map(PLAYERS.map((p) => [p.id, p]));
const rById = new Map(ROLES.map((r) => [r.id, r]));
const fById = new Map(FORMATIONS.map((f) => [f.id, f]));
export const getPlayer = (id: string | null | undefined) => (id ? pById.get(id) : undefined);
export const getRole = (id: string) => rById.get(id);
export const getFormation = (id: string) => fById.get(id) ?? FORMATIONS[0];

export interface ApproachDef { id: DefApproach; nameRu: string; lineMin: number; lineMax: number; lineDefault: number; trackRuns: number; pressBonus: number; staminaMult: number; offsideTrap: boolean; runTracking: string; pressure: string }
export interface BuildUpDef { id: BuildUp; nameRu: string; descRu: string; forwardRuns: number; shortOptions: number }
export const APPROACHES: ApproachDef[] = TACTICS.defensiveApproach;
export const BUILDUPS: BuildUpDef[] = TACTICS.buildUp;
export const getApproach = (id: DefApproach) => APPROACHES.find((a) => a.id === id)!;
export const getBuildUp = (id: BuildUp) => BUILDUPS.find((b) => b.id === id)!;

/** Role-set lookup: wingback slots use fullback role set, LAM/RAM use CAM etc. */
export const roleKeyPos = (pos: string) => (pos === 'LWB' ? 'LB' : pos === 'RWB' ? 'RB' : pos);
export function rolesForPos(pos: string): Role[] {
  const k = roleKeyPos(pos);
  return ROLES.filter((r) => r.positions.includes(k) || r.positions.includes(pos));
}
export function focusesFor(role: Role, pos: string): string[] {
  const k = roleKeyPos(pos);
  return role.focusByPosition[k] ?? role.focusByPosition[pos] ?? role.focuses.map((f) => f.id);
}
export function squadPool(mode: 'fc26' | 'real2627'): Player[] {
  return PLAYERS.filter((p) => (mode === 'fc26' ? p.inFc26Barca : p.inReal2627));
}
