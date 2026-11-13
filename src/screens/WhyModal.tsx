import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CATEGORY_RU, Category, diagnose, Diagnosis } from '../model/diagnose';
import { getFormation } from '../model/data';
import { useStore } from '../state';
import { BallIcon, ChevronIcon, RepeatIcon, ShieldIcon, SparkIcon, type IconProps } from '../ui/icons';
import { Badge, Btn, Card, Delta, Disclaimer, H, Row, Sheet, Spinner } from '../ui/kit';
import { Pitch, pitchH } from '../ui/Pitch';
import { C, riskColor, scoreColor, space, type as typo } from '../ui/theme';
import { BUILDUP_RU, APPROACH_RU } from '../ui/labels';

const GOALS: { id: Category; label: string; Icon: React.ComponentType<IconProps>; hint: string }[] = [
  { id: 'defence', label: 'Оборона', Icon: ShieldIcon, hint: 'Контратаки, за спину, фланги' },
  { id: 'possession', label: 'Владение', Icon: RepeatIcon, hint: 'Потери и выход из обороны' },
  { id: 'attack', label: 'Атака', Icon: BallIcon, hint: 'Моменты, забегания, штрафная' },
  { id: 'all', label: 'Всё', Icon: SparkIcon, hint: 'Лучший общий баланс' },
];
const KIND_RU = { formation: 'Схема', tactic: 'Тактика', role: 'Роль', swap: 'Игрок' };
const KIND_COLOR = { formation: C.good, tactic: C.blueL, role: C.gold, swap: C.garnetL };

type Cmp = { key: string; label: string; a: number; b: number; invert?: boolean; icon?: React.ReactNode };

