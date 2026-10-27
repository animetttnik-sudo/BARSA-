import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { evaluate } from '../model/engine';
import { focusesFor, getPlayer, getRole, rolesForPos } from '../model/data';
import { applyPatch, bench } from '../model/setup';
import { familiarity, FAM_RU, posFamiliarity, roleFit } from '../model/profile';
import type { Setup } from '../model/types';
import { useStore } from '../state';
import { Badge, Chip, Delta, H, Row, Sheet, T } from '../ui/kit';
import { C } from '../ui/theme';
import { POS_RU, roleAbbr } from '../ui/labels';

export function SlotSheet({ slotId, onClose }: { slotId: string | null; onClose: () => void }) {
  const { setup, ev, commit } = useStore();
  const se = slotId ? ev.slots.find((s) => s.slot.id === slotId) : undefined;
  const data = useMemo(() => {
    if (!se) return null;
    const pos = se.slot.pos;
    const p = se.player;
    const roles = rolesForPos(pos).map((r) => ({ r, focuses: focusesFor(r, pos), fit: p ? Math.round(roleFit(p, r)) : 0, fam: p ? familiarity(p, pos, r) : 'natural' }));
    const base = ev.rating;
    const cand = (pid: string) => evaluate(applyPatch(setup, { swaps: [{ slot: se.slot.id, playerId: pid }] })).rating - base;
    const xi = ev.slots.filter((s) => s.player && s.slot.id !== se.slot.id && (s.slot.pos === 'GK') === (pos === 'GK')).map((s) => ({ p: s.player!, from: s.slot.id, d: cand(s.player!.id), pf: posFamiliarity(s.player!, pos) }));
    const bn = bench(setup).filter((b) => (b.positions[0] === 'GK') === (pos === 'GK')).map((b) => ({ p: b, from: '', d: cand(b.id), pf: posFamiliarity(b, pos) }));
    const sortF = (a: any, b: any) => b.d - a.d;
    return { roles, xi: xi.sort(sortF), bn: bn.sort(sortF), pos, p };
  }, [se, setup, ev]);
  if (!se || !data) return null;
  const role = se.role;
  const setRole = (roleId: string, focus: string) => commit(applyPatch(setup, { roles: [{ slot: se.slot.id, roleId, focus }] }), `${se.slot.id}: роль ${getRole(roleId)?.nameRu} / ${getRole(roleId)?.focuses.find((f) => f.id === focus)?.nameRu}`);
  const put = (pid: string) => { commit(applyPatch(setup, { swaps: [{ slot: se.slot.id, playerId: pid }] }), `${se.slot.id}: ${getPlayer(pid)?.nameRu}`); onClose(); };
  const famC = (f: string) => (f === 'natural' ? C.good : f === 'related' ? C.warn : C.bad);
  return (
    <Sheet visible onClose={onClose} title={`${se.slot.id} · ${POS_RU[data.pos] ?? data.pos} — ${data.p ? data.p.nameRu : 'пусто'}`}>
      {data.p ? (
        <View style={{ marginBottom: 10 }}>
          <Row style={{ flexWrap: 'wrap' }}>
            <Badge label={FAM_RU[se.fam]} color={se.fam === 'oop' ? C.bad : se.fam === 'related' ? C.warn : se.fam.startsWith('role') ? C.gold : C.good} />
            <T dim small>Позиции: {data.p.positions.join(', ')} · {data.p.heightCm} см · {data.p.foot === 'L' ? 'левая' : 'правая'} нога · {data.p.age} лет</T>
          </Row>
          <T dim small style={{ marginTop: 4 }}>
            Скор. {data.p.attr['Sprint Speed']} · Ускор. {data.p.attr['Acceleration']} · Вынос. {data.p.attr['Stamina']} · Пас {data.p.attr['Short Pass']} · Видение {data.p.attr['Vision']} · Отбор {data.p.attr['Stand Tackle']}
          </T>
          {data.p.playstylesPlus.length + data.p.playstyles.length ? <T dim small>PlayStyles: {[...data.p.playstylesPlus.map((x) => x + '+'), ...data.p.playstyles].join(', ')}</T> : null}
        </View>
      ) : null}
      <H>Роль и фокус</H>
      <T dim small style={{ marginBottom: 6 }}>Соответствие роли считается по атрибутам (не по OVR). ++/+ — отметки роли у игрока в FC 26.</T>
      {data.roles.map(({ r, focuses, fit, fam }) => (
        <View key={r.id} style={{ marginBottom: 8, padding: 8, borderRadius: 10, backgroundColor: r.id === role.id ? '#1b2a50' : 'transparent', borderWidth: 1, borderColor: r.id === role.id ? C.blueL : C.line }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ color: C.text, fontWeight: '700', flex: 1 }}>{roleAbbr(r.id)} · {r.nameRu}</Text>
            {fam === 'role++' || fam === 'role+' ? <Badge label={fam === 'role++' ? '++' : '+'} color={C.gold} /> : null}
            {data.p ? <Text style={{ color: fit >= 75 ? C.good : fit >= 60 ? C.gold : C.warn, fontSize: 12, fontWeight: '700' }}>{fit}%</Text> : null}
          </Row>
          <T dim small>{r.descRu}</T>
          <Row style={{ flexWrap: 'wrap', marginTop: 4 }} gap={0}>
            {focuses.map((fid) => { const f = r.focuses.find((x) => x.id === fid)!; return <Chip key={fid} small label={f.nameRu} active={r.id === role.id && se.focus.id === fid} onPress={() => setRole(r.id, fid)} />; })}
          </Row>
          {r.id === role.id ? <T small style={{ color: '#b9c9ff' }}>Фокус «{se.focus.nameRu}»: {se.focus.descRu}</T> : null}
        </View>
      ))}
      <H style={{ marginTop: 6 }}>Поставить игрока</H>
      <T dim small style={{ marginBottom: 6 }}>Δ — изменение рейтинга опасности, если поставить игрока сюда (роль слота сохраняется).</T>
      {[...data.xi.map((x) => ({ ...x, tag: `из ${x.from}` })), ...data.bn.map((x) => ({ ...x, tag: 'запас' }))].sort((a, b) => b.d - a.d).map(({ p, d, pf, tag }) => (
        <Pressable key={p.id} onPress={() => put(p.id)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderColor: C.line, gap: 8 }, pressed && { opacity: 0.6 }]}>
          <Text style={{ color: C.gold, width: 24, fontWeight: '800' }}>{p.number ?? '·'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: '600' }}>{p.nameRu} <Text style={{ color: C.dim, fontSize: 11 }}>{tag}</Text></Text>
            <Text style={{ color: famC(pf), fontSize: 11 }}>{pf === 'natural' ? 'своя позиция' : pf === 'related' ? 'смежная позиция' : 'не своя позиция'} · {p.positions.join('/')}</Text>
          </View>
          <Delta v={d} />
        </Pressable>
      ))}
    </Sheet>
  );
}
