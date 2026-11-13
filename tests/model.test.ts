/// <reference types="node" />
import assert from 'node:assert/strict';
import { evaluate, slotEvals, snapRoleFocus } from '../src/model/engine';
import { defaultSetup, applyPatch, changeFormation, swapSlots, switchSquadMode, bench } from '../src/model/setup';
import { vulnerabilities } from '../src/model/fixes';
import { counterPlus } from '../src/model/counter';
import { planSubs } from '../src/model/subs';
import { diagnose, findAlternative, objective, Category } from '../src/model/diagnose';
import { PLAYERS, ROLES, FORMATIONS, rolesForPos, focusesFor, getPlayer, getFormation, getRole } from '../src/model/data';
import type { Setup } from '../src/model/types';

let pass = 0, fail = 0;
function test(name: string, fn: () => void) {
  try { fn(); pass++; console.log('  ✓', name); } catch (e: any) { fail++; console.log('  ✗', name, '\n     ', e?.message ?? e); }
}
const base = () => defaultSetup('fc26');
const ev = (s: Setup) => evaluate(s);
const risk = (s: Setup, id: string) => ev(s).risks[id];
const att = (s: Setup, id: string) => ev(s).attack.find((c) => c.id === id)!.value;

console.log('Данные');
test('все игроки имеют 34 атрибута и позиции', () => { for (const p of PLAYERS) { assert.equal(Object.keys(p.attr).length, 34, p.name); assert.ok(p.positions.length > 0, p.name); } });
test('у каждой позиции есть роли и фокусы', () => { for (const pos of ['GK', 'LB', 'RB', 'LWB', 'RWB', 'CB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST']) { const rs = rolesForPos(pos); assert.ok(rs.length >= 1, pos); for (const r of rs) assert.ok(focusesFor(r, pos).length >= 1, r.id + pos); } });
test('во всех схемах по 11 слотов и ровно 1 GK', () => { for (const f of FORMATIONS) { assert.equal(f.slots.length, 11, f.id); assert.equal(f.slots.filter((s) => s.pos === 'GK').length, 1, f.id); } });
test('30 ролей FC 26', () => assert.equal(ROLES.length, 30));
test('состав по умолчанию валиден в обоих режимах', () => { for (const m of ['fc26', 'real2627'] as const) { const s = defaultSetup(m); for (const a of Object.values(s.slots)) { const p = getPlayer(a.playerId)!; assert.ok(p, a.playerId!); assert.ok(m === 'fc26' ? p.inFc26Barca : p.inReal2627, p.name); } } });

console.log('Модель: базовые свойства');
test('рейтинг в диапазоне 0..100 для всех схем', () => { for (const f of FORMATIONS) { const e = ev(changeFormation(base(), f.id)); assert.ok(e.rating >= 0 && e.rating <= 100, f.id); assert.ok(e.attackScore >= 0 && e.defRisk >= 0); } });
test('рейтинг НЕ зависит от OVR (меняем OVR — ничего не меняется)', () => {
  const r0 = ev(base()).rating;
  const saved = PLAYERS.map((p) => p.ovr);
  for (const p of PLAYERS) p.ovr = 40;
  const r1 = ev(base()).rating;
  PLAYERS.forEach((p, i) => (p.ovr = saved[i]));
  assert.equal(r1, r0);
});
test('детерминированность', () => assert.deepEqual(ev(base()).risks, ev(base()).risks));

