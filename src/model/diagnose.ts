/**
 * «Почему не работает»: диагноз по категориям + поиск альтернативной тактики.
 * Поиск прозрачный: перебор схем → жадный подбор ролей → сетка тактик → до 3 замен из запаса.
 * Вклад каждого изменения считается откатом этого изменения в итоговой тактике.
 */
import type { Setup, Patch, SlotAssign } from './types';
import { evaluate, Evaluation, Component } from './engine';
import { applyPatch, changeFormation, bench, isRoleValid } from './setup';
import { FORMATIONS, rolesForPos, focusesFor, getRole, getPlayer, getFormation, APPROACHES, BUILDUPS, getApproach, getBuildUp } from './data';
import { posFamiliarity, profile } from './profile';

export type Category = 'defence' | 'possession' | 'attack' | 'all';
export const CATEGORY_RU: Record<Category, string> = { defence: 'Проблемы в защите', possession: 'Проблемы с владением', attack: 'Проблемы с атакой', all: 'Всё вместе' };
export interface Issue { titleRu: string; reasonRu: string; severity: number }
export interface Change { kind: 'formation' | 'tactic' | 'role' | 'swap'; titleRu: string; reasonRu: string; contribution: number; topEffectsRu: string }
export interface Diagnosis {
  category: Category; issues: Issue[]; changes: Change[]; alternative: Setup; before: Evaluation; after: Evaluation;
  objectiveBefore: number; objectiveAfter: number; objectiveRu: string; improved: boolean;
}

const comp = (e: Evaluation, id: string) => (e.attack.find((c) => c.id === id) ?? e.defence.find((c) => c.id === id))!.value;
export function objective(cat: Category, e: Evaluation): number {
  switch (cat) {
    case 'defence': return (100 - e.defRisk) + 0.25 * e.attackScore;
    case 'possession': return comp(e, 'build') + 0.35 * comp(e, 'create') + 0.2 * comp(e, 'spacing') + 0.15 * (100 - comp(e, 'cpress')) + 0.3 * e.rating;
    case 'attack': return e.attackScore + 0.3 * (100 - e.defRisk);
    case 'all': return e.rating * 1.5;
  }
}
export const OBJECTIVE_RU: Record<Category, string> = {
  defence: 'надёжность обороны (100 − риск) + 0.25 × атака',
  possession: 'розыгрыш + 0.35 × созидание + 0.2 × расстановка + 0.15 × контрпрессинг + 0.3 × общий рейтинг',
  attack: 'атака + 0.3 × надёжность обороны',
  all: 'общий рейтинг опасности',
};
const IDS: Record<Category, string[]> = {
  defence: ['rest', 'behind', 'flankL', 'flankR', 'halfL', 'halfR', 'z14', 'aerial', 'cpress', 'fatigue', 'deep'],
  possession: ['build', 'create', 'spacing', 'width', 'cpress', 'support'],
  attack: ['runs', 'box', 'create', 'width', 'finish', 'synergy', 'support', 'counter'],
  all: [],
};

export function issues(cat: Category, e: Evaluation, setup: Setup): Issue[] {
  const out: Issue[] = [];
  const ids = cat === 'all' ? [...IDS.defence, ...IDS.attack, 'build'] : IDS[cat];
  for (const id of ids) {
    const c: Component | undefined = e.defence.find((x) => x.id === id) ?? e.attack.find((x) => x.id === id);
    if (!c) continue;
    const bad = c.group === 'defence' ? c.value : 100 - c.value;
    if (bad >= 35) out.push({ titleRu: c.group === 'defence' ? `${c.nameRu}: риск ${c.value}` : `${c.nameRu}: всего ${c.value}/100`, reasonRu: c.reasonRu, severity: bad });
  }
  const bu = getBuildUp(setup.buildUp);
  if ((cat === 'possession' || cat === 'all') && setup.buildUp === 'Counter') out.push({ titleRu: 'Стиль «Контратака» мешает владению', reasonRu: 'В FC 26 при Counter игроки сразу бегут вперёд и почти не открываются коротко — мяч теряется в первой фазе.', severity: 55 });
  if ((cat === 'possession' || cat === 'all')) {
    const gk = e.slots.find((s) => s.slot.pos === 'GK');
    if (gk && gk.v.create < 0.5) out.push({ titleRu: 'Вратарь не участвует в розыгрыше', reasonRu: `${gk.player?.nameRu ?? 'Вратарь'} — роль «${gk.role.nameRu}» (${gk.focus.nameRu}). «Вратарь-распасовщик» даёт лишний вариант паса.`, severity: 40 });
    const runners = e.slots.filter((s) => s.v.runs >= 0.6).length;
    if (runners >= 5) out.push({ titleRu: `Слишком много забегающих (${runners})`, reasonRu: 'Все бегут вперёд — некому открываться под пас в ноги, мяч приходится отдавать длинным.', severity: 45 });
  }
  if ((cat === 'defence' || cat === 'all') && setup.defApproach === 'Aggressive') out.push({ titleRu: 'Агрессивный подход', reasonRu: 'Линия 91–100, защитники НЕ сопровождают забегания и ловят в офсайд, дополнительный расход выносливости.', severity: 45 });
  void bu;
  return out.sort((a, b) => b.severity - a.severity);
}

