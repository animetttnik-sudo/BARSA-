import type { Setup } from './types';
import { evaluate, Evaluation, SlotEval } from './engine';
import { candidates, rankFixes, Fix } from './fixes';
import { has } from './profile';
import { getBuildUp } from './data';

export interface Runner { s: SlotEval; score: number; whyRu: string; lane: 'L' | 'C' | 'R' }
export interface Passer { s: SlotEval; score: number; whyRu: string }
export interface Channel { lane: 'L' | 'C' | 'R'; nameRu: string; score: number; runner?: Runner; whyRu: string }
export interface CounterPlus { runners: Runner[]; passers: Passer[]; channels: Channel[]; patternRu: string[]; arrows: { from: { x: number; y: number }; to: { x: number; y: number }; strength: number }[]; adjustments: Fix[]; counterScore: number; noteRu: string }

const laneOf = (x: number): 'L' | 'C' | 'R' => (x < 0.36 ? 'L' : x > 0.64 ? 'R' : 'C');
const LANE_RU = { L: 'левый фланг', C: 'центр', R: 'правый фланг' };

export function counterPlus(setup: Setup, withAdjust = true): CounterPlus {
  const ev = evaluate(setup);
  const bu = getBuildUp(setup.buildUp);
  const field = ev.slots.filter((s) => s.player && s.slot.pos !== 'GK');
  const runners: Runner[] = field.map((s) => {
    const pr = s.pr!;
    const ps = has(s.player!, 'Rapid') + has(s.player!, 'Quick Step');
    const score = Math.round(100 * (s.v.runs * 0.55 + s.v.att * 0.25 + 0.2) * Math.pow(pr.pace / 90, 1.6) * s.q * (1 + 0.05 * ps) * (0.6 + 0.6 * s.posOut.y));
    const lane = laneOf(s.posOut.x + (s.v.inward > 0.3 ? (0.5 - s.posOut.x) * 0.5 : 0));
    return { s, score, lane, whyRu: `скорость ${Math.round(pr.pace)}, рывок ${Math.round(pr.burst)}${ps ? ', PlayStyles: ' + ['Rapid', 'Quick Step'].filter((x) => has(s.player!, x)).map((x) => x + (has(s.player!, x) === 2 ? '+' : '')).join(', ') : ''}; роль ${s.role.nameRu} (${s.focus.nameRu}) — забегания ${Math.round(s.v.runs * 100)}%` };
  }).sort((a, b) => b.score - a.score);
  const passers: Passer[] = field.filter((s) => s.posOut.y < 0.55).map((s) => {
    const pr = s.pr!;
    const psList = ['Incisive Pass', 'Pinged Pass', 'Long Ball Pass', 'Whipped Pass', 'Tiki Taka'].filter((x) => has(s.player!, x));
    const score = Math.min(100, Math.round(pr.passing * (0.6 + 0.4 * s.v.create) * s.q + psList.reduce((m, x) => m + has(s.player!, x) * 3, 0)));
    return { s, score, whyRu: `пас ${Math.round(pr.passing)}, видение ${s.player!.attr['Vision'] ?? '?'}, длинный ${s.player!.attr['Long Pass'] ?? '?'}${psList.length ? ', ' + psList.map((x) => x + (has(s.player!, x) === 2 ? '+' : '')).join(', ') : ''}` };
  }).sort((a, b) => b.score - a.score);
  const opp = ev.risks; // наши риски не нужны; каналы считаем по нашим бегунам
  void opp;
  const channels: Channel[] = (['L', 'C', 'R'] as const).map((lane) => {
    const rs = runners.filter((r) => r.lane === lane);
    const best = rs[0];
    const support = rs.slice(1, 3).reduce((m, r) => m + r.score * 0.35, 0);
    const score = Math.round(Math.min(100, (best?.score ?? 0) * 0.85 + support * 0.5));
    return { lane, nameRu: LANE_RU[lane], score, runner: best, whyRu: best ? `${best.s.player!.nameRu}: ${best.whyRu}${rs.length > 1 ? `; поддержка: ${rs.slice(1, 3).map((r) => r.s.player!.nameRu).join(', ')}` : ''}` : 'Никто не бежит в этот коридор' };
  }).sort((a, b) => b.score - a.score);
  const p1 = passers[0], c1 = channels[0], c2 = channels[1];
  const pattern: string[] = [];
  if (p1 && c1.runner) {
    pattern.push(`Отбор → мяч на ${p1.s.player!.nameRu} (${p1.whyRu.split(',')[0]}) → сразу пас в ${c1.nameRu} на ${c1.runner.s.player!.nameRu}.`);
    if (c2?.runner) pattern.push(`Второй вариант: ${c2.nameRu} — ${c2.runner.s.player!.nameRu}. Переводи туда, если первый коридор закрыт.`);
    const boxer = runners.find((r) => r.s.v.box > 0.6 && r !== c1.runner);
    if (boxer) pattern.push(`В штрафную вторым темпом врывается ${boxer.s.player!.nameRu} (${boxer.s.role.nameRu}).`);
    pattern.push(bu.id === 'Counter' ? 'Стиль «Контратака»: игроки сами бегут вперёд сразу после отбора.' : `Стиль «${bu.nameRu}»: после отбора вперёд бежит меньше игроков — для быстрых контратак попробуй «Контратака».`);
  }
  const arrows = [];
  for (const c of channels.slice(0, 2)) if (p1 && c.runner) arrows.push({ from: { x: p1.s.posOut.x, y: p1.s.posOut.y }, to: { x: c.lane === 'L' ? 0.16 : c.lane === 'R' ? 0.84 : 0.5, y: Math.min(0.92, c.runner.s.posOut.y + 0.22) }, strength: c.score / 100 });
  const counterComp = ev.attack.find((c) => c.id === 'counter')!;
  let adjustments: Fix[] = [];
  if (withAdjust) {
    const cands = candidates(setup, ev, (s) => s.slot.pos !== 'GK', 'counter');
    adjustments = rankFixes(setup, ev, cands, (e: Evaluation) => e.attack.find((c) => c.id === 'counter')!.value, false, { minGain: 3, ratingWeight: 0.8 }).slice(0, 4);
  }
  return { runners, passers, channels, patternRu: pattern, arrows, adjustments, counterScore: counterComp.value,
    noteRu: 'Коридоры — где у ТЕБЯ самые опасные бегуны при отборе. Реальные дыры соперника зависят от его тактики — модель их не видит.' };
}
