export type Pos = 'GK' | 'LB' | 'RB' | 'LWB' | 'RWB' | 'CB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST';
export type BuildUp = 'Short' | 'Balanced' | 'Counter';
export type DefApproach = 'Deep' | 'Balanced' | 'High' | 'Aggressive';
export type SquadMode = 'fc26' | 'real2627';
export type MatchMode = 'authentic' | 'competitive';

export interface RoleVector {
  adv: number; inward: number; wide: number; att: number; def: number; press: number; runs: number;
  create: number; box: number; roam: number; stam: number; stepOut: number; screen: number; sweep: number; hold: number; dropBack: number;
}
export interface Focus { id: string; nameRu: string; descRu: string; tags: string[]; v: RoleVector }
export interface Role {
  id: string; nameEn: string; nameRu: string; positions: string[]; descEn: string; descRu: string;
  keyAttrs: string[]; focuses: Focus[]; focusByPosition: Record<string, string[]>;
}
export interface PlayerRoleTag { role: string; level: number }
export interface Player {
  id: string; name: string; nameRu: string; fullName: string; number: number | null; age: number; heightCm: number;
  foot: 'L' | 'R'; skillMoves: number; weakFoot: number; positions: string[]; ovr: number; ovrLaunch: number | null;
  face: Record<string, number>; attr: Record<string, number>; roles: Record<string, PlayerRoleTag[]>;
  playstyles: string[]; playstylesPlus: string[]; inFc26Barca: boolean; inReal2627: boolean; note: string; source: string;
}
export interface Slot { id: string; pos: Pos; x: number; y: number }
export interface Formation { id: string; name: string; note: string; slots: Slot[] }
export interface SlotAssign { playerId: string | null; roleId: string; focus: string }
export interface Setup {
  formationId: string;
  slots: Record<string, SlotAssign>;
  buildUp: BuildUp;
  defApproach: DefApproach;
  lineHeight: number;
  squadMode: SquadMode;
  matchMode: MatchMode;
}
export interface Patch {
  formationId?: string;
  roles?: { slot: string; roleId: string; focus: string }[];
  swaps?: { slot: string; playerId: string }[];
  buildUp?: BuildUp; defApproach?: DefApproach; lineHeight?: number;
}