function optimizeRoles(s: Setup, obj: (e: Evaluation) => number, passes = 1, lockSlots?: Set<string>): Setup {
  let best = s, bestV = obj(evaluate(s));
  const f = getFormation(s.formationId);
  for (let p = 0; p < passes; p++) {
    for (const slot of f.slots) {
      if (lockSlots?.has(slot.id)) continue;
      for (const r of rolesForPos(slot.pos)) for (const fo of focusesFor(r, slot.pos)) {
        const a = best.slots[slot.id];
        if (a.roleId === r.id && a.focus === fo) continue;
        const cand: Setup = { ...best, slots: { ...best.slots, [slot.id]: { ...a, roleId: r.id, focus: fo } } };
        const v = obj(evaluate(cand));
        if (v > bestV + 0.05) { best = cand; bestV = v; }
      }
    }
  }
  return best;
}
function optimizeTactics(s: Setup, obj: (e: Evaluation) => number): Setup {
  let best = s, bestV = obj(evaluate(s));
  for (const b of BUILDUPS) for (const a of APPROACHES) for (const lh of [a.lineDefault, Math.round((a.lineMin + a.lineDefault) / 2), Math.round((a.lineMax + a.lineDefault) / 2)]) {
    const cand = { ...best, buildUp: b.id, defApproach: a.id, lineHeight: lh };
    const v = obj(evaluate(cand));
    if (v > bestV + 0.05) { best = cand; bestV = v; }
  }
  return best;
}
type SwapLog = { slot: string; outId: string | null; inId: string }[];
function optimizeSwaps(s: Setup, obj: (e: Evaluation) => number, maxSwaps = 3, log: SwapLog = []): Setup {
  let best = s, bestV = obj(evaluate(s));
  for (let k = 0; k < maxSwaps; k++) {
    let roundBest: Setup | null = null, roundV = bestV + 0.5, roundLog: SwapLog[number] | null = null;
    const f = getFormation(best.formationId);
    for (const slot of f.slots) for (const p of bench(best)) {
      if (posFamiliarity(p, slot.pos) === 'oop' || (slot.pos === 'GK') !== profile(p).isGK) continue;
      const cand = applyPatch(best, { swaps: [{ slot: slot.id, playerId: p.id }] });
      const v = obj(evaluate(cand));
      if (v > roundV) { roundV = v; roundBest = cand; roundLog = { slot: slot.id, outId: best.slots[slot.id].playerId, inId: p.id }; }
    }
    if (!roundBest) break;
    best = roundBest; bestV = roundV; log.push(roundLog!);
  }
  return best;
}

/** После смены схемы: игроков не на своей позиции меняем на лучших подходящих из запаса (если такие есть). */
function fixOutOfPosition(s: Setup, obj: (e: Evaluation) => number, log: SwapLog): Setup {
  let cur = s;
  const f = getFormation(s.formationId);
  for (const slot of f.slots) {
    const p = getPlayer(cur.slots[slot.id].playerId);
    if (p && posFamiliarity(p, slot.pos) !== 'oop') continue;
    let best: Setup | null = null, bestV = -1e9, bestIn = '';
    for (const b of bench(cur)) {
      if (posFamiliarity(b, slot.pos) !== 'natural' || (slot.pos === 'GK') !== profile(b).isGK) continue;
      const c = applyPatch(cur, { swaps: [{ slot: slot.id, playerId: b.id }] });
      const v = obj(evaluate(c));
      if (v > bestV) { bestV = v; best = c; bestIn = b.id; }
    }
    if (best) { log.push({ slot: slot.id, outId: p?.id ?? null, inId: bestIn }); cur = best; }
  }
  return cur;
}

