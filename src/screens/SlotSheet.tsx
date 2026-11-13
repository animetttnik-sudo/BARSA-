import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { evaluate } from '../model/engine';
import { focusesFor, getPlayer, getRole, rolesForPos } from '../model/data';
import { applyPatch, bench } from '../model/setup';
import { familiarity, FAM_RU, posFamiliarity, roleFit } from '../model/profile';
import { useStore } from '../state';
import { Badge, Chip, Delta, ExplainButton, Row, SectionTitle, Sheet, useExplain } from '../ui/kit';
import { C } from '../ui/theme';
import { POS_RU, roleAbbr } from '../ui/labels';

const FAM_SHORT: Record<string, string> = { natural: 'своя', related: 'смежная', oop: 'чужая' };

export function SlotSheet({ slotId, onClose }: { slotId: string | null; onClose: () => void }) {
  const { setup, ev, commit } = useStore();
  const explain = useExplain();
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
    const sortF = (a: { d: number }, b: { d: number }) => b.d - a.d;
    return { roles, xi: xi.sort(sortF), bn: bn.sort(sortF), pos, p };
  }, [se, setup, ev]);
  if (!se || !data) return null;
  const role = se.role;
  const setRole = (roleId: string, focus: string) => commit(applyPatch(setup, { roles: [{ slot: se.slot.id, roleId, focus }] }), `${se.slot.id}: роль ${getRole(roleId)?.nameRu} / ${getRole(roleId)?.focuses.find((f) => f.id === focus)?.nameRu}`);
  const put = (pid: string) => { commit(applyPatch(setup, { swaps: [{ slot: se.slot.id, playerId: pid }] }), `${se.slot.id}: ${getPlayer(pid)?.nameRu}`); onClose(); };
  const famC = (f: string) => (f === 'natural' ? C.good : f === 'related' ? C.warn : C.bad);
  const playerWhy = data.p
    ? `${data.p.nameRu}. Позиции: ${data.p.positions.join(', ')}. ${data.p.heightCm} см, ${data.p.foot === 'L' ? 'левая' : 'правая'} нога, ${data.p.age} лет.\nСкорость ${data.p.attr['Sprint Speed']}, ускорение ${data.p.attr['Acceleration']}, выносливость ${data.p.attr['Stamina']}, пас ${data.p.attr['Short Pass']}, видение ${data.p.attr['Vision']}, отбор ${data.p.attr['Stand Tackle']}.\nPlayStyles: ${[...data.p.playstylesPlus.map((x) => x + '+'), ...data.p.playstyles].join(', ') || 'нет'}.\n\nСоответствие роли считается по атрибутам, не по OVR. ++ и + — отметки роли игрока в FC 26.`
    : '';
  const rolesWhy = data.roles.map(({ r }) => {
    const focusLine = r.id === role.id ? `\nСейчас «${se.focus.nameRu}»: ${se.focus.descRu}` : '';
    return `${r.nameRu}. ${r.descRu}${focusLine}`;
  }).join('\n\n');
  return (
    <Sheet visible onClose={onClose} title={`${POS_RU[data.pos] ?? data.pos} · ${data.p ? data.p.nameRu : 'пусто'}`}>
      {data.p ? (
        <View style={{ marginBottom: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Badge label={FAM_RU[se.fam]} color={se.fam === 'oop' ? C.bad : se.fam === 'related' ? C.warn : se.fam.startsWith('role') ? C.gold : C.good} />
            <ExplainButton onPress={() => explain.open(data.p!.nameRu, playerWhy)} />
          </Row>
          <Text style={{ color: C.text, fontSize: 16, marginTop: 4 }}>{data.p.positions.join(' · ')} · {data.p.heightCm} см · {data.p.age}</Text>
        </View>
      ) : null}
      <SectionTitle onExplain={() => explain.open('Роли и фокусы', rolesWhy)}>Роль</SectionTitle>
      {data.roles.map(({ r, focuses, fit, fam }) => (
        <View key={r.id} style={{ marginBottom: 8, padding: 10, borderRadius: 14, backgroundColor: r.id === role.id ? '#15233F' : 'transparent', borderWidth: 1, borderColor: r.id === role.id ? C.blueL : C.line }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 17, flex: 1 }}>{roleAbbr(r.id)} · {r.nameRu}</Text>
            {fam === 'role++' || fam === 'role+' ? <Badge label={fam === 'role++' ? '++' : '+'} color={C.gold} /> : null}
            {data.p ? <Text style={{ color: fit >= 75 ? C.good : fit >= 60 ? C.gold : C.warn, fontSize: 17, fontWeight: '800' }}>{fit}%</Text> : null}
          </Row>
          <Row style={{ flexWrap: 'wrap', marginTop: 6 }} gap={0}>
            {focuses.map((fid) => { const f = r.focuses.find((x) => x.id === fid)!; return <Chip key={fid} label={f.nameRu} active={r.id === role.id && se.focus.id === fid} onPress={() => setRole(r.id, fid)} />; })}
          </Row>
        </View>
      ))}
      <SectionTitle onExplain={() => explain.open('Замена', 'Число справа — насколько изменится рейтинг опасности, если поставить игрока на этот слот. Роль слота при этом сохраняется.')}>Кого поставить</SectionTitle>
      {[...data.xi.map((x) => ({ ...x, tag: x.from })), ...data.bn.map((x) => ({ ...x, tag: 'запас' }))].sort((a, b) => b.d - a.d).map(({ p, d, pf, tag }) => (
        <Pressable key={p.id} onPress={() => put(p.id)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: C.line, gap: 8, minHeight: 48 }, pressed && { opacity: 0.6 }]}>
          <Text style={{ color: C.gold, width: 32, fontWeight: '800', fontSize: 17 }}>{p.number ?? '·'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 17 }}>{p.nameRu}</Text>
            <Text style={{ color: famC(pf), fontSize: 15, fontWeight: '600' }}>{FAM_SHORT[pf] ?? pf} · {tag}</Text>
          </View>
          <Delta v={d} />
        </Pressable>
      ))}
      {explain.sheet}
    </Sheet>
  );
}
