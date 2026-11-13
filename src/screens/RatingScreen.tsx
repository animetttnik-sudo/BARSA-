import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../state';
import type { Component, Evaluation } from '../model/engine';
import type { Pos } from '../model/types';
import { BallIcon, ChartIcon, ChevronIcon, ShieldIcon } from '../ui/icons';
import { haptic } from '../ui/haptics';
import { Bar, Card, Delta, Disclaimer, H, Metric, Row } from '../ui/kit';
import { Gauge } from '../ui/charts';
import { C, riskColor, scoreColor, space, type as typo } from '../ui/theme';

const clean = (s: string) => s.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

const LINES: { id: string; label: string; pos: Pos[] }[] = [
  { id: 'gk', label: 'Вратарь', pos: ['GK'] },
  { id: 'def', label: 'Защита', pos: ['CB', 'LB', 'RB', 'LWB', 'RWB'] },
  { id: 'mid', label: 'Полузащита', pos: ['CDM', 'CM', 'CAM', 'LM', 'RM'] },
  { id: 'att', label: 'Атака', pos: ['ST', 'LW', 'RW'] },
];

function shares(weights: number[]): number[] {
  if (weights.every((w) => w <= 0)) return weights.map(() => 0);
  const total = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / total) * 100);
  const base = raw.map((n) => Math.floor(n));
  let left = 100 - base.reduce((a, b) => a + b, 0);
  const order = raw.map((n, i) => ({ i, r: n - base[i] })).sort((a, b) => b.r - a.r);
  for (const o of order) {
    if (left <= 0) break;
    base[o.i] += 1;
    left -= 1;
  }
  return base;
}

function lineShares(ev: Evaluation) {
  const rows = LINES.map((line) => {
    const slots = ev.slots.filter((s) => line.pos.includes(s.slot.pos) && s.player);
    const att = slots.reduce((m, s) => m + s.v.att * s.q * (0.35 + s.posIn.y), 0);
    const def = slots.reduce((m, s) => m + s.v.def * s.q * (1.2 - s.posOut.y), 0);
    return { ...line, att, def, n: slots.length };
  });
  const attPct = shares(rows.map((r) => r.att));
  const defPct = shares(rows.map((r) => r.def));
  return rows.map((r, i) => ({ ...r, attPct: attPct[i], defPct: defPct[i] }));
}

