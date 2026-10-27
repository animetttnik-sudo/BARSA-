import type { Setup, Patch } from './types';
import { evaluate, energyAt, drainPerMin, SlotEval, Evaluation } from './engine';
import { applyPatch, bench } from './setup';
import { posFamiliarity, profile, has, FAM_RU, familiarity } from './profile';
import { getRole, APPROACHES, getApproach, getFormation } from './data';

export interface SubRec { minute: number; window: string; outId: string; outRu: string; inId: string; inRu: string; slot: string; energyAtSub: number; reasonRu: string; patch: Patch }
export interface TacticRec { window: string; situationRu: string; changeRu: string; reasonRu: string; patch?: Patch; deltaRu?: string }
export interface Curve { slot: string; nameRu: string; points: number[]; threshold: number }
export interface SubPlan { subs: SubRec[]; tactics: TacticRec[]; curves: Curve[]; noteRu: string }

const windowOf = (m: number) => (m <= 50 ? 'Перерыв / 46–55' : m <= 64 ? '55–65' : m <= 74 ? '65–75' : m <= 84 ? '75–85' : '85+');
export const thresholdFor = (s: SlotEval) => (s.v.stam >= 0.75 || s.v.press >= 0.7 || (s.v.runs >= 0.6 && (s.pr?.pace ?? 0) > 80) ? 64 : 56);

