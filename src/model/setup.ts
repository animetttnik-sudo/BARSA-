import type { Setup, Patch, Player, Slot, SquadMode, SlotAssign } from './types';
import { getFormation, getPlayer, getRole, rolesForPos, focusesFor, squadPool, getApproach } from './data';
import { posFamiliarity, roleLevel, profile, roleFit } from './profile';

const DEFAULT_ROLE: Record<string, [string, string]> = {
  GK: ['ball_playing_keeper', 'Build-Up'], LB: ['fullback', 'Balanced'], RB: ['fullback', 'Balanced'], LWB: ['wingback', 'Support'], RWB: ['wingback', 'Support'],
  CB: ['defender', 'Balanced'], CDM: ['holding', 'Defend'], CM: ['box_to_box', 'Balanced'], CAM: ['playmaker', 'Balanced'],
  LM: ['winger', 'Balanced'], RM: ['winger', 'Balanced'], LW: ['inside_forward', 'Balanced'], RW: ['inside_forward', 'Balanced'], ST: ['advanced_forward', 'Attack'],
};
/** Роль по умолчанию: лучшая Роль++/Роль+ игрока на этой позиции, иначе стандартная. */
export function defaultRoleFor(pos: string, player?: Player): { roleId: string; focus: string } {
  const roles = rolesForPos(pos);
  if (player) {
    let best: { roleId: string; lvl: number } | null = null;
    for (const r of roles) { const l = roleLevel(player, pos, r); if (l > 0 && (!best || l > best.lvl)) best = { roleId: r.id, lvl: l }; }
    if (best) { const r = getRole(best.roleId)!; return { roleId: r.id, focus: focusesFor(r, pos)[0] }; }
  }
  const [rid, f] = DEFAULT_ROLE[pos] ?? ['defender', 'Balanced'];
  const r = getRole(rid)!;
  const fs = focusesFor(r, pos);
  return { roleId: rid, focus: fs.includes(f) ? f : fs[0] };
}
export function isRoleValid(pos: string, roleId: string, focus: string) {
  const r = getRole(roleId);
  return !!r && rolesForPos(pos).some((x) => x.id === roleId) && focusesFor(r, pos).includes(focus);
}