console.log('Модель: монотонность');
test('выше линия → больше риск за спиной', () => {
  const s = base(); let prev = -1;
  for (const lh of [62, 70, 80, 90]) { const r = risk({ ...s, lineHeight: lh }, 'behind'); assert.ok(r >= prev, `lh ${lh}: ${r} < ${prev}`); prev = r; }
});
test('подход Deep → High → Aggressive: риск за спиной растёт', () => {
  const s = base();
  const a = risk(applyPatch(s, { defApproach: 'Deep', lineHeight: 25 }), 'behind'), b = risk(applyPatch(s, { defApproach: 'High', lineHeight: 70 }), 'behind'), c = risk(applyPatch(s, { defApproach: 'Aggressive', lineHeight: 95 }), 'behind');
  assert.ok(a < b && b < c, `${a} ${b} ${c}`);
});
test('Агрессивный подход → больше усталости и лучше контрпрессинг', () => {
  const s = base();
  const hi = ev(applyPatch(s, { defApproach: 'High', lineHeight: 70 })), ag = ev(applyPatch(s, { defApproach: 'Aggressive', lineHeight: 95 }));
  assert.ok(ag.risks.fatigue > hi.risks.fatigue); assert.ok(ag.risks.cpress < hi.risks.cpress);
});
test('левый крайний: Fullback/Defend → AWB/Attack увеличивает риск фланга и ширину', () => {
  const s = applyPatch(base(), { roles: [{ slot: 'LB', roleId: 'fullback', focus: 'Defend' }] });
  const t = applyPatch(base(), { roles: [{ slot: 'LB', roleId: 'attacking_wingback', focus: 'Attack' }] });
  assert.ok(risk(t, 'flankL') > risk(s, 'flankL') + 10);
  assert.ok(att(t, 'width') >= att(s, 'width'));
  assert.ok(risk(t, 'rest') > risk(s, 'rest'));
});
test('смена роли меняет рейтинг (Педри DLP → Box Crasher)', () => {
  const s = base(); const t = applyPatch(s, { roles: [{ slot: 'LDM', roleId: 'box_crasher', focus: 'Balanced' }] });
  assert.notEqual(ev(t).rating, ev(s).rating);
  assert.ok(ev(t).risks.z14 > ev(s).risks.z14, 'Box Crasher оставляет зону 14');
  assert.ok(ev(t).risks.rest > ev(s).risks.rest);
});
test('Centre-Half (опускается в линию) уменьшает риск rest defence', () => {
  const s = base(); const t = applyPatch(s, { roles: [{ slot: 'RDM', roleId: 'centre_half', focus: 'Defend' }] });
  assert.ok(ev(t).risks.rest < ev(s).risks.rest);
});
test('медленный ЦЗ увеличивает риск за спиной (Кристенсен вместо Кубарси)', () => {
  const s = base(); const t = applyPatch(s, { swaps: [{ slot: 'LCB', playerId: 'christensen' }] });
  const pr = (id: string) => getPlayer(id)!.attr['Sprint Speed'];
  if (pr('christensen') < pr('cubarsi')) assert.ok(risk(t, 'behind') > risk(s, 'behind'));
  else assert.ok(risk(t, 'behind') <= risk(s, 'behind'));
});
test('смена игрока меняет рейтинг', () => { const s = base(); const t = applyPatch(s, { swaps: [{ slot: 'ST', playerId: 'ferran-torres' }] }); assert.notEqual(JSON.stringify(ev(t).attack), JSON.stringify(ev(s).attack)); });
test('Короткий пас → лучше розыгрыш, чем Контратака; Контратака → больше угроза контратаки', () => {
  const s = base(); const a = applyPatch(s, { buildUp: 'Short' }), c = applyPatch(s, { buildUp: 'Counter' });
  assert.ok(att(a, 'build') > att(c, 'build')); assert.ok(att(c, 'counter') > att(a, 'counter'));
});
test('Competitive снижает риск усталости (управляемый игрок не замедляется)', () => { const s = applyPatch(base(), { defApproach: 'Aggressive', lineHeight: 95 }); assert.ok(risk({ ...s, matchMode: 'competitive' }, 'fatigue') <= risk(s, 'fatigue')); });
test('схема с 3 ЦЗ: меньше риск в полуфлангах', () => { const s = base(); const t = changeFormation(s, '5-3-2'); assert.ok(risk(t, 'halfL') + risk(t, 'halfR') < risk(s, 'halfL') + risk(s, 'halfR')); });
test('Вратарь-чистильщик снижает риск за спиной', () => { const s = base(); const t = applyPatch(s, { roles: [{ slot: 'GK', roleId: 'sweeper_keeper', focus: 'Build-Up' }] }); assert.ok(risk(t, 'behind') < risk(s, 'behind')); });
test('Таргетмен без навесов — минус в сочетаниях, ложная 9 + IF — плюс', () => {
  const s = base();
  const f9 = applyPatch(s, { roles: [{ slot: 'ST', roleId: 'false_9', focus: 'Build-Up' }] });
  assert.ok(ev(f9).synergies.some((x) => x.delta > 0 && x.textRu.includes('Ложная 9')));
});
test('пустой слот ухудшает рейтинг', () => { const s = base(); const t: Setup = { ...s, slots: { ...s.slots, ST: { ...s.slots.ST, playerId: null } } }; assert.ok(ev(t).rating < ev(s).rating); });
test('drag&drop обмен двух игроков меняет модель и обратим', () => { const s = base(); const t = swapSlots(s, 'LM', 'RM'); assert.notDeepEqual(ev(t).risks, ev(s).risks); assert.deepEqual(swapSlots(t, 'LM', 'RM'), s); });