export function findAlternative(setup: Setup, cat: Category, swapLog: SwapLog = []): Setup {
  const e0 = evaluate(setup);
  const r0 = e0.rating;
  // штраф, если общий рейтинг сильно падает (чтобы не «чинить» одно, ломая всё)
  const obj = (e: Evaluation) => objective(cat, e) - 1.5 * Math.max(0, r0 - e.rating - 2);
  const pool = FORMATIONS.map((f) => {
    const log: SwapLog = [];
    const s1 = f.id === setup.formationId ? setup : fixOutOfPosition(changeFormation(setup, f.id), obj, log);
    const s2 = optimizeRoles(s1, obj, 1);
    return { s: s2, v: obj(evaluate(s2)), log };
  }).sort((a, b) => b.v - a.v);
  // берём текущую схему + топ-3 и доводим
  const finalists = [pool.find((x) => x.s.formationId === setup.formationId)!, ...pool.filter((x) => x.s.formationId !== setup.formationId).slice(0, 3)];
  let best = setup, bestV = obj(e0);
  for (const f of finalists) {
    let s = optimizeTactics(f.s, obj);
    const log: SwapLog = [...f.log];
    s = optimizeSwaps(s, obj, 3, log);
    s = optimizeRoles(s, obj, 2);
    s = optimizeTactics(s, obj);
    const v = obj(evaluate(s));
    // смена схемы должна давать заметный выигрыш (иначе оставляем привычную)
    const margin = s.formationId === setup.formationId ? 0 : 5;
    if (v > bestV + margin) { best = s; bestV = v; swapLog.length = 0; swapLog.push(...log); }
  }
  return best;
}

const fmtTop = (a: Evaluation, b: Evaluation) => {
  const all = [...a.attack, ...a.defence].map((c) => {
    const c2 = [...b.attack, ...b.defence].find((x) => x.id === c.id)!;
    const good = c.group === 'defence' ? c.value - c2.value : c2.value - c.value; // b relative to a (positive = b better)
    return { n: c.nameRu, d: c2.value - c.value, good };
  }).filter((x) => Math.abs(x.d) >= 2).sort((x, y) => Math.abs(y.good) - Math.abs(x.good)).slice(0, 3);
  return all.map((x) => `${x.n} ${x.d > 0 ? '+' : ''}${x.d}`).join(', ');
};