function suit(p: Player, slot: Slot): number {
  const pf = posFamiliarity(p, slot.pos);
  const gkMismatch = (slot.pos === 'GK') !== profile(p).isGK;
  if (gkMismatch) return -1000;
  return pf === 'natural' ? 3 : pf === 'related' ? 1.5 : 0;
}
/** Венгерский алгоритм: минимальная стоимость, n строк ≤ m столбцов. Возвращает столбец для каждой строки. */
function hungarian(cost: number[][]): number[] {
  const n = cost.length, m = cost[0]?.length ?? 0;
  const INF = 1e18, u = new Array(n + 1).fill(0), v = new Array(m + 1).fill(0), p = new Array(m + 1).fill(0), way = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i; let j0 = 0;
    const minv = new Array(m + 1).fill(INF), used = new Array(m + 1).fill(false);
    do {
      used[j0] = true; const i0 = p[j0]; let delta = INF, j1 = 0;
      for (let j = 1; j <= m; j++) if (!used[j]) {
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= m; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const res = new Array(n).fill(-1);
  for (let j = 1; j <= m; j++) if (p[j]) res[p[j] - 1] = j - 1;
  return res;
}
/** Распределяет игроков по слотам схемы (оптимально в целом): свои позиции, пригодность к роли слота по атрибутам, близость к прежнему месту. */
export function assignPlayers(formationId: string, players: Player[], prevPos?: Map<string, { x: number; y: number }>, keepRoles?: Map<string, SlotAssign>): Record<string, SlotAssign> {
  const f = getFormation(formationId);
  const out: Record<string, SlotAssign> = {};
  const score = (s: Slot, p: Player) => {
    const pp = prevPos?.get(p.id);
    const dist = pp ? Math.hypot(pp.x - s.x, pp.y - s.y) : 0.5;
    const dr = getRole((DEFAULT_ROLE[s.pos] ?? DEFAULT_ROLE.CB)[0])!;
    return suit(p, s) * 10 - dist * 6 + roleFit(p, dr) * 0.08 + (players.indexOf(p) < 11 ? 5 : 0);
  };
  if (players.length) {
    const slots = f.slots.slice(0, Math.min(f.slots.length, players.length));
    const cost = slots.map((s) => players.map((p) => -score(s, p)));
    const res = hungarian(cost);
    slots.forEach((s, i) => {
      const p = players[res[i]];
      if (!p) return;
      const prev = keepRoles?.get(p.id);
      const role = prev && isRoleValid(s.pos, prev.roleId, prev.focus) ? { roleId: prev.roleId, focus: prev.focus } : defaultRoleFor(s.pos, p);
      out[s.id] = { playerId: p.id, ...role };
    });
  }
  for (const s of f.slots) if (!out[s.id]) out[s.id] = { playerId: null, ...defaultRoleFor(s.pos) };
  return out;
}

export function changeFormation(setup: Setup, formationId: string): Setup {
  const old = getFormation(setup.formationId);
  const prevPos = new Map<string, { x: number; y: number }>();
  const keep = new Map<string, SlotAssign>();
  const xi: Player[] = [];
  for (const s of old.slots) { const a = setup.slots[s.id]; const p = getPlayer(a?.playerId); if (p) { prevPos.set(p.id, { x: s.x, y: s.y }); keep.set(p.id, a); xi.push(p); } }
  return { ...setup, formationId, slots: assignPlayers(formationId, xi, prevPos, keep) };
}

export function applyPatch(setup: Setup, patch: Patch): Setup {
  let s: Setup = { ...setup, slots: { ...setup.slots } };
  if (patch.formationId && patch.formationId !== s.formationId) s = changeFormation(s, patch.formationId);
  if (patch.buildUp) s.buildUp = patch.buildUp;
  if (patch.defApproach) {
    s.defApproach = patch.defApproach;
    const ap = getApproach(patch.defApproach);
    if (patch.lineHeight === undefined && (s.lineHeight < ap.lineMin || s.lineHeight > ap.lineMax)) s.lineHeight = ap.lineDefault;
  }
  if (patch.lineHeight !== undefined) s.lineHeight = patch.lineHeight;
  for (const sw of patch.swaps ?? []) {
    const existing = Object.entries(s.slots).find(([, a]) => a.playerId === sw.playerId);
    const cur = s.slots[sw.slot];
    if (!cur) continue;
    if (existing && existing[0] !== sw.slot) s.slots[existing[0]] = { ...existing[1], playerId: cur.playerId };
    s.slots[sw.slot] = { ...cur, playerId: sw.playerId };
  }
  for (const r of patch.roles ?? []) if (s.slots[r.slot]) s.slots[r.slot] = { ...s.slots[r.slot], roleId: r.roleId, focus: r.focus };
  return s;
}

/** Обмен игроками между двумя слотами (drag&drop). */
export function swapSlots(setup: Setup, a: string, b: string): Setup {
  const s = { ...setup, slots: { ...setup.slots } };
  const pa = s.slots[a].playerId, pb = s.slots[b].playerId;
  s.slots[a] = { ...s.slots[a], playerId: pb };
  s.slots[b] = { ...s.slots[b], playerId: pa };
  return s;
}

export function xiIds(setup: Setup): string[] { return Object.values(setup.slots).map((a) => a.playerId).filter(Boolean) as string[]; }
export function bench(setup: Setup): Player[] { const xi = new Set(xiIds(setup)); return squadPool(setup.squadMode).filter((p) => !xi.has(p.id)); }
export function slotPos(setup: Setup, slotId: string) { return getFormation(setup.formationId).slots.find((s) => s.id === slotId)!.pos; }

const DEF_XI: Record<SquadMode, Record<string, [string, string, string]>> = {
  fc26: {
    GK: ['joan-garcia', 'ball_playing_keeper', 'Build-Up'], LB: ['balde', 'attacking_wingback', 'Support'], LCB: ['cubarsi', 'ball_playing_defender', 'Defend'],
    RCB: ['eric-garcia', 'ball_playing_defender', 'Defend'], RB: ['kounde', 'fullback', 'Balanced'], LDM: ['pedri', 'deep_lying_playmaker', 'Build-Up'],
    RDM: ['de-jong', 'deep_lying_playmaker', 'Defend'], LM: ['raphinha', 'inside_forward', 'Attack'], CAM: ['fermin', 'shadow_striker', 'Attack'],
    RM: ['lamine-yamal', 'inside_forward', 'Balanced'], ST: ['lewandowski', 'advanced_forward', 'Attack'],
  },
  real2627: {
    GK: ['joan-garcia', 'ball_playing_keeper', 'Build-Up'], LB: ['balde', 'attacking_wingback', 'Support'], LCB: ['cubarsi', 'ball_playing_defender', 'Defend'],
    RCB: ['eric-garcia', 'ball_playing_defender', 'Defend'], RB: ['kounde', 'fullback', 'Balanced'], LDM: ['pedri', 'deep_lying_playmaker', 'Build-Up'],
    RDM: ['rodri', 'deep_lying_playmaker', 'Defend'], LM: ['raphinha', 'inside_forward', 'Attack'], CAM: ['fermin', 'shadow_striker', 'Attack'],
    RM: ['lamine-yamal', 'inside_forward', 'Balanced'], ST: ['gabriel-jesus', 'advanced_forward', 'Attack'],
  },
};
export function defaultSetup(mode: SquadMode = 'fc26'): Setup {
  const slots: Record<string, SlotAssign> = {};
  for (const [k, [p, r, f]] of Object.entries(DEF_XI[mode])) slots[k] = { playerId: p, roleId: r, focus: f };
  return { formationId: '4-2-3-1', slots, buildUp: 'Balanced', defApproach: 'High', lineHeight: 72, squadMode: mode, matchMode: 'authentic' };
}
/** Смена базы состава: игроки, которых нет в новой базе, заменяются лучшими доступными. */
export function switchSquadMode(setup: Setup, mode: SquadMode): Setup {
  const pool = squadPool(mode);
  const ok = new Set(pool.map((p) => p.id));
  const s: Setup = { ...setup, squadMode: mode, slots: { ...setup.slots } };
  const f = getFormation(s.formationId);
  const used = new Set(Object.values(s.slots).map((a) => a.playerId).filter((x) => x && ok.has(x)) as string[]);
  for (const slot of f.slots) {
    const a = s.slots[slot.id];
    if (a.playerId && ok.has(a.playerId)) continue;
    const cand = pool.filter((p) => !used.has(p.id)).sort((x, y) => suit(y, slot) - suit(x, slot) || (y.ovr - x.ovr))[0]; // OVR only as tie-break for auto-fill, never in the model
    if (cand) { used.add(cand.id); s.slots[slot.id] = { ...a, playerId: cand.id }; } else s.slots[slot.id] = { ...a, playerId: null };
  }
  return s;
}