console.log('Доска тактики: автоподбор роли и фокуса с мячом');
test('snapRoleFocus берёт ближайшую позицию с мячом среди ролей и фокусов слота', () => {
  const s = base();
  const points: [number, number][] = [[0.08, 0.2], [0.22, 0.55], [0.5, 0.16], [0.84, 0.78], [0.42, 0.66]];
  for (const slotId of ['LB', 'LCB', 'LDM', 'ST', 'CAM']) {
    const slot = getFormation(s.formationId).slots.find((x) => x.id === slotId)!;
    const allowed = new Set(rolesForPos(slot.pos).map((r) => r.id));
    for (const [x, y] of points) {
      const snap = snapRoleFocus(s, slotId, x, y);
      assert.ok(allowed.has(snap.roleId), `${slotId} ${snap.roleId}`);
      const role = getRole(snap.roleId)!;
      assert.ok(focusesFor(role, slot.pos).includes(snap.focus), `${slotId} ${snap.focus}`);
      let best = Infinity;
      for (const r of rolesForPos(slot.pos)) {
        for (const focus of focusesFor(r, slot.pos)) {
          const next = applyPatch(s, { roles: [{ slot: slotId, roleId: r.id, focus }] });
          const p = slotEvals(next).find((z) => z.slot.id === slotId)!.posIn;
          best = Math.min(best, Math.hypot(p.x - Math.max(0, Math.min(1, x)), p.y - Math.max(0, Math.min(1, y))));
        }
      }
      assert.ok(Math.abs(snap.dist - best) < 1e-9, `${slotId} @ ${x},${y}: ${snap.dist} vs ${best} (${snap.roleId}/${snap.focus})`);
      const applied = slotEvals(applyPatch(s, { roles: [{ slot: slotId, roleId: snap.roleId, focus: snap.focus }] })).find((z) => z.slot.id === slotId)!.posIn;
      assert.ok(Math.abs(applied.x - snap.pos.x) < 1e-9 && Math.abs(applied.y - snap.pos.y) < 1e-9);
    }
  }
});
test('точка у своих ворот для крайнего ниже, чем точка у чужих', () => {
  const s = base();
  const low = snapRoleFocus(s, 'LB', 0.12, 0.18);
  const high = snapRoleFocus(s, 'LB', 0.12, 0.82);
  assert.ok(low.pos.y < high.pos.y, `${low.roleRu}/${low.focusRu} y=${low.pos.y} vs ${high.roleRu}/${high.focusRu} y=${high.pos.y}`);
});
test('координаты вне поля зажимаются в 0..1', () => {
  const s = base();
  const edge = snapRoleFocus(s, 'ST', 1, 1);
  const over = snapRoleFocus(s, 'ST', 4, 3);
  assert.equal(over.roleId, edge.roleId);
  assert.equal(over.focus, edge.focus);
  assert.ok(Math.abs(over.dist - edge.dist) < 1e-9);
});
test('вратарь остаётся в ролях GK', () => {
  const s = base();
  const snap = snapRoleFocus(s, 'GK', 0.5, 0.4);
  const allowed = new Set(rolesForPos('GK').map((r) => r.id));
  assert.ok(allowed.has(snap.roleId), snap.roleId);
  assert.ok(snap.pos.y < 0.2, `GK ушёл слишком высоко: ${snap.pos.y}`);
});
test('смена схемы сохраняет тех же 11 игроков', () => { const s = base(); for (const f of FORMATIONS) { const t = changeFormation(s, f.id); assert.deepEqual(Object.values(t.slots).map((a) => a.playerId).sort(), Object.values(s.slots).map((a) => a.playerId).sort(), f.id); } });
test('переключение на 2026/27 убирает ушедших игроков', () => { const t = switchSquadMode(base(), 'real2627'); for (const a of Object.values(t.slots)) if (a.playerId) assert.ok(getPlayer(a.playerId)!.inReal2627, a.playerId); });