/** Список изменений между исходной и альтернативной тактикой + вклад каждого (откат по одному). */
export function explainChanges(orig: Setup, alt: Setup, cat: Category, swapLog: SwapLog = []): Change[] {
  const eAlt = evaluate(alt);
  const vAlt = objective(cat, eAlt);
  const changes: Change[] = [];
  const contrib = (reverted: Setup) => { const e = evaluate(reverted); return { c: Math.round((vAlt - objective(cat, e)) * 10) / 10, top: fmtTop(e, eAlt) }; };
  if (alt.formationId !== orig.formationId) {
    // откат схемы: та же альтернатива, но в старой схеме (игроки/роли переносятся автоматически)
    const rev = { ...changeFormation(alt, orig.formationId), buildUp: alt.buildUp, defApproach: alt.defApproach, lineHeight: alt.lineHeight };
    const r = contrib(rev);
    changes.push({ kind: 'formation', titleRu: `Схема: ${getFormation(orig.formationId).name} → ${getFormation(alt.formationId).name}`, reasonRu: getFormation(alt.formationId).note || 'Другая структура: другое число игроков сзади/в центре/на флангах.', contribution: r.c, topEffectsRu: r.top });
  }
  if (alt.buildUp !== orig.buildUp) {
    const r = contrib({ ...alt, buildUp: orig.buildUp });
    changes.push({ kind: 'tactic', titleRu: `Стиль розыгрыша: ${getBuildUp(orig.buildUp).nameRu} → ${getBuildUp(alt.buildUp).nameRu}`, reasonRu: getBuildUp(alt.buildUp).descRu, contribution: r.c, topEffectsRu: r.top });
  }
  if (alt.defApproach !== orig.defApproach || alt.lineHeight !== orig.lineHeight) {
    const ap = getApproach(orig.defApproach);
    const lh = Math.max(ap.lineMin, Math.min(ap.lineMax, orig.lineHeight));
    const r = contrib({ ...alt, defApproach: orig.defApproach, lineHeight: lh });
    const a2 = getApproach(alt.defApproach);
    changes.push({ kind: 'tactic', titleRu: `Оборона: ${ap.nameRu} ${orig.lineHeight} → ${a2.nameRu} ${alt.lineHeight}`, reasonRu: `Сопровождение забеганий: ${a2.runTracking.toLowerCase()}; давление: ${a2.pressure.toLowerCase()}.`, contribution: r.c, topEffectsRu: r.top });
  }
  // игроки: где были в оригинале
  const origByPlayer = new Map<string, SlotAssign & { slot: string }>();
  for (const [k, a] of Object.entries(orig.slots)) if (a.playerId) origByPlayer.set(a.playerId, { ...a, slot: k });
  const fAlt = getFormation(alt.formationId), fOrig = getFormation(orig.formationId);
  for (const slot of fAlt.slots) {
    const a = alt.slots[slot.id];
    const p = getPlayer(a.playerId);
    if (!p) continue;
    const o = origByPlayer.get(p.id);
    const role = getRole(a.roleId)!; const fo = role.focuses.find((x) => x.id === a.focus)!;
    if (!o) {
      // замена: кто стоял на этом месте (по позиции)
      const replaced = Object.values(orig.slots).map((x) => x.playerId).filter((id) => id && !Object.values(alt.slots).some((y) => y.playerId === id));
      const logged = swapLog.find((l) => l.inId === p.id);
      const outId = (logged?.outId && replaced.includes(logged.outId) ? logged.outId : null) ?? replaced.find((id) => { const op = getPlayer(id)!; return posFamiliarity(op, slot.pos) !== 'oop'; }) ?? replaced[0];
      const rev = outId ? applyPatch(alt, { swaps: [{ slot: slot.id, playerId: outId }] }) : alt;
      const r = contrib(rev);
      const pr = profile(p), op = outId ? profile(getPlayer(outId)!) : undefined;
      changes.push({ kind: 'swap', titleRu: `${p.nameRu} вместо ${outId ? getPlayer(outId)!.nameRu : '—'} (${slot.pos}, ${role.nameRu}/${fo.nameRu})`,
        reasonRu: op ? `Скорость ${Math.round(op.pace)}→${Math.round(pr.pace)}, выносливость ${Math.round(op.stamina)}→${Math.round(pr.stamina)}, оборона ${Math.round(op.defending)}→${Math.round(pr.defending)}, воздух ${Math.round(op.aerial)}→${Math.round(pr.aerial)}.` : '', contribution: r.c, topEffectsRu: r.top });
      continue;
    }
    const oPos = fOrig.slots.find((s) => s.id === o.slot)?.pos;
    if (o.roleId !== a.roleId || o.focus !== a.focus) {
      const valid = isRoleValid(slot.pos, o.roleId, o.focus);
      const rev = valid ? applyPatch(alt, { roles: [{ slot: slot.id, roleId: o.roleId, focus: o.focus }] }) : alt;
      const r = valid ? contrib(rev) : { c: 0, top: '' };
      const or = getRole(o.roleId)!; const ofo = or.focuses.find((x) => x.id === o.focus)!;
      changes.push({ kind: 'role', titleRu: `${p.nameRu}${oPos && oPos !== slot.pos ? ` (${oPos}→${slot.pos})` : ''}: ${or.nameRu}/${ofo.nameRu} → ${role.nameRu}/${fo.nameRu}`, reasonRu: fo.descRu + (valid ? '' : ' (новая позиция в схеме — старая роль здесь недоступна).'), contribution: r.c, topEffectsRu: r.top });
    }
  }
  return changes.sort((a, b) => b.contribution - a.contribution);
}

export function diagnose(setup: Setup, cat: Category): Diagnosis {
  const before = evaluate(setup);
  const log: SwapLog = [];
  const alt = findAlternative(setup, cat, log);
  const after = evaluate(alt);
  const ob = objective(cat, before), oa = objective(cat, after);
  return { category: cat, issues: issues(cat, before, setup), changes: alt === setup ? [] : explainChanges(setup, alt, cat, log), alternative: alt, before, after,
    objectiveBefore: Math.round(ob), objectiveAfter: Math.round(oa), objectiveRu: OBJECTIVE_RU[cat], improved: oa > ob + 0.5 };
}
