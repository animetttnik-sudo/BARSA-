import type { Setup, Patch, Pos, DefApproach } from './types';
import { evaluate, Evaluation, SlotEval } from './engine';
import { applyPatch, bench, isRoleValid } from './setup';
import { rolesForPos, focusesFor, getRole, getApproach, getBuildUp, APPROACHES, BUILDUPS, getFormation } from './data';
import { posFamiliarity, profile } from './profile';

export type FixType = 'tactic' | 'role' | 'swap' | 'manual' | 'formation';
export interface Fix {
  id: string; type: FixType; titleRu: string; reasonRu: string; patch?: Patch;
  before?: { metric: number; rating: number; attack: number; defRisk: number };
  after?: { metric: number; rating: number; attack: number; defRisk: number };
}
export interface Zone {
  id: string; nameRu: string; rect: [number, number, number, number]; risk: number; severity: 'high' | 'medium' | 'low';
  reasonRu: string; fixes: Fix[];
}
export const ZONE_DEF: Record<string, { nameRu: string; rect: [number, number, number, number] }> = {
  flankL: { nameRu: 'За левым крайним', rect: [0, 0.06, 0.24, 0.48] },
  flankR: { nameRu: 'За правым крайним', rect: [0.76, 0.06, 1, 0.48] },
  halfL: { nameRu: 'Левый полуфланг (канал ЦЗ–крайний)', rect: [0.24, 0.12, 0.4, 0.42] },
  halfR: { nameRu: 'Правый полуфланг (канал ЦЗ–крайний)', rect: [0.6, 0.12, 0.76, 0.42] },
  behind: { nameRu: 'За спиной ЦЗ (высокая линия)', rect: [0.4, 0.08, 0.6, 0.3] },
  z14: { nameRu: 'Между линиями (зона 14)', rect: [0.4, 0.3, 0.6, 0.46] },
  aerial: { nameRu: 'Навесы и стандарты (штрафная)', rect: [0.21, 0, 0.79, 0.08] },
  rest: { nameRu: 'Страховка при потере (центр поля)', rect: [0.24, 0.46, 0.76, 0.56] },
  cpress: { nameRu: 'Контрпрессинг после потери', rect: [0.1, 0.62, 0.9, 0.8] },
  fatigue: { nameRu: 'Усталость к концу матча', rect: [0, 0, 0, 0] },
  deep: { nameRu: 'Давление у своей штрафной', rect: [0.21, 0.08, 0.79, 0.12] },
};
export const MANUAL_RU: Record<string, string> = {
  flankL: 'Вручную: при потере сразу переключись на ближайшего к флангу игрока и держи L2/LT (jockey) — не прыгай в подкат. Второго игрока на прессинг (R1/RB) зови, только когда сзади есть страховка.',
  flankR: 'Вручную: при потере сразу переключись на ближайшего к флангу игрока и держи L2/LT (jockey) — не прыгай в подкат. Второго игрока на прессинг (R1/RB) зови, только когда сзади есть страховка.',
  halfL: 'Вручную: закрывай канал между ЦЗ и крайним опорником (управляй им сам), а ЦЗ не выдёргивай на игрока между линиями.',
  halfR: 'Вручную: закрывай канал между ЦЗ и крайним опорником (управляй им сам), а ЦЗ не выдёргивай на игрока между линиями.',
  behind: 'Вручную: на длинный пас за спину переключайся на ЦЗ, который ближе к своим воротам, и беги к точке приёма, а не к мячу. Ловушку офсайда включай осознанно. Выход вратаря — удерживай △/Y.',
  z14: 'Вручную: без мяча управляй опорником — стой между мячом и «дыркой» перед ЦЗ, не выбегай им на прессинг, если сзади пусто.',
  aerial: 'Вручную: в FC 26 есть новые назначения на стандартах (Threat Marker, Post Watcher, Defensive Cover) — самого высокого/сильного в воздухе ставь «Threat Marker» на главного головастика соперника.',
  rest: 'Вручную: не подключай обоих крайних сразу. Если один ушёл в атаку — второго держи сзади (не делай им забеганий кнопкой).',
  cpress: 'Вручную: сразу после потери 2–3 с жми R1/RB (второй игрок прессингует) или включи Quick Tactic «Team Press» (20 с, потом перезарядка 100 с).',
  deep: 'Вручную: если стоишь низко — выбивай мяч подальше от штрафной и сразу ищи быстрого вингера/форварда длинным пасом; не давай сопернику спокойно навешивать (закрывай фланг вингером).',
  fatigue: 'Вручную: смотри вкладку «Замены» — меняй уставших по окнам. Team Press и спринты без мяча экономь после 60-й минуты.',
};
const ZONE_SLOTS: Record<string, (s: SlotEval) => boolean> = {
  flankL: (s) => s.side === 'L' || ['CDM', 'CB'].includes(s.slot.pos),
  flankR: (s) => s.side === 'R' || ['CDM', 'CB'].includes(s.slot.pos),
  halfL: (s) => s.slot.x <= 0.5 && s.slot.y < 0.5 && s.slot.pos !== 'GK',
  halfR: (s) => s.slot.x >= 0.5 && s.slot.y < 0.5 && s.slot.pos !== 'GK',
  behind: (s) => ['CB', 'GK'].includes(s.slot.pos) || (s.slot.y < 0.3),
  z14: (s) => ['CDM', 'CM', 'CB'].includes(s.slot.pos),
  aerial: (s) => ['CB', 'CDM', 'LB', 'RB', 'LWB', 'RWB'].includes(s.slot.pos),
  rest: (s) => s.slot.pos !== 'GK' && s.slot.y < 0.5,
  cpress: (s) => s.slot.y > 0.45,
  fatigue: (s) => s.slot.pos !== 'GK',
  deep: (s) => s.slot.pos !== 'GK' && s.slot.y < 0.5,
};
const SWAP_STAT: Record<string, [string, (id: string) => number]> = {
  behind: ['скорость возврата', (id) => profileById(id).recovery], flankL: ['скорость возврата', (id) => profileById(id).recovery], flankR: ['скорость возврата', (id) => profileById(id).recovery],
  aerial: ['игра в воздухе', (id) => profileById(id).aerial], z14: ['оборона', (id) => profileById(id).defending], halfL: ['оборона', (id) => profileById(id).defending], halfR: ['оборона', (id) => profileById(id).defending],
  rest: ['оборона', (id) => profileById(id).defending], deep: ['игра в воздухе', (id) => profileById(id).aerial], cpress: ['выносливость', (id) => profileById(id).stamina], fatigue: ['выносливость', (id) => profileById(id).stamina],
  counter: ['скорость', (id) => profileById(id).pace],
};
import { getPlayer } from './data';
const profileById = (id: string) => profile(getPlayer(id)!);