export function planSubs(setup: Setup): SubPlan {
  const ev = evaluate(setup);
  const field = ev.slots.filter((s) => s.player && s.slot.pos !== 'GK');
  const curves: Curve[] = field.map((s) => ({ slot: s.slot.id, nameRu: s.player!.nameRu, threshold: thresholdFor(s), points: Array.from({ length: 19 }, (_, i) => Math.round(energyAt(s, setup, i * 5))) }));
  // кандидаты на замену: минута, когда энергия падает ниже порога
  const needs = field.map((s) => {
    const th = thresholdFor(s);
    let minute = 0;
    for (let m = 46; m <= 90; m++) if (energyAt(s, setup, m) < th) { minute = m; break; }
    if (!minute && energyAt(s, setup, 45) < th + 4) minute = 46;
    return { s, th, minute };
  }).filter((x) => x.minute > 0).sort((a, b) => a.minute - b.minute);
  const used = new Set<string>();
  const subs: SubRec[] = [];
  let cur = setup;
  const windows = new Set<string>();
  for (const n of needs) {
    if (subs.length >= 5) break;
    let w = windowOf(n.minute);
    if (!windows.has(w) && [...windows].filter((x) => !x.startsWith('Перерыв')).length >= 3 && !w.startsWith('Перерыв')) w = [...windows].filter((x) => !x.startsWith('Перерыв')).slice(-1)[0];
    const cands = bench(cur).filter((p) => !used.has(p.id) && posFamiliarity(p, n.s.slot.pos) !== 'oop' && profile(p).isGK === false);
    if (!cands.length) continue;
    const scored = cands.map((p) => {
      const patch: Patch = { swaps: [{ slot: n.s.slot.id, playerId: p.id }] };
      const e = evaluate(applyPatch(cur, patch));
      // свежий игрок: модель энергии с 100% (учтено в fatigue риск через 75' — грубо), добавляем бонус свежести
      return { p, patch, e, score: e.rating + (profile(p).stamina - 60) * 0.05 };
    }).sort((a, b) => b.score - a.score);
    const best = scored[0];
    used.add(best.p.id);
    windows.add(w);
    const pr = n.s.pr!, inPr = profile(best.p);
    const rel = has(n.s.player!, 'Relentless');
    const fam = familiarity(best.p, n.s.slot.pos, n.s.role);
    subs.push({ minute: n.minute, window: w, outId: n.s.player!.id, outRu: n.s.player!.nameRu, inId: best.p.id, inRu: best.p.nameRu, slot: n.s.slot.id, energyAtSub: Math.round(energyAt(n.s, setup, n.minute)), patch: best.patch,
      reasonRu: `${n.s.player!.nameRu} к ${n.minute}' ≈${Math.round(energyAt(n.s, setup, n.minute))}% (порог для роли ${n.s.role.nameRu}/${n.s.focus.nameRu} — ${n.th}%): выносливость ${Math.round(pr.stamina)}${rel ? ' (Relentless)' : ''}, расход ≈${drainPerMin(n.s, setup).toFixed(2)}%/мин` +
        `${getApproach(setup.defApproach).staminaMult > 1 ? `, подход «${getApproach(setup.defApproach).nameRu}» тратит больше` : ''}. ` +
        `${best.p.nameRu}: ${FAM_RU[fam]}, скорость ${Math.round(inPr.pace)}, выносливость ${Math.round(inPr.stamina)}; рейтинг после замены ${best.e.rating}.` });
    cur = applyPatch(cur, best.patch);
  }
  subs.sort((a, b) => a.minute - b.minute);

  // Смена тактики по ходу матча
  const tactics: TacticRec[] = [];
  const ai = APPROACHES.findIndex((a) => a.id === setup.defApproach);
  const avg = (m: number) => field.reduce((x, s) => x + energyAt(s, setup, m), 0) / Math.max(1, field.length);
  const delta = (p: Patch, e0: Evaluation) => { const e = evaluate(applyPatch(setup, p)); return { e, txt: `рейтинг ${e0.rating}→${e.rating}, атака ${e0.attackScore}→${e.attackScore}, риск ${e0.defRisk}→${e.defRisk}` }; };
  if (ai >= 2) {
    tactics.push({ window: '0–20', situationRu: 'Старт матча', changeRu: 'Включи Quick Tactic «Team Press» в первые минуты', reasonRu: `Пока у всех 100% энергии, прессинг дешёвый. При подходе «${getApproach(setup.defApproach).nameRu}» команда и так давит — дожимай в начале, потом экономь.` });
    const e60 = avg(60);
    const low = APPROACHES[ai - 1];
    const d = delta({ defApproach: low.id, lineHeight: low.lineDefault }, ev);
    tactics.push({ window: '60–65', situationRu: e60 < 72 ? `Средняя энергия ≈${Math.round(e60)}%` : 'Если соперник начал убегать в спину', changeRu: `Подход ${getApproach(setup.defApproach).nameRu} → ${low.nameRu} (линия ${low.lineDefault})`, patch: { defApproach: low.id, lineHeight: low.lineDefault },
      reasonRu: `Уставшие ЦЗ и прессингующие медленнее возвращаются: риск «за спиной» сейчас ${ev.risks.behind.toFixed(0)}, после смены ${d.e.risks.behind.toFixed(0)}. ${d.txt}.` });
  }
  // Ведём в счёте
  {
    const fbs = ev.slots.filter((s) => ['LB', 'RB', 'LWB', 'RWB'].includes(s.slot.pos) && s.v.adv > 0.25);
    const p: Patch = { defApproach: APPROACHES[Math.max(0, ai - 1)].id, lineHeight: APPROACHES[Math.max(0, ai - 1)].lineDefault, buildUp: 'Counter', roles: fbs.map((s) => ({ slot: s.slot.id, roleId: 'fullback', focus: 'Defend' })) };
    const d = delta(p, ev);
    tactics.push({ window: '70+', situationRu: 'Ведёшь в счёте', changeRu: `Tactical Focus «Оборонительный» (или вручную: подход ${APPROACHES[Math.max(0, ai - 1)].nameRu}, стиль «Контратака»${fbs.length ? `, ${fbs.map((s) => s.player?.nameRu).join(' и ')} → Крайний защитник (Защита)` : ''})`, patch: p,
      reasonRu: `Меньше людей впереди — меньше дыр за спиной, а быстрые ${ev.slots.filter((s) => s.v.runs > 0.6).slice(0, 2).map((s) => s.player?.nameRu).join(', ') || 'нападающие'} убивают время контратаками. ${d.txt}.` });
  }
  // Проигрываем
  {
    const twoSt = ['4-2-4', '4-4-2', '4-1-2-1-2', '3-5-2'];
    const curF = getFormation(setup.formationId);
    const back = curF.slots.filter((s) => s.pos === 'CB').length;
    const target = twoSt.find((f) => getFormation(f).slots.filter((s) => s.pos === 'CB').length === back && f !== setup.formationId) ?? '4-4-2';
    const up = APPROACHES[Math.min(3, ai + 1)];
    const fbs = ev.slots.filter((s) => ['LB', 'RB', 'LWB', 'RWB'].includes(s.slot.pos));
    const p: Patch = { formationId: target, defApproach: up.id, lineHeight: up.lineDefault, buildUp: 'Balanced' };
    const after = applyPatch(setup, p);
    const roles = fbs.map((s) => ({ slot: s.slot.id, roleId: 'attacking_wingback', focus: 'Attack' })).filter((r) => after.slots[r.slot]);
    p.roles = roles;
    const d = delta(p, ev);
    tactics.push({ window: '70–80', situationRu: 'Проигрываешь', changeRu: `Схема ${getFormation(target).name}, подход ${up.nameRu}, крайние → Атакующий вингбек (Атака)`, patch: p,
      reasonRu: `Второй нападающий и крайние в атаке дают больше людей в штрафной (присутствие ${ev.attack.find((c) => c.id === 'box')!.value}→${d.e.attack.find((c) => c.id === 'box')!.value}), но риск растёт. ${d.txt}.` });
  }
  tactics.push({ window: '85+', situationRu: 'Нужен гол (стандарты)', changeRu: 'Quick Tactics: «Overload Set Pieces» и «Get In Box»', reasonRu: 'На угловых и навесах больше людей в штрафной. Включай только на последние минуты — сзади остаётся очень мало игроков.' });
  const note = setup.matchMode === 'competitive'
    ? 'Режим Competitive (UT/онлайн): по Pitch Notes EA, игрок под твоим управлением не замедляется от усталости, но остальные (под ИИ) устают как обычно. Поэтому план замен почти тот же; можно тянуть чуть дольше с теми, кем ты чаще управляешь (опорник/ЦЗ).'
    : 'Режим Authentic (Карьера/Kick-off): выносливость тратится у всех. Модель усталости — эвристика: роль × подход × атрибут Stamina × Relentless.';
  return { subs, tactics, curves, noteRu: note };
}
