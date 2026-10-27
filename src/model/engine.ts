/**
 * Эвристическая модель (НЕ игровой движок EA). Все формулы открыты и настраиваемы.
 * Рейтинг опасности НЕ использует OVR: только структуру, роли/фокусы, расстановку, тактику,
 * скорость/выносливость/рост/сопутствующие атрибуты, PlayStyles и сочетания ролей.
 */
import type { Setup, Player, Role, Focus, RoleVector, Slot, Pos } from './types';
import { getFormation, getPlayer, getRole, getApproach, getBuildUp } from './data';
import { profile, Profile, clamp, familiarity, Familiarity, FAM_MULT, roleFit, has } from './profile';

export interface SlotEval {
  slot: Slot; player?: Player; role: Role; focus: Focus; v: RoleVector; q: number; fam: Familiarity; fit: number;
  pr?: Profile; posIn: { x: number; y: number }; posOut: { x: number; y: number }; side: 'L' | 'C' | 'R';
}
export interface Component { id: string; nameRu: string; value: number; weight: number; reasonRu: string; group: 'attack' | 'defence' }
export interface Evaluation {
  slots: SlotEval[];
  attack: Component[]; defence: Component[];
  attackScore: number; defRisk: number; rating: number;
  spider: { attack: number; defence: number; buildUp: number; width: number; length: number; endurance: number };
  risks: Record<string, number>;
  raw: Record<string, number>;
  extras: { restCount: number; restLanes: string[]; counterPress: number; avgEnergy75: number; emptySlots: number };
  synergies: { textRu: string; delta: number }[];
  tags: string[];
}

const ATT_POS: Pos[] = ['ST', 'LW', 'RW', 'CAM', 'LM', 'RM'];
const isFB = (p: Pos) => p === 'LB' || p === 'RB' || p === 'LWB' || p === 'RWB';
const r1 = (n: number) => Math.round(n);
const nm = (s?: SlotEval) => (s?.player ? s.player.nameRu : '—');

export function slotEvals(setup: Setup): SlotEval[] {
  const f = getFormation(setup.formationId);
  const ap = getApproach(setup.defApproach);
  const bu = getBuildUp(setup.buildUp);
  const block = (setup.lineHeight - 50) / 100;
  const out: SlotEval[] = f.slots.map((slot) => {
    const a = setup.slots[slot.id];
    const role = (a && getRole(a.roleId)) || getRole('defender')!;
    const focus = role.focuses.find((x) => x.id === a?.focus) ?? role.focuses[0];
    const v = focus.v;
    const player = getPlayer(a?.playerId ?? null);
    const fam: Familiarity = player ? familiarity(player, slot.pos, role) : 'oop';
    const fit = player ? roleFit(player, role) : 40;
    let q = player ? clamp((0.7 + 0.3 * fit / 100) * FAM_MULT[fam], 0, 1.15) : 0.35;
    if (player && (slot.pos === 'GK') !== profile(player).isGK) q *= 0.3;
    const k = slot.pos === 'GK' ? 0 : slot.y < 0.26 ? 0.3 : slot.y < 0.5 ? 0.24 : 0.14;
    const yOut = clamp(slot.y + block * k + (slot.pos !== 'GK' ? v.press * 0.02 * (ap.pressBonus + 0.5) : 0), 0.02, 0.9);
    let xIn = slot.x + (0.5 - slot.x) * v.inward;
    if (v.wide > 0 && Math.abs(slot.x - 0.5) > 0.02) {
      const edge = slot.x < 0.5 ? 0.05 : 0.95;
      xIn = xIn + (edge - xIn) * v.wide * 0.75;
    }
    const runShift = ATT_POS.includes(slot.pos) || v.att > 0.6 ? (bu.forwardRuns - 0.55) * 0.08 : (bu.forwardRuns - 0.55) * 0.03;
    const yIn = slot.pos === 'GK' ? 0.04 + v.sweep * 0.04 : clamp(slot.y + block * k * 0.8 + v.adv + runShift + 0.04, 0.03, 0.95);
    const side: 'L' | 'C' | 'R' = slot.x < 0.36 ? 'L' : slot.x > 0.64 ? 'R' : 'C';
    return { slot, player, role, focus, v, q, fam, fit, pr: player ? profile(player) : undefined, posIn: { x: xIn, y: yIn }, posOut: { x: slot.x, y: yOut }, side };
  });
  // Centre-Half drops between CBs: CBs split wider in possession
  if (out.some((s) => s.v.dropBack > 0.5)) {
    for (const s of out) if (s.slot.pos === 'CB') s.posIn.x = s.slot.x < 0.5 ? Math.max(0.18, s.posIn.x - 0.1) : s.slot.x > 0.5 ? Math.min(0.82, s.posIn.x + 0.1) : s.posIn.x;
    for (const s of out) if (s.v.dropBack > 0.5) s.posIn = { x: 0.5, y: Math.max(0.12, s.posIn.y) };
  }
  return out;
}

