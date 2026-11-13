import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { evaluate } from '../model/engine';
import { focusesFor, getPlayer, getRole, rolesForPos } from '../model/data';
import { applyPatch, bench } from '../model/setup';
import { familiarity, FAM_RU, posFamiliarity, roleFit } from '../model/profile';
import { useStore } from '../state';
import { haptic } from '../ui/haptics';
import { Badge, Delta, Sheet, T } from '../ui/kit';
import { C, nums, radius, space } from '../ui/theme';
import { FAM_COLOR, POS_FULL_RU, POS_RU, roleAbbr } from '../ui/labels';

const STATS: { key: string; label: string }[] = [
  { key: 'Sprint Speed', label: 'Скорость' },
  { key: 'Acceleration', label: 'Ускорение' },
  { key: 'Stamina', label: 'Выносливость' },
  { key: 'Short Pass', label: 'Пас' },
  { key: 'Vision', label: 'Видение' },
  { key: 'Stand Tackle', label: 'Отбор' },
];

const POS_WORD: Record<string, string> = {
  natural: 'своя',
  related: 'смежная',
  oop: 'не своя',
};

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
    const sortF = (a: { d: number }, b: { d: number }) => b.d - a.d;
    return { roles, xi: xi.sort(sortF), bn: bn.sort(sortF), pos, p };
  }, [se, setup, ev]);
  if (!se || !data) return null;
  const role = se.role;
  const active = data.roles.find((x) => x.r.id === role.id) ?? data.roles[0];
  const setRole = (roleId: string, focus: string) => {
    const next = getRole(roleId);
    commit(applyPatch(setup, { roles: [{ slot: se.slot.id, roleId, focus }] }), `${se.slot.id}: роль ${next?.nameRu} / ${next?.focuses.find((f) => f.id === focus)?.nameRu}`);
  };
  const put = (pid: string) => {
    commit(applyPatch(setup, { swaps: [{ slot: se.slot.id, playerId: pid }] }), `${se.slot.id}: ${getPlayer(pid)?.nameRu}`);
    onClose();
  };
  const cands = [
    ...data.xi.map((x) => ({ ...x, tag: `из ${x.from}` })),
    ...data.bn.map((x) => ({ ...x, tag: 'запас' })),
  ].sort((a, b) => b.d - a.d);
  const title = data.p ? data.p.nameRu : 'Пустой слот';
  return (
    <Sheet visible onClose={onClose} title={title}>
      <View style={ss.hero}>
        <Kit number={data.p?.number ?? null} gk={data.pos === 'GK'} empty={!data.p} ring={FAM_COLOR[se.fam] ?? C.dim} />
        <View style={ss.heroCopy}>
          <Text style={ss.pos}>{POS_FULL_RU[data.pos] ?? data.pos} · {se.slot.id}</Text>
          <Text style={ss.now}>{role.nameRu} · {se.focus.nameRu}</Text>
          <View style={ss.badgeRow}>
            <Badge label={FAM_RU[se.fam]} color={FAM_COLOR[se.fam] ?? C.text} />
            <Text style={ss.posCode}>{POS_RU[data.pos] ?? data.pos}</Text>
          </View>
        </View>
      </View>

      {data.p ? (
        <View style={ss.bio}>
          <Text style={ss.bioLine}>
            {data.p.positions.join(' · ')} · {data.p.heightCm} см · {data.p.foot === 'L' ? 'левая' : 'правая'} · {data.p.age} лет
          </Text>
          <View style={ss.stats}>
            {STATS.map((st) => (
              <View key={st.key} style={ss.stat}>
                <Text style={ss.statL}>{st.label}</Text>
                <Text style={ss.statV}>{data.p?.attr[st.key] ?? '—'}</Text>
              </View>
            ))}
          </View>
          {data.p.playstylesPlus.length + data.p.playstyles.length ? (
            <Text style={ss.ps}>PlayStyles: {[...data.p.playstylesPlus.map((x) => x + '+'), ...data.p.playstyles].join(', ')}</Text>
          ) : null}
        </View>
      ) : (
        <T dim small style={ss.note}>Слот пуст. Выбери роль и поставь игрока снизу.</T>
      )}

      <Text style={ss.section}>Роль</Text>
      <T dim small style={ss.note}>Соответствие — по атрибутам, не по OVR. role++ и role+ — отметки роли в FC 26.</T>
      <View style={ss.group}>
        {data.roles.map(({ r, focuses, fit, fam }, i) => {
          const on = r.id === role.id;
          const nextFocus = focuses.includes(se.focus.id) ? se.focus.id : focuses[0];
          return (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => { if (!on) { haptic('selection'); setRole(r.id, nextFocus); } }}
              style={({ pressed }) => [ss.role, on && ss.roleOn, i > 0 && ss.sep, pressed && { opacity: 0.72 }]}
            >
              <View style={ss.roleCopy}>
                <Text style={ss.roleName}>{r.nameRu}</Text>
                <Text style={ss.roleMeta}>{roleAbbr(r.id)}</Text>
              </View>
              <RoleMark fam={fam} />
              {data.p ? <Text style={[ss.fit, { color: fit >= 75 ? C.good : fit >= 60 ? C.gold : C.warn }]}>{fit}%</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {active ? (
        <>
          <Text style={ss.section}>Фокус</Text>
          <View style={ss.pills}>
            {active.focuses.map((fid) => {
              const f = active.r.focuses.find((x) => x.id === fid);
              if (!f) return null;
              const on = se.focus.id === fid;
              return (
                <Pressable
                  key={fid}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => { if (!on) { haptic('selection'); setRole(active.r.id, fid); } }}
                  style={({ pressed }) => [ss.pill, on && ss.pillOn, pressed && { opacity: 0.72 }]}
                >
                  <Text style={[ss.pillT, on && ss.pillTOn]}>{f.nameRu}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={ss.focusDesc}>{se.focus.descRu}</Text>
          <Text style={ss.roleDesc}>{active.r.descRu}</Text>
        </>
      ) : null}

      <Text style={ss.section}>Замена</Text>
      <T dim small style={ss.note}>Δ — как изменится рейтинг опасности. Роль слота сохранится.</T>
      <View style={ss.group}>
        {cands.length === 0 ? <Text style={ss.empty}>Нет кандидатов на эту позицию.</Text> : null}
        {cands.map(({ p, d, pf, tag }, i) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`Поставить ${p.nameRu}`}
            onPress={() => { haptic('selection'); put(p.id); }}
            style={({ pressed }) => [ss.cand, i > 0 && ss.sep, pressed && { opacity: 0.65 }]}
          >
            <Text style={ss.num}>{p.number ?? '·'}</Text>
            <View style={ss.candCopy}>
              <Text style={ss.candName} numberOfLines={1}>{p.nameRu}</Text>
              <Text style={ss.candMeta} numberOfLines={1}>
                <Text style={{ color: FAM_COLOR[pf] ?? C.sub, fontWeight: '600' }}>{POS_WORD[pf] ?? pf}</Text>
                {`  ·  ${tag}  ·  ${p.positions.join(' · ')}`}
              </Text>
            </View>
            <View style={ss.delta}><Delta v={d} /></View>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

function RoleMark({ fam }: { fam: string }) {
  if (fam !== 'role++' && fam !== 'role+') return null;
  const plus = fam === 'role++';
  const color = plus ? C.gold : FAM_COLOR['role+'];
  return (
    <View style={[ss.mark, { borderColor: color, backgroundColor: plus ? 'rgba(237,187,0,0.14)' : 'rgba(127,182,255,0.12)' }]}>
      <Text style={[ss.markT, { color }]}>{plus ? 'role++' : 'role+'}</Text>
    </View>
  );
}

function Kit({ number, gk, empty, ring }: { number: number | null; gk: boolean; empty: boolean; ring: string }) {
  return (
    <View style={[ss.kit, { borderColor: ring }, empty && ss.kitEmpty]}>
      {!empty && !gk ? (
        <View style={ss.kitStripes}>
          <View style={[ss.kitStripe, { backgroundColor: C.blue }]} />
          <View style={[ss.kitStripe, { flex: 1.15, backgroundColor: C.garnet }]} />
          <View style={[ss.kitStripe, { backgroundColor: C.blue }]} />
        </View>
      ) : null}
      {!empty && gk ? <View style={ss.gkBand} /> : null}
      <Text style={ss.kitNum}>{empty ? '+' : (number ?? '·')}</Text>
    </View>
  );
}

const ss = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm },
  heroCopy: { flex: 1, gap: 2 },
  pos: { color: C.text, fontSize: 15, lineHeight: 20, fontWeight: '700', letterSpacing: -0.2 },
  now: { color: C.sub, fontSize: 13, lineHeight: 18 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 4 },
  posCode: { color: C.dim, fontSize: 12, fontWeight: '600' },
  kit: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: '#123F36',
  },
  kitEmpty: { backgroundColor: 'rgba(6,10,14,0.55)', borderStyle: 'dashed', borderColor: C.dim },
  kitStripes: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row' },
  kitStripe: { flex: 1 },
  gkBand: { position: 'absolute', left: 0, right: 0, top: '42%', height: 3, backgroundColor: 'rgba(238,242,250,0.72)' },
  kitNum: { color: '#fff', fontSize: 16, fontWeight: '800', ...nums, textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  bio: { marginBottom: space.sm },
  bioLine: { color: C.sub, fontSize: 12, lineHeight: 16, ...nums },
  stats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.sm, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  stat: { width: '33.33%', paddingVertical: 6 },
  statL: { color: C.dim, fontSize: 11, lineHeight: 14, fontWeight: '500' },
  statV: { color: C.text, fontSize: 17, lineHeight: 22, fontWeight: '700', letterSpacing: -0.3, ...nums },
  ps: { color: C.sub, fontSize: 12, lineHeight: 16, marginTop: space.xs },
  section: {
    color: C.sub,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  note: { marginBottom: space.sm },
  group: {
    backgroundColor: C.card2,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
    overflow: 'hidden',
  },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  role: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: 12, paddingVertical: 10, minHeight: 48 },
  roleOn: { backgroundColor: 'rgba(0,77,152,0.28)' },
  roleCopy: { flex: 1 },
  roleName: { color: C.text, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  roleMeta: { color: C.dim, fontSize: 11, lineHeight: 14, marginTop: 1, fontWeight: '600' },
  fit: { fontSize: 13, fontWeight: '700', ...nums, minWidth: 36, textAlign: 'right' },
  mark: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  markT: { fontSize: 10, lineHeight: 13, fontWeight: '800', letterSpacing: 0.2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pill: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOn: { backgroundColor: C.blue, borderColor: C.blue },
  pillT: { color: C.sub, fontSize: 13, lineHeight: 16, fontWeight: '600' },
  pillTOn: { color: '#fff' },
  focusDesc: { color: C.text, fontSize: 13, lineHeight: 18, marginTop: space.sm },
  roleDesc: { color: C.sub, fontSize: 12, lineHeight: 16, marginTop: 4 },
  cand: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: 12, paddingVertical: 8, minHeight: 48 },
  num: { width: 28, color: C.text, fontSize: 15, fontWeight: '700', ...nums },
  candCopy: { flex: 1 },
  candName: { color: C.text, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  candMeta: { color: C.dim, fontSize: 11, lineHeight: 14, marginTop: 1 },
  delta: { minWidth: 44, alignItems: 'flex-end' },
  empty: { color: C.dim, fontSize: 13, padding: 12 },
});