export const sevOf = (r: number): 'high' | 'medium' | 'low' => (r >= 60 ? 'high' : r >= 38 ? 'medium' : 'low');
const snap = (e: Evaluation, metric: number) => ({ metric: Math.round(metric), rating: e.rating, attack: e.attackScore, defRisk: e.defRisk });

type MetricFn = (e: Evaluation) => number; // lower = better if minimize
interface Cand { type: FixType; patch: Patch; title: string; why: string }

/** Генерирует кандидаты на исправления для набора слотов. */
export function candidates(setup: Setup, ev: Evaluation, slotFilter: (s: SlotEval) => boolean, statKey: string): Cand[] {
  const out: Cand[] = [];
  const S = ev.slots.filter(slotFilter);
  for (const s of S) {
    if (s.slot.pos === 'GK' && statKey !== 'behind') continue;
    for (const r of rolesForPos(s.slot.pos)) for (const f of focusesFor(r, s.slot.pos)) {
      if (r.id === s.role.id && f === s.focus.id) continue;
      const fo = r.focuses.find((x) => x.id === f)!;
      out.push({ type: 'role', patch: { roles: [{ slot: s.slot.id, roleId: r.id, focus: f }] },
        title: `${s.player?.nameRu ?? s.slot.id}: ${s.role.nameRu} (${s.focus.nameRu}) → ${r.nameRu} (${fo.nameRu})`, why: fo.descRu });
    }
  }
  const bn = bench(setup);
  for (const s of S) {
    for (const p of bn) {
      const pf = posFamiliarity(p, s.slot.pos);
      if (pf === 'oop' || (s.slot.pos === 'GK') !== profile(p).isGK) continue;
      const [lab, fn] = SWAP_STAT[statKey] ?? SWAP_STAT.rest;
      const cur = s.player ? Math.round(fn(s.player.id)) : 0, nw = Math.round(fn(p.id));
      out.push({ type: 'swap', patch: { swaps: [{ slot: s.slot.id, playerId: p.id }] }, title: `${p.nameRu} вместо ${s.player?.nameRu ?? 'пустого места'} (${s.slot.pos})`,
        why: `${lab}: ${cur} → ${nw}${pf === 'related' ? '; смежная позиция' : ''}.` });
    }
  }
  const ai = APPROACHES.findIndex((a) => a.id === setup.defApproach);
  for (const d of [-1, 1]) {
    const a = APPROACHES[ai + d];
    if (a) out.push({ type: 'tactic', patch: { defApproach: a.id, lineHeight: a.lineDefault }, title: `Подход в обороне: ${getApproach(setup.defApproach).nameRu} → ${a.nameRu} (линия ${a.lineDefault})`, why: `Сопровождение забеганий: ${a.runTracking.toLowerCase()}; давление: ${a.pressure.toLowerCase()}.` });
  }
  const ap = getApproach(setup.defApproach);
  for (const dl of [-12, 12]) {
    const lh = Math.max(ap.lineMin, Math.min(ap.lineMax, setup.lineHeight + dl));
    if (lh !== setup.lineHeight) out.push({ type: 'tactic', patch: { lineHeight: lh }, title: `Высота линии: ${setup.lineHeight} → ${lh}`, why: lh < setup.lineHeight ? 'Меньше пространства за спиной защитников, но блок дальше от чужих ворот.' : 'Блок выше и компактнее с полузащитой, но больше места за спиной.' });
  }
  for (const b of BUILDUPS) if (b.id !== setup.buildUp) out.push({ type: 'tactic', patch: { buildUp: b.id }, title: `Стиль розыгрыша: ${getBuildUp(setup.buildUp).nameRu} → ${b.nameRu}`, why: b.descRu });
  return out;
}