function CompRow({ c, prev, risk }: { c: Component; prev?: Component; risk?: boolean }) {
  const [open, setOpen] = useState(false);
  const col = risk ? riskColor(c.value) : scoreColor(c.value);
  return (
    <Pressable
      onPress={() => { haptic('selection'); setOpen((v) => !v); }}
      style={({ pressed }) => [styles.factor, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.factorTop}>
        <Text style={styles.factorName} numberOfLines={open ? 2 : 1}>{clean(c.nameRu)}</Text>
        <View style={styles.factorBar}><Bar value={c.value} color={col} height={4} /></View>
        <Text style={[styles.factorV, { color: col }]}>{c.value}</Text>
        <Text style={styles.factorW}>{Math.round(c.weight * 100)}%</Text>
        <View style={styles.factorD}>{prev ? <Delta v={c.value - prev.value} invert={risk} /> : null}</View>
      </View>
      {open ? <Text style={styles.factorWhy}>{c.reasonRu}</Text> : null}
    </Pressable>
  );
}

const HOW = [
  'OVR в формулу не входит. Игрок считается по атрибутам и PlayStyles, PlayStyle+ весит вдвое.',
  'Роль и фокус задают вектор: вперёд, в центр, к бровке, прессинг, забегание, возврат.',
  'Своя роль++ / + даёт +8% / +4%. Смежная позиция −5%, чужая −14%.',
  'Из этого собираются позиции с мячом и без, покрытие зон и обе подоценки.',
];

export function RatingScreen({ W }: { W: number }) {
  const { ev, prevEv } = useStore();
  const [how, setHow] = useState(false);
  const pa = (id: string) => prevEv?.attack.find((x) => x.id === id);
  const pd = (id: string) => prevEv?.defence.find((x) => x.id === id);
  const worstA = [...ev.attack].sort((a, b) => a.value - b.value)[0];
  const worstD = [...ev.defence].sort((a, b) => b.value * b.weight - a.value * a.weight)[0];
  const lines = lineShares(ev);
  return (
    <View>
      <Card style={{ alignItems: 'center' }}>
        <Row gap={8} style={{ alignSelf: 'flex-start' }}>
          <ChartIcon size={18} color={C.gold} />
          <H style={{ marginBottom: 0 }}>Опасность состава</H>
        </Row>
        <Gauge value={ev.rating} size={Math.min(240, W - 48)} label="0–100 · без OVR" />
        {prevEv ? (
          <Row style={{ marginTop: 2 }}>
            <Text style={styles.note}>к прошлой версии</Text>
            <Delta v={ev.rating - prevEv.rating} />
          </Row>
        ) : null}
        <Row style={{ marginTop: space.md, alignSelf: 'stretch' }}>
          <Metric label="Атака" value={ev.attackScore} color={scoreColor(ev.attackScore)} delta={prevEv ? ev.attackScore - prevEv.attackScore : undefined} />
          <Metric label="Риск" value={ev.defRisk} color={riskColor(ev.defRisk)} delta={prevEv ? ev.defRisk - prevEv.defRisk : undefined} invert />
        </Row>
        <Text style={[styles.note, { marginTop: space.sm, textAlign: 'center' }]}>
          0.55 × {ev.attackScore} + 0.45 × {100 - ev.defRisk} = {ev.rating}
        </Text>
      </Card>

      {worstA && worstD ? (
        <Card>
          <H>Что тянет вниз</H>
          <Insight icon={<BallIcon size={16} color={C.sub} />} kicker="Атака" name={clean(worstA.nameRu)} value={worstA.value} color={scoreColor(worstA.value)} why={worstA.reasonRu} />
          <Insight icon={<ShieldIcon size={16} color={C.sub} />} kicker="Оборона" name={clean(worstD.nameRu)} value={worstD.value} color={riskColor(worstD.value)} why={worstD.reasonRu} />
        </Card>
      ) : null}

      <Card>
        <H>Вклад линий</H>
        <Text style={styles.note}>Доля линии по векторам ролей. В формулу опасности эти проценты не подставляются.</Text>
        <View style={{ marginTop: space.sm, gap: 12 }}>
          {lines.map((line) => (
            <View key={line.id} style={styles.line}>
              <View style={styles.lineName}>
                <Text style={styles.lineL}>{line.label}</Text>
                <Text style={styles.lineN}>{line.n}</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Share label="Атака" value={line.attPct} color={C.garnet} />
                <Share label="Оборона" value={line.defPct} color={C.blueL} />
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 1 }]}>Атака</Text>
          <View style={{ width: 48 }} />
          <Text style={[styles.thMark, { width: 36 }]}>Балл</Text>
          <Text style={[styles.thMark, { width: 34 }]}>Вес</Text>
          <View style={{ width: 36 }} />
        </View>
        {ev.attack.map((c) => <CompRow key={c.id} c={c} prev={pa(c.id)} />)}
      </Card>
      <Card>
        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 1 }]}>Риск в обороне</Text>
          <View style={{ width: 48 }} />
          <Text style={[styles.thMark, { width: 36 }]}>Балл</Text>
          <Text style={[styles.thMark, { width: 34 }]}>Вес</Text>
          <View style={{ width: 36 }} />
        </View>
        {ev.defence.map((c) => <CompRow key={c.id} c={c} prev={pd(c.id)} risk />)}
      </Card>

      {ev.synergies.length ? (
        <Card>
          <H>Связки ролей</H>
          {ev.synergies.map((s, i) => (
            <View key={i} style={styles.syn}>
              <Delta v={s.delta} />
              <Text style={styles.synT}>{s.textRu}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <Pressable onPress={() => { haptic('selection'); setHow((v) => !v); }} style={styles.howHead}>
          <Text style={styles.howTitle}>Как считается</Text>
          <ChevronIcon size={16} color={C.sub} direction={how ? 'up' : 'down'} />
        </Pressable>
        {how ? HOW.map((line) => (
          <View key={line} style={styles.howRow}>
            <View style={styles.howDot} />
            <Text style={styles.howT}>{line}</Text>
          </View>
        )) : <Text style={[styles.note, { marginTop: 6 }]}>Структура, роли и атрибуты. OVR в оценке не участвует.</Text>}
      </Card>
      <Disclaimer compact />
    </View>
  );
}

function Insight({ icon, kicker, name, value, color, why }: { icon: React.ReactNode; kicker: string; name: string; value: number; color: string; why: string }) {
  return (
    <View style={styles.insight}>
      <View style={styles.insightTop}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.insightName} numberOfLines={1}>{name}</Text>
        </View>
        <Text style={[styles.insightV, { color }]}>{value}</Text>
      </View>
      <Text style={styles.note} numberOfLines={3}>{why}</Text>
    </View>
  );
}

function Share({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.share}>
      <Text style={styles.shareL}>{label}</Text>
      <View style={{ flex: 1 }}><Bar value={value} color={color} height={4} /></View>
      <Text style={[styles.shareV, { color }]}>{value}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { ...typo.footnote, color: C.sub },
  kicker: { ...typo.caption, color: C.dim, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  insight: { paddingVertical: 8, gap: 6 },
  insightTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insightName: { ...typo.callout, fontWeight: '600' },
  insightV: { fontSize: 22, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineName: { width: 96, gap: 2 },
  lineL: { ...typo.footnote, color: C.text, fontWeight: '600' },
  lineN: { ...typo.caption, fontVariant: ['tabular-nums'] },
  share: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareL: { ...typo.caption, width: 62 },
  shareV: { width: 36, textAlign: 'right', fontSize: 12, lineHeight: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tableHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  th: { ...typo.caption, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase', color: C.dim },
  factor: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  factorTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factorName: { ...typo.footnote, color: C.text, flex: 1 },
  thMark: { ...typo.caption, width: 36, textAlign: 'right', fontWeight: '600', color: C.dim },
  factorBar: { width: 48 },
  factorV: { width: 36, textAlign: 'right', fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  factorW: { width: 34, textAlign: 'right', ...typo.caption, fontVariant: ['tabular-nums'] },
  factorD: { width: 36, alignItems: 'flex-end' },
  factorWhy: { ...typo.footnote, color: C.sub, marginTop: 6 },
  syn: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  synT: { ...typo.footnote, color: C.text, flex: 1 },
  howHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  howTitle: { ...typo.title, marginBottom: 0 },
  howRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  howDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.blueL, marginTop: 6 },
  howT: { ...typo.footnote, color: C.sub, flex: 1 },
});