/** Энергия игрока (0..100) на минуте m. Подробности — subs.ts; здесь простая версия для рейтинга. */
export function drainPerMin(s: SlotEval, setup: Setup): number {
  if (!s.player || s.slot.pos === 'GK') return 0.05;
  const ap = getApproach(setup.defApproach);
  const pr = s.pr!;
  const relentless = has(s.player, 'Relentless');
  const intensity = 0.55 + 0.75 * s.v.stam + 0.25 * s.v.press * (ap.pressBonus * 2);
  const buMult = setup.buildUp === 'Counter' ? 1.04 : setup.buildUp === 'Short' ? 0.97 : 1;
  return 0.6 * intensity * ap.staminaMult * buMult * (1.38 - 0.72 * pr.stamina / 100) * (relentless === 2 ? 0.85 : relentless ? 0.92 : 1);
}
export function energyAt(s: SlotEval, setup: Setup, minute: number): number {
  const d = drainPerMin(s, setup);
  const relentless = s.player ? has(s.player, 'Relentless') : 0;
  const ht = 7 + relentless * 2;
  if (minute <= 45) return clamp(100 - d * minute);
  return clamp(Math.min(100, 100 - d * 45 + ht) - d * (minute - 45));
}

export function evaluate(setup: Setup): Evaluation {
  const S = slotEvals(setup);
  const ap = getApproach(setup.defApproach);
  const bu = getBuildUp(setup.buildUp);
  const field = S.filter((s) => s.slot.pos !== 'GK');
  const gk = S.find((s) => s.slot.pos === 'GK')!;
  const cbs = field.filter((s) => s.slot.pos === 'CB');
  const backThree = cbs.length >= 3;
  const LH = setup.lineHeight;
  const risks: Record<string, number> = {};
  const reasons: Record<string, string> = {};

  // 1) Rest defence — кто остаётся сзади, когда команда владеет мячом
  const restPlayers = field.filter((s) => s.posIn.y < 0.56);
  const restCount = restPlayers.reduce((sum, s) => sum + s.v.def * (1 - 0.45 * s.v.roam) * Math.min(1, s.q + 0.1), 0);
  const lanes = new Set(restPlayers.filter((s) => s.v.def > 0.5).map((s) => (s.posIn.x < 0.3 ? 'L' : s.posIn.x > 0.7 ? 'R' : 'C')));
  const laneMiss = (['L', 'C', 'R'] as const).filter((l) => !lanes.has(l));
  risks.rest = clamp(100 * (4.9 - restCount) / 3.2 + laneMiss.length * 8);
  reasons.rest = `С мячом сзади остаётся ≈${restCount.toFixed(1)} «оборонительных» игрока (ориентир 4.5–5: 2+3 или 3+2)` + (laneMiss.length ? `; не прикрыты коридоры: ${laneMiss.map((l) => (l === 'L' ? 'левый' : l === 'R' ? 'правый' : 'центр')).join(', ')}` : '') + '.';

  // 2) Пространство за линией обороны
  const backLine = field.filter((s) => s.slot.pos === 'CB' || (isFB(s.slot.pos) && s.v.def >= 0.7));
  const recs = backLine.map((s) => (s.pr ? s.pr.recovery : 55)).sort((a, b) => a - b);
  const recPace = recs.length ? (recs[0] + (recs[1] ?? recs[0])) / 2 : 55;
  const sweep = gk.player ? gk.v.sweep * (gk.pr!.gkSweep / 100) : 0;
  const stepOut = cbs.reduce((m, s) => Math.max(m, s.v.stepOut), 0);
  risks.behind = clamp(100 * Math.pow(LH / 100, 1.3) * clamp((96 - recPace) / 36, 0.05, 1) * (1.2 - 0.35 * ap.trackRuns) * (1 - 0.3 * sweep) * (1 + 0.15 * stepOut) * 1.15);
  const slowCB = backLine.filter((s) => s.pr).sort((a, b) => a.pr!.recovery - b.pr!.recovery)[0];
  reasons.behind = `Линия ${LH} (${ap.nameRu}): ${ap.runTracking.toLowerCase()}. Самый медленный в линии — ${nm(slowCB)} (скорость возврата ≈${r1(slowCB?.pr?.recovery ?? 0)}).` + (sweep > 0.35 ? ` Вратарь-чистильщик частично страхует.` : '') + (stepOut > 0.6 ? ' ЦЗ выходят из линии (Стоппер/Агрессия) — за ними пусто.' : '');

  // 3) Фланги
  const sideFlank = (side: 'L' | 'R') => {
    const wideSlotPos = side === 'L' ? ['LB', 'LWB'] : ['RB', 'RWB'];
    let fb = field.find((s) => wideSlotPos.includes(s.slot.pos));
    if (!fb && backThree) fb = field.find((s) => (side === 'L' ? s.slot.pos === 'LM' : s.slot.pos === 'RM'));
    const absent = fb ? clamp(0.25 * (1 - fb.v.def) + 1.45 * fb.v.adv + 0.55 * fb.v.inward, 0, 1) : 1;
    const wingers = field.filter((s) => s !== fb && s.side === side && s.slot.y > 0.4);
    const track = wingers.reduce((m, s) => Math.max(m, s.v.def * s.q), 0);
    const coverers = field.filter((s) => s !== fb && (s.side === side || s.slot.x === 0.5) && s.slot.y < 0.45 && s.v.wide > 0);
    let cover = clamp(coverers.reduce((m, s) => m + s.v.wide * s.v.def * 0.9, 0), 0, 1);
    if (backThree) cover = clamp(cover + 0.2, 0, 1);
    const fbRec = fb?.pr ? fb.pr.recovery : 60;
    const appr = { Deep: 0.7, Balanced: 0.85, High: 1, Aggressive: 1.1 }[setup.defApproach];
    const risk = clamp(100 * (0.12 + 0.88 * absent) * (1 - 0.5 * track) * (1 - 0.55 * cover) * (0.55 + clamp((94 - fbRec) / 40, 0, 0.6)) * appr);
    const why = `${fb ? `${nm(fb)} (${fb.role.nameRu}, ${fb.focus.nameRu})` : 'Нет крайнего защитника'} ` +
      (absent > 0.6 ? 'с мячом уходит высоко/в центр — фланг пустеет' : absent > 0.35 ? 'регулярно подключается' : 'в основном остаётся сзади') +
      `; возврат вингеров: ${track > 0.55 ? 'хороший' : track > 0.35 ? 'частичный' : 'слабый'} (${wingers.map(nm).join(', ') || 'никого'})` +
      `; страховка: ${cover > 0.45 ? 'есть' : cover > 0.15 ? 'частичная' : 'нет'}; скорость возврата фланга ≈${r1(fbRec)}.`;
    return { risk, why, fb, track, cover, absent };
  };
  const fl = sideFlank('L'), fr = sideFlank('R');
  risks.flankL = fl.risk; reasons.flankL = fl.why;
  risks.flankR = fr.risk; reasons.flankR = fr.why;

  // 4) Полуфланги (канал между ЦЗ и крайним)
  const hs = (side: 'L' | 'R', f: typeof fl) => {
    const cb = cbs.filter((s) => (side === 'L' ? s.slot.x < 0.5 : s.slot.x > 0.5)).sort((a, b) => (side === 'L' ? a.slot.x - b.slot.x : b.slot.x - a.slot.x))[0];
    const screens = field.filter((s) => ['CDM', 'CM'].includes(s.slot.pos) && (side === 'L' ? s.slot.x <= 0.5 : s.slot.x >= 0.5));
    const screen = clamp(screens.reduce((m, s) => m + s.v.screen * s.q, 0) / (screens.length ? 1 : 1), 0, 1);
    const cbOut = cb ? cb.v.stepOut : 0.3;
    const fbInside = f.fb ? f.fb.v.inward : 0;
    let risk = 100 * clamp(0.42 * cbOut + 0.45 * f.absent * (1 - fbInside) + 0.35 * (1 - screen) - (backThree ? 0.12 : 0), 0, 1);
    risk = clamp(risk * (0.75 + LH / 200));
    const why = `${cb ? `${nm(cb)}: выход из линии ${cbOut > 0.6 ? 'частый' : cbOut > 0.25 ? 'умеренный' : 'редкий'}` : 'нет ЦЗ на этой стороне'}; прикрытие опорниками этой стороны ${screen > 0.6 ? 'хорошее' : screen > 0.3 ? 'среднее' : 'слабое'}` + (f.absent > 0.6 && fbInside < 0.3 ? '; крайний высоко — канал между ним и ЦЗ открыт.' : '.');
    return { risk, why };
  };
  const hl = hs('L', fl), hr = hs('R', fr);
  risks.halfL = hl.risk; reasons.halfL = hl.why; risks.halfR = hr.risk; reasons.halfR = hr.why;

  // 5) Зона 14 (между линиями)
  const mids = field.filter((s) => ['CDM', 'CM'].includes(s.slot.pos) || s.v.screen > 0.2);
  const screenTot = mids.reduce((m, s) => m + s.v.screen * s.q, 0) + 0.25 * cbs.reduce((m, s) => m + s.v.stepOut, 0) / Math.max(1, cbs.length);
  const midAdv = mids.length ? mids.reduce((m, s) => m + Math.max(0, s.v.adv), 0) / mids.length : 0.3;
  risks.z14 = clamp(100 * (1.55 - screenTot) / 1.55 + midAdv * 60 + (LH > 75 ? 6 : 0));
  reasons.z14 = `Суммарное прикрытие зоны перед защитой ≈${screenTot.toFixed(2)} (ориентир ≥1.3)` + (mids.length ? `: ${mids.filter((s) => s.v.screen > 0.2).map((s) => `${nm(s)} (${s.role.nameRu})`).join(', ') || 'нет чистых опорников'}` : '') + (midAdv > 0.15 ? '; центральные хавы часто уходят вперёд.' : '.');

  // 6) Воздух/стандарты
  const airGuys = field.filter((s) => s.pr && (s.slot.pos === 'CB' || s.slot.pos === 'CDM' || isFB(s.slot.pos)));
  const aw = (s: SlotEval) => (s.slot.pos === 'CB' ? 1 : 0.5);
  const aerial = airGuys.length ? airGuys.reduce((m, s) => m + s.pr!.aerial * aw(s), 0) / airGuys.reduce((m, s) => m + aw(s), 0) : 60;
  const tall = field.filter((s) => s.player && s.player.heightCm >= 186).length;
  risks.aerial = clamp((86 - aerial) / 24 * 100 - tall * 4);
  reasons.aerial = `Средняя «воздушная» сила ЦЗ (вес 1) + крайних и опорников (вес 0.5) ≈${r1(aerial)} (рост, игра головой, прыжок, сила, Aerial Fortress); игроков ≥186 см в поле: ${tall}.`;

  // 7) Контрпрессинг (насколько легко сопернику вообще начать контратаку)
  const front = field.filter((s) => s.posIn.y > 0.55);
  const counterPress = front.reduce((m, s) => m + s.v.press * (s.pr ? (0.6 + 0.4 * s.pr.stamina / 100) : 0.5) * s.q, 0) + ap.pressBonus * 3 + (setup.buildUp === 'Short' ? 0.4 : 0);
  risks.cpress = clamp(100 * (3.4 - counterPress) / 3.4);
  reasons.cpress = `Давление сразу после потери ≈${counterPress.toFixed(1)}: игроков впереди с прессингом — ${front.filter((s) => s.v.press >= 0.5).length}; подход «${ap.nameRu}» (давление: ${ap.pressure.toLowerCase()}).`;

  // 8) Усталость (поздний матч)
  const e75 = field.filter((s) => s.player).map((s) => ({ s, e: energyAt(s, setup, 75) }));
  const avgEnergy75 = e75.length ? e75.reduce((m, x) => m + x.e, 0) / e75.length : 60;
  const tiredKey = e75.filter((x) => x.e < 58 && (x.s.v.def > 0.6 || x.s.v.press > 0.6));
  risks.fatigue = clamp(((80 - avgEnergy75) * 3 + tiredKey.length * 7) * (setup.matchMode === 'competitive' ? 0.85 : 1));
  reasons.fatigue = `Средняя энергия к 75' ≈${r1(avgEnergy75)}%` + (tiredKey.length ? `; к 75' «сядут»: ${tiredKey.map((x) => nm(x.s)).join(', ')}` : '') + ` (подход ${ap.nameRu}: ×${ap.staminaMult} к расходу).` + (setup.matchMode === 'competitive' ? ' В Competitive игрок под твоим управлением не замедляется от усталости, остальные — устают (риск ×0.85).' : '');

  // 9) Низкий блок: соперник живёт у нашей штрафной (навесы, удары, давление)
  risks.deep = clamp((60 - LH) * 1.6 + (setup.defApproach === 'Deep' ? 8 : 0) + Math.max(0, risks.aerial - 40) * 0.3);
  reasons.deep = LH < 45 ? `Линия ${LH}: блок стоит низко — соперник долго владеет мячом у твоей штрафной, больше навесов и ударов; свои атаки начинаются далеко от ворот.` : `Линия ${LH}: блок достаточно высоко, соперник редко «живёт» у твоей штрафной.`;

  const DEF_W: [string, string, number][] = [
    ['rest', 'Страховка при владении (rest defence)', 0.18], ['behind', 'Пространство за линией vs скорость ЦЗ', 0.18],
    ['flankL', 'Левый фланг в переходе', 0.11], ['flankR', 'Правый фланг в переходе', 0.11], ['halfL', 'Левый полуфланг', 0.06], ['halfR', 'Правый полуфланг', 0.06],
    ['z14', 'Зона между линиями (зона 14)', 0.12], ['aerial', 'Воздух и стандарты', 0.06], ['cpress', 'Контрпрессинг после потери', 0.07], ['fatigue', 'Усталость к концу матча', 0.05], ['deep', 'Давление на свою штрафную (низкий блок)', 0.08],
  ];
  const defence: Component[] = DEF_W.map(([id, n, w]) => ({ id, nameRu: n, value: r1(risks[id]), weight: w, reasonRu: reasons[id], group: 'defence' }));
  const defRisk = clamp(defence.reduce((m, c) => m + c.value * c.weight, 0) / defence.reduce((m, c) => m + c.weight, 0));

  // ---------- Атака ----------
  const sat = (raw: number, ref: number) => 100 * (1 - Math.exp(-1.2 * raw / ref));
  const pace = (s: SlotEval) => (s.pr ? s.pr.pace : 50);
  const runnersArr = field.map((s) => ({ s, v: s.v.runs * s.q * Math.pow(pace(s) / 90, 1.6) * (1 + 0.05 * (s.player ? has(s.player, 'Rapid') + has(s.player, 'Quick Step') : 0)) })).sort((a, b) => b.v - a.v);
  const runRaw = runnersArr.slice(0, 3).reduce((m, x) => m + x.v, 0) * (0.75 + 0.45 * bu.forwardRuns);
  const runScore = sat(runRaw, 1.9);
  const boxSum = field.reduce((m, s) => m + s.v.box * s.q, 0);
  const boxScore = clamp(sat(boxSum, 2.9) - Math.max(0, boxSum - 3.8) * 20);
  const creators = field.filter((s) => s.posIn.y > 0.4);
  const createSum = creators.reduce((m, s) => m + s.v.create * s.q * ((s.pr?.passing ?? 50) / 85), 0);
  const createScore = sat(createSum, 3.6);
  const fwdNum = field.filter((s) => s.posIn.y > 0.6).reduce((m, s) => m + s.v.att * s.q, 0);
  const supportScore = sat(fwdNum, 3.4);
  const widthSide = (side: 'L' | 'R') => field.filter((s) => (side === 'L' ? s.posIn.x < 0.17 : s.posIn.x > 0.83) && s.posIn.y > 0.42).reduce((m, s) => Math.max(m, s.v.att * s.q), 0);
  const wL = widthSide('L'), wR = widthSide('R');
  const widthScore = clamp((Math.min(1, wL / 0.6) + Math.min(1, wR / 0.6)) * 50);
  const deep = S.filter((s) => s.posIn.y < 0.5);
  const firstPhase = deep.reduce((m, s) => m + s.v.create * s.q * ((s.pr ? (s.slot.pos === 'GK' ? s.pr.gkPass : (s.pr.passing + s.pr.pressRes) / 2) : 50) / 80), 0);
  const pressProof = field.filter((s) => s.posIn.y < 0.6 && s.player).reduce((m, s) => m + (has(s.player!, 'Press Proven') + has(s.player!, 'Tiki Taka') * 0.6 + has(s.player!, 'Technical') * 0.4 + has(s.player!, 'First Touch') * 0.4) * 0.12, 0);
  const buildScore = clamp(sat(firstPhase, 2.6) * 0.72 + bu.shortOptions * 20 + Math.min(12, pressProof * 6));
  const outlets = field.filter((s) => s.posOut.y > 0.45).map((s) => s.v.runs * Math.pow(pace(s) / 88, 2) * s.q).sort((a, b) => b - a);
  const passersDeep = field.filter((s) => s.posOut.y <= 0.5 && s.pr).map((s) => (s.pr!.passing / 85) * (0.5 + s.v.create * 0.5) + 0.06 * (has(s.player!, 'Incisive Pass') + has(s.player!, 'Pinged Pass') + has(s.player!, 'Long Ball Pass'))).sort((a, b) => b - a);
  const outRaw = ((outlets[0] ?? 0) + (outlets[1] ?? 0) * 0.7 + (outlets[2] ?? 0) * 0.3) * (0.55 + 0.7 * bu.forwardRuns);
  const counterScore = clamp(sat(outRaw, 1.7) * 0.75 + (passersDeep[0] ?? 0.5) * 25 - (setup.defApproach === 'Aggressive' ? 6 : 0) + (setup.defApproach === 'Deep' ? 6 : 0));
  const finishers = field.map((s) => s.v.box * s.q * ((s.pr?.finishing ?? 40) / 85)).sort((a, b) => b - a);
  const finishScore = sat(finishers[0] + (finishers[1] ?? 0) * 0.7 + (finishers[2] ?? 0) * 0.4, 1.9);

  // Сочетания ролей
  const syn: { textRu: string; delta: number }[] = [];
  const bySide = (side: 'L' | 'R') => field.filter((s) => s.side === side);
  for (const side of ['L', 'R'] as const) {
    const sideName = side === 'L' ? 'слева' : 'справа';
    const fbx = side === 'L' ? fl.fb : fr.fb;
    const wing = bySide(side).filter((s) => s !== fbx && s.slot.y > 0.42).sort((a, b) => b.slot.y - a.slot.y)[0];
    if (fbx && wing) {
      const fbWide = fbx.v.wide > 0.6 && fbx.v.adv > 0.25, wingIn = wing.v.inward > 0.3, wingWide = wing.v.wide > 0.6;
      if (fbWide && wingIn) syn.push({ textRu: `${sideName}: ${nm(fbx)} даёт ширину, ${nm(wing)} режет внутрь — классическая связка (+)`, delta: 5 });
      if (fbWide && wingWide) syn.push({ textRu: `${sideName}: и ${nm(fbx)}, и ${nm(wing)} держат бровку — тесно на фланге, пусто в полуфланге (−)`, delta: -4 });
      if (fbx.v.inward > 0.5 && wingWide) syn.push({ textRu: `${sideName}: ${nm(fbx)} уходит в центр, ${nm(wing)} держит ширину — баланс ширины и центра (+)`, delta: 4 });
      if (fbx.v.inward > 0.5 && wingIn) syn.push({ textRu: `${sideName}: и крайний защитник, и вингер уходят в центр — фланг никто не держит (−)`, delta: -5 });
    }
  }
  const st = field.filter((s) => s.slot.pos === 'ST');
  const f9 = st.find((s) => s.role.id === 'false_9');
  const ifs = field.filter((s) => s.role.id === 'inside_forward' || s.role.id === 'shadow_striker');
  if (f9 && ifs.length) syn.push({ textRu: `Ложная 9 (${nm(f9)}) уводит ЦЗ, ${ifs.map(nm).join(' и ')} забегают в освободившееся место (+)`, delta: 5 });
  if (f9 && !ifs.length && !field.some((s) => s.slot.pos === 'CAM' && s.v.runs > 0.4)) syn.push({ textRu: `Ложная 9 опускается, но в штрафную никто не врывается (−)`, delta: -5 });
  const tf = st.find((s) => s.role.id === 'target_forward');
  const crossers = field.filter((s) => s.v.wide > 0.6 && s.pr && s.pr.crossing > 75);
  if (tf && crossers.length) syn.push({ textRu: `Таргетмен ${nm(tf)} + навесы (${crossers.map(nm).join(', ')}) (+)`, delta: 4 });
  if (tf && !crossers.length) syn.push({ textRu: `Таргетмен без фланговых навесов — его сила не используется (−)`, delta: -3 });
  const playmakers = field.filter((s) => s.v.create >= 0.8 && s.v.roam >= 0.45);
  if (playmakers.length >= 2) syn.push({ textRu: `Два «свободных» плеймейкера (${playmakers.map(nm).join(', ')}) — пересекаются и оставляют центр (−)`, delta: -4 });
  const anchors = field.filter((s) => s.v.screen >= 0.7);
  const goers = field.filter((s) => ['CM', 'CDM'].includes(s.slot.pos) && s.v.att >= 0.6);
  if (anchors.length >= 1 && goers.length >= 1) syn.push({ textRu: `Опорник (${anchors.map(nm).join(', ')}) страхует, ${goers.map(nm).join(', ')} подключается — баланс центра (+)`, delta: 4 });
  if (!anchors.length) syn.push({ textRu: `Нет ни одного «якоря» в центре (экран ≥0.7) (−)`, delta: -5 });
  const pinged = field.filter((s) => s.posOut.y < 0.45 && s.player && (has(s.player, 'Pinged Pass') || has(s.player, 'Long Ball Pass') || has(s.player, 'Incisive Pass')));
  const rapid = field.filter((s) => s.v.runs > 0.55 && s.player && (has(s.player, 'Rapid') || has(s.player, 'Quick Step')));
  if (pinged.length && rapid.length) syn.push({ textRu: `PlayStyles: ${pinged.slice(0, 2).map(nm).join('/')} (длинный/разрезающий пас) → ${rapid.slice(0, 2).map(nm).join('/')} (Rapid/Quick Step) (+)`, delta: 4 });
  const synScore = clamp(50 + syn.reduce((m, x) => m + x.delta, 0) * 3);

  // Скученность (много игроков в одном секторе с мячом)
  const cells = new Map<string, number>();
  for (const s of field) { const k = `${Math.min(2, Math.floor(s.posIn.x * 3))}-${Math.min(3, Math.floor(s.posIn.y * 4))}`; cells.set(k, (cells.get(k) ?? 0) + 1); }
  const crowd = [...cells.values()].reduce((m, c) => m + Math.max(0, c - 3), 0);
  const spacingScore = clamp(100 - crowd * 18 - (wL < 0.2 ? 15 : 0) - (wR < 0.2 ? 15 : 0));

  const empty = S.filter((s) => !s.player).length;
  const famAvg = S.reduce((m, s) => m + FAM_MULT[s.fam], 0) / S.length;
  const ATT_W: [string, string, number, number, string][] = [
    ['runs', 'Забегания в спину', 0.15, runScore, `Лучшие: ${runnersArr.slice(0, 3).map((x) => nm(x.s)).join(', ')} (роль × скорость × PlayStyles); стиль «${bu.nameRu}».`],
    ['box', 'Присутствие в штрафной', 0.12, boxScore, `≈${boxSum.toFixed(1)} игрока регулярно в штрафной (ориентир 2.5–3.5).`],
    ['create', 'Созидание в финальной трети', 0.13, createScore, `Творческие роли впереди: ${creators.filter((s) => s.v.create >= 0.6).map(nm).join(', ') || 'нет'}.`],
    ['width', 'Ширина в атаке', 0.1, widthScore, `Ширину даёт: слева ${wL > 0.3 ? 'да' : 'никто'}, справа ${wR > 0.3 ? 'да' : 'никто'}.`],
    ['build', 'Розыгрыш и пресс-устойчивость', 0.14, buildScore, `Варианты в первой фазе (ГК, ЦЗ, опорники) + PlayStyles Press Proven/Tiki Taka/Technical; стиль «${bu.nameRu}».`],
    ['counter', 'Угроза контратаки', 0.13, counterScore, `Скорость адресатов и качество первого паса после отбора; стиль «${bu.nameRu}».`],
    ['finish', 'Завершение', 0.08, finishScore, `Кто приходит в штрафную и умеет бить (атрибуты удара + PlayStyles).`],
    ['synergy', 'Сочетания ролей', 0.08, synScore, syn.length ? syn.map((x) => x.textRu).join('; ') : 'Нет заметных связок или конфликтов.'],
    ['support', 'Игроков в атаке', 0.1, supportScore, `≈${fwdNum.toFixed(1)} «атакующих» игроков в финальной трети с мячом (ориентир 4–5).`],
    ['spacing', 'Расстановка (без скученности)', 0.07, spacingScore, crowd ? `Перегружены сектора: ${crowd} лишних игроков в одних зонах.` : 'Игроки распределены равномерно.'],
  ];
  const attack: Component[] = ATT_W.map(([id, n, w, val, why]) => ({ id, nameRu: n, value: r1(val), weight: w, reasonRu: why, group: 'attack' }));
  let attackScore = attack.reduce((m, c) => m + c.value * c.weight, 0) / attack.reduce((m, c) => m + c.weight, 0);
  const territory = 0.8 + 0.2 * Math.min(1.1, LH / 65);
  attackScore = clamp(attackScore * (0.85 + 0.15 * famAvg) * territory - empty * 6);
  const defRiskAdj = clamp(defRisk + empty * 6 + (1 - famAvg) * 40);
  const rating = r1(clamp(0.55 * attackScore + 0.45 * (100 - defRiskAdj)));

  const length = clamp(50 + (LH - 50) * 0.5 + (setup.buildUp === 'Counter' ? 12 : setup.buildUp === 'Short' ? -10 : 0) + runScore * 0.15 - 8);
  const endurance = clamp(avgEnergy75 * 1.2 - 10);
  const tags: string[] = [];
  if (setup.buildUp === 'Short' && buildScore > 65) tags.push('Тики-така / владение');
  if (setup.buildUp === 'Counter' || counterScore > 70) tags.push('Быстрые контратаки');
  if (setup.defApproach === 'Aggressive' || (setup.defApproach === 'High' && counterPress > 2.6)) tags.push('Высокий прессинг');
  if (setup.defApproach === 'Deep') tags.push('Низкий блок');
  if (widthScore > 80) tags.push('Игра в ширину');
  if (widthScore < 40) tags.push('Узкая атака через центр');
  if (boxScore > 80) tags.push('Много людей в штрафной');
  if (risks.rest > 55) tags.push('Мало страховки сзади');
  if (risks.behind > 50) tags.push('Уязвима за спиной');
  if (tf) tags.push('Игра на таргетмена');
  if (f9) tags.push('Ложная 9');
  if (field.some((s) => s.v.dropBack > 0.5)) tags.push('Опорник опускается в линию защиты (3 сзади)');
  if (field.filter((s) => isFB(s.slot.pos) && s.v.inward > 0.5).length) tags.push('Инвертированные крайние');

  return {
    slots: S, attack, defence, attackScore: r1(attackScore), defRisk: r1(defRiskAdj), rating,
    // риски округляем для показа (компоненты уже округлены)
    spider: { attack: r1(attackScore), defence: r1(100 - defRiskAdj), buildUp: r1(buildScore), width: r1(widthScore), length: r1(length), endurance: r1(endurance) },
    risks: Object.fromEntries(Object.entries(risks).map(([k, v]) => [k, r1(v)])), raw: { runRaw, boxSum, createSum, firstPhase, outRaw }, extras: { restCount, restLanes: [...lanes], counterPress, avgEnergy75, emptySlots: empty }, synergies: syn, tags,
  };
}

/** Распределение атаки/обороны по коридорам (для экрана «Сводка»). */
export function laneDistribution(ev: Evaluation) {
  const att = { L: 0, C: 0, R: 0 }, def = { L: 0, C: 0, R: 0 };
  for (const s of ev.slots) {
    if (s.slot.pos === 'GK') continue;
    const laneIn = s.posIn.x < 0.33 ? 'L' : s.posIn.x > 0.67 ? 'R' : 'C';
    const laneOut = s.posOut.x < 0.33 ? 'L' : s.posOut.x > 0.67 ? 'R' : 'C';
    att[laneIn] += s.v.att * s.q * (s.posIn.y > 0.5 ? 1 : 0.4);
    def[laneOut] += s.v.def * s.q;
  }
  const n = (o: { L: number; C: number; R: number }) => { const t = o.L + o.C + o.R || 1; return { L: Math.round((o.L / t) * 100), C: Math.round((o.C / t) * 100), R: Math.round((o.R / t) * 100) }; };
  return { attack: n(att), defence: n(def) };
}