/** Оценивает кандидатов по метрике (minimize=true — меньше лучше) и возвращает лучшие по каждому типу. */
export function rankFixes(setup: Setup, ev: Evaluation, cands: Cand[], metric: MetricFn, minimize: boolean, opts: { perType?: number; minGain?: number; ratingWeight?: number } = {}): Fix[] {
  const m0 = metric(ev);
  const scored = cands.map((c) => {
    const s2 = applyPatch(setup, c.patch);
    const e2 = evaluate(s2);
    const m1 = metric(e2);
    const gain = minimize ? m0 - m1 : m1 - m0;
    const score = gain + (opts.ratingWeight ?? 0.6) * (e2.rating - ev.rating);
    return { c, e2, m1, gain, score };
  }).filter((x) => x.gain >= (opts.minGain ?? 3)).sort((a, b) => b.score - a.score);
  const per = opts.perType ?? 1;
  const cnt: Record<string, number> = {};
  const res: Fix[] = [];
  for (const x of scored) {
    cnt[x.c.type] = (cnt[x.c.type] ?? 0) + 1;
    if (cnt[x.c.type] > per) continue;
    res.push({ id: `${x.c.type}-${res.length}`, type: x.c.type, titleRu: x.c.title, patch: x.c.patch,
      reasonRu: `${x.c.why} Эффект по модели: ${Math.round(m0)} → ${Math.round(x.m1)}; общий рейтинг ${ev.rating} → ${x.e2.rating}.`,
      before: snap(ev, m0), after: snap(x.e2, x.m1) });
  }
  return res.sort((a, b) => (b.after!.rating - a.after!.rating));
}

/** Экран «Контратака −»: зоны уязвимости + исправления. */
export function vulnerabilities(setup: Setup, ev?: Evaluation, withFixes = true): Zone[] {
  const e = ev ?? evaluate(setup);
  const comp = new Map(e.defence.map((c) => [c.id, c]));
  const zones: Zone[] = Object.entries(ZONE_DEF).map(([id, d]) => {
    const c = comp.get(id)!;
    return { id, nameRu: d.nameRu, rect: d.rect, risk: c.value, severity: sevOf(c.value), reasonRu: c.reasonRu, fixes: [] };
  }).sort((a, b) => b.risk - a.risk);
  if (withFixes) for (const z of zones) {
    if (z.risk < 30) { z.fixes = [{ id: 'manual', type: 'manual', titleRu: 'Что делать вручную', reasonRu: MANUAL_RU[z.id] }]; continue; }
    const cands = candidates(setup, e, ZONE_SLOTS[z.id], z.id);
    const fixes = rankFixes(setup, e, cands, (x) => x.risks[z.id], true, { minGain: 4 });
    z.fixes = [...fixes.slice(0, 4), { id: 'manual', type: 'manual', titleRu: 'Что делать вручную', reasonRu: MANUAL_RU[z.id] }];
  }
  return zones;
}
export function fixesForZone(setup: Setup, zoneId: string): Fix[] {
  const e = evaluate(setup);
  const fixes = rankFixes(setup, e, candidates(setup, e, ZONE_SLOTS[zoneId], zoneId), (x) => x.risks[zoneId], true, { minGain: 4 });
  return [...fixes.slice(0, 4), { id: 'manual', type: 'manual', titleRu: 'Что делать вручную', reasonRu: MANUAL_RU[zoneId] }];
}