export function WhyModal({ visible, onClose, W }: { visible: boolean; onClose: () => void; W: number }) {
  const { setup, commit } = useStore();
  const [cat, setCat] = useState<Category | null>(null);
  const [res, setRes] = useState<Diagnosis | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!visible) { setCat(null); setRes(null); } }, [visible]);
  const run = (c: Category) => {
    setCat(c); setRes(null); setBusy(true);
    setTimeout(() => { try { setRes(diagnose(setup, c)); } finally { setBusy(false); } }, 30);
  };
  const apply = () => {
    if (!res) return;
    commit(res.alternative, `«Почему не работает»: ${CATEGORY_RU[res.category]}`);
    onClose();
  };
  const half = Math.floor((Math.min(W, 520) - 40) / 2);
  const rows: Cmp[] = res ? [
    { key: 'obj', label: 'Цель', a: Math.round(res.objectiveBefore), b: Math.round(res.objectiveAfter) },
    { key: 'rating', label: 'Опасность', a: res.before.rating, b: res.after.rating },
    { key: 'att', label: 'Атака', a: res.before.attackScore, b: res.after.attackScore },
    { key: 'def', label: 'Риск', a: res.before.defRisk, b: res.after.defRisk, invert: true },
    ...res.before.defence.flatMap((c) => {
      const a = res.after.defence.find((x) => x.id === c.id);
      return a && Math.abs(a.value - c.value) >= 5 ? [{ key: c.id, label: c.nameRu, a: c.value, b: a.value, invert: true, icon: <ShieldIcon size={12} color={C.sub} /> }] : [];
    }),
    ...res.before.attack.flatMap((c) => {
      const a = res.after.attack.find((x) => x.id === c.id);
      return a && Math.abs(a.value - c.value) >= 5 ? [{ key: c.id, label: c.nameRu, a: c.value, b: a.value, icon: <BallIcon size={12} color={C.sub} /> }] : [];
    }),
  ] : [];
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Почему не работает?"
      footer={res && res.improved ? <Btn testID="why-apply" label="Применить альтернативу" kind="gold" onPress={apply} style={{ marginTop: 8 }} /> : null}
    >
      <Text style={[styles.note, { marginBottom: 8 }]}>Выбери, что разваливается в матче. Модель назовёт причины и соберёт альтернативу: схема, тактика, роли, до трёх игроков.</Text>
      <View style={{ gap: 8 }}>
        {[GOALS.slice(0, 2), GOALS.slice(2)].map((pair) => (
          <View key={pair[0].id} style={styles.goalRow}>
            {pair.map((g) => (
              <View key={g.id} style={{ flex: 1 }}>
                <Btn
                  testID={`why-${g.id}`}
                  label={g.label}
                  icon={<g.Icon size={16} color={cat === g.id ? '#fff' : C.sub} focused={cat === g.id} />}
                  kind={cat === g.id ? 'garnet' : 'ghost'}
                  onPress={() => run(g.id)}
                  disabled={busy}
                />
                <Text style={styles.hint}>{g.hint}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
      {busy ? <Spinner label="Сверяю схемы, роли, тактику и замены…" /> : null}
      {res ? (
        <View style={{ marginTop: space.md }}>
          <H>Диагноз</H>
          {res.issues.length ? res.issues.map((issue, k) => {
            const col = issue.severity >= 60 ? C.bad : issue.severity >= 38 ? C.warn : C.sub;
            return (
              <Card key={k} style={styles.issue}>
                <View style={styles.issueTop}>
                  <View style={[styles.dot, { backgroundColor: col }]} />
                  <Text style={styles.issueTitle}>{issue.titleRu}</Text>
                  <Text style={[styles.issueSev, { color: col }]}>{issue.severity}</Text>
                </View>
                <Text style={styles.note}>{issue.reasonRu}</Text>
              </Card>
            );
          }) : <Text style={styles.note}>В этой цели явных провалов модель не видит.</Text>}

          <H style={{ marginTop: space.sm }}>Альтернатива</H>
          {!res.improved ? (
            <Text style={styles.body}>Текущая тактика уже близка к лучшему варианту по этой цели.</Text>
          ) : (
            <>
              <Text style={styles.note}>{getFormation(res.alternative.formationId).name} · {BUILDUP_RU[res.alternative.buildUp]} · {APPROACH_RU[res.alternative.defApproach]} · линия {res.alternative.lineHeight}</Text>
              {res.changes.map((ch, k) => (
                <View key={k} style={styles.change}>
                  <View style={styles.issueTop}>
                    <Badge label={KIND_RU[ch.kind]} color={KIND_COLOR[ch.kind]} />
                    {ch.contribution ? <Row gap={4}><Text style={styles.note}>вклад</Text><Delta v={ch.contribution} /></Row> : null}
                  </View>
                  <Text style={styles.changeTitle}>{ch.titleRu}</Text>
                  <Text style={styles.note}>{ch.reasonRu}</Text>
                  {ch.topEffectsRu ? <Text style={styles.effect}>Эффект · {ch.topEffectsRu}</Text> : null}
                </View>
              ))}

              <H style={{ marginTop: space.md }}>До и после</H>
              <Text style={[styles.note, { marginBottom: 6 }]} numberOfLines={2}>{res.objectiveRu}</Text>
              <View style={styles.cmpHead}>
                <Text style={{ flex: 1 }} />
                <Text style={[styles.cmpH, { width: 36 }]}>Сейчас</Text>
                <View style={{ width: 14 }} />
                <Text style={[styles.cmpH, { width: 36 }]}>После</Text>
                <View style={{ width: 40 }} />
              </View>
              {rows.map((row) => <CmpRow key={row.key} row={row} />)}

              <View style={styles.pitches}>
                <View style={styles.pitchCol}>
                  <Pitch setup={setup} ev={res.before} W={half} small mode="out" />
                  <Text style={[styles.pitchCap, { color: scoreColor(res.before.rating) }]}>Сейчас · {res.before.rating}</Text>
                </View>
                <View style={{ paddingTop: Math.max(0, pitchH(half) / 2 - 12) }}>
                  <ChevronIcon size={16} color={C.dim} />
                </View>
                <View style={styles.pitchCol}>
                  <Pitch setup={res.alternative} ev={res.after} W={half} small mode="out" />
                  <Text style={[styles.pitchCap, { color: scoreColor(res.after.rating) }]}>После · {res.after.rating}</Text>
                </View>
              </View>
              <Text style={[styles.note, { marginTop: 6 }]}>
                Риск после применения <Text style={{ color: riskColor(res.after.defRisk), fontVariant: ['tabular-nums'] }}>{res.after.defRisk}</Text>. Отмена — на вкладке «Сводка».
              </Text>
            </>
          )}
          <Disclaimer compact />
        </View>
      ) : null}
    </Sheet>
  );
}

function CmpRow({ row }: { row: Cmp }) {
  return (
    <View style={styles.cmp}>
      <View style={styles.cmpLabel}>
        {row.icon}
        <Text style={styles.cmpName} numberOfLines={2}>{row.label}</Text>
      </View>
      <Text style={styles.cmpN}>{row.a}</Text>
      <Text style={styles.cmpArrow}>→</Text>
      <Text style={styles.cmpB}>{row.b}</Text>
      <View style={styles.cmpD}><Delta v={row.b - row.a} invert={row.invert} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { ...typo.footnote, color: C.sub },
  body: { ...typo.callout, color: C.text },
  hint: { ...typo.caption, textAlign: 'center', marginTop: 4, color: C.dim },
  goalRow: { flexDirection: 'row', gap: 8 },
  issue: { backgroundColor: C.card2, marginBottom: 8 },
  issueTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  issueTitle: { ...typo.callout, fontWeight: '700', flex: 1 },
  issueSev: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  change: { marginTop: 8, padding: 12, borderRadius: 14, backgroundColor: C.card, gap: 4 },
  changeTitle: { ...typo.callout, fontWeight: '700', marginTop: 4 },
  effect: { ...typo.footnote, color: C.blueL },
  cmpHead: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 4 },
  cmpH: { ...typo.caption, width: 44, textAlign: 'right', fontWeight: '700', color: C.dim },
  cmp: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  cmpLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 6 },
  cmpName: { ...typo.footnote, color: C.sub, flex: 1 },
  cmpN: { width: 36, textAlign: 'right', color: C.sub, fontSize: 13, fontVariant: ['tabular-nums'] },
  cmpArrow: { width: 14, textAlign: 'center', color: C.dim, fontSize: 12 },
  cmpB: { width: 36, textAlign: 'right', color: C.text, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cmpD: { width: 40, alignItems: 'flex-end' },
  pitches: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: space.md },
  pitchCol: { alignItems: 'center', gap: 4 },
  pitchCap: { fontSize: 12, lineHeight: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