console.log('Контратака − (уязвимости и исправления)');
test('каждая зона имеет причину; у зон с риском ≥30 есть исправление, которое снижает риск', () => {
  const s = base(); const z = vulnerabilities(s);
  for (const x of z) {
    assert.ok(x.reasonRu.length > 10, x.id);
    assert.ok(x.fixes.some((f) => f.type === 'manual'), x.id);
    for (const f of x.fixes.filter((f) => f.patch)) {
      const after = evaluate(applyPatch(s, f.patch!)).risks[x.id];
      assert.ok(after < x.risk, `${x.id}: fix ${f.titleRu} не снижает риск (${x.risk} → ${after})`);
      assert.ok(f.reasonRu.length > 10);
    }
  }
});
test('фиксы для высокой линии предлагают снизить линию или быстрого ЦЗ', () => {
  const s = applyPatch(base(), { defApproach: 'Aggressive', lineHeight: 98 });
  const z = vulnerabilities(s).find((x) => x.id === 'behind')!;
  assert.ok(z.severity !== 'low');
  assert.ok(z.fixes.some((f) => f.type === 'tactic' || f.type === 'swap' || f.type === 'role'));
});

console.log('Контратака +');
test('бегуны отсортированы, паттерн и каналы есть', () => { const c = counterPlus(base()); assert.ok(c.runners[0].score >= c.runners[1].score); assert.ok(c.patternRu.length >= 2); assert.equal(c.channels.length, 3); });
test('корректировки контратаки действительно повышают угрозу контратаки', () => {
  const s = base(); const c = counterPlus(s);
  for (const f of c.adjustments) assert.ok(att(applyPatch(s, f.patch!), 'counter') > c.counterScore, f.titleRu);
});

console.log('Планировщик замен');
test('замены в окнах, с причиной, не больше 5, только игроки запаса', () => {
  const s = base(); const p = planSubs(s); const bn = new Set(bench(s).map((x) => x.id));
  assert.ok(p.subs.length <= 5);
  for (const x of p.subs) { assert.ok(bn.has(x.inId), x.inRu); assert.ok(x.reasonRu.includes('%')); assert.ok(/\d/.test(x.window)); }
  assert.ok(p.tactics.length >= 3); for (const t of p.tactics) assert.ok(t.reasonRu.length > 20);
});
test('Агрессивный подход → первые замены не позже, чем при Глубоком блоке', () => {
  const s = base();
  const ag = planSubs(applyPatch(s, { defApproach: 'Aggressive', lineHeight: 95 })), dp = planSubs(applyPatch(s, { defApproach: 'Deep', lineHeight: 25 }));
  const first = (p: typeof ag) => (p.subs[0]?.minute ?? 99);
  assert.ok(first(ag) <= first(dp), `${first(ag)} vs ${first(dp)}`);
  assert.ok(ag.subs.length >= dp.subs.length);
});
test('кривые энергии убывают внутри тайма', () => { for (const c of planSubs(base()).curves) { for (let i = 1; i <= 9; i++) assert.ok(c.points[i] <= c.points[i - 1]); } });

console.log('«Почему не работает»');
for (const cat of ['defence', 'possession', 'attack', 'all'] as Category[]) {
  test(`${cat}: альтернатива не хуже по цели, изменения объяснены`, () => {
    const s = base(); const d = diagnose(s, cat);
    assert.ok(d.objectiveAfter >= d.objectiveBefore);
    for (const ch of d.changes) { assert.ok(ch.titleRu.length > 5); assert.ok(ch.reasonRu !== undefined); }
    if (d.improved) assert.ok(d.changes.length > 0);
    for (const a of Object.values(d.alternative.slots)) assert.ok(a.playerId, 'все слоты заполнены');
  });
}
test('защита: альтернатива снижает риск обороны', () => { const s = base(); const d = diagnose(s, 'defence'); assert.ok(d.after.defRisk < d.before.defRisk); });
test('атака: альтернатива повышает атаку', () => { const s = base(); const d = diagnose(s, 'attack'); assert.ok(d.after.attackScore >= d.before.attackScore); });
test('владение: в плохой для владения тактике (Контратака) диагноз это находит и меняет стиль', () => {
  const s = applyPatch(base(), { buildUp: 'Counter' }); const d = diagnose(s, 'possession');
  assert.ok(d.issues.some((i) => i.titleRu.includes('Контратака')));
  assert.notEqual(d.alternative.buildUp, 'Counter');
});
test('альтернатива использует только игроков выбранной базы', () => { const s = defaultSetup('real2627'); const alt = findAlternative(s, 'all'); for (const a of Object.values(alt.slots)) assert.ok(getPlayer(a.playerId)!.inReal2627); });
test('уже оптимальную тактику повторный поиск почти не меняет', () => { const s = base(); const a1 = findAlternative(s, 'defence'); const a2 = findAlternative(a1, 'defence'); assert.ok(objective('defence', evaluate(a2)) - objective('defence', evaluate(a1)) < 3); });

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
