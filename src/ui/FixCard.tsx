import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { evaluate } from '../model/engine';
import { applyPatch } from '../model/setup';
import type { Fix } from '../model/fixes';
import { useStore } from '../state';
import { ChevronIcon, PitchIcon } from './icons';
import { Btn, Card, Delta, Metric, Row, T } from './kit';
import { Pitch } from './Pitch';
import { C, radius, riskColor, scoreColor, space, type as typo } from './theme';
import { diffSetups } from './diff';

const TYPE: Record<string, { ru: string; c: string }> = {
  tactic: { ru: 'Тактика', c: C.blueL },
  role: { ru: 'Роль', c: C.gold },
  swap: { ru: 'Состав', c: C.garnetL },
  manual: { ru: 'Вручную', c: C.sub },
  formation: { ru: 'Схема', c: C.good },
};

function Pill({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillL}>{label}</Text>
      <Text style={[styles.pillV, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function Mini({ label, a, b, invert }: { label: string; a: number; b: number; invert?: boolean }) {
  const d = b - a;
  const good = invert ? d < 0 : d > 0;
  const color = d === 0 ? C.text : good ? C.good : C.bad;
  return (
    <View style={styles.mini}>
      <Text style={styles.miniL}>{label}</Text>
      <Text style={styles.miniN}>
        {a}
        <Text style={{ color: C.dim }}> → </Text>
        <Text style={{ color }}>{b}</Text>
      </Text>
    </View>
  );
}

export function FixCard({ fix, W, metricLabel, minimize = true }: { fix: Fix; W: number; metricLabel: string; minimize?: boolean }) {
  const { setup, ev, commit } = useStore();
  const [open, setOpen] = useState(false);
  const t = TYPE[fix.type] ?? { ru: fix.type, c: C.sub };
  const preview = useMemo(() => {
    if (!open || !fix.patch) return null;
    const s = applyPatch(setup, fix.patch);
    const e = evaluate(s);
    const changed = e.slots.filter((x) => {
      const a = setup.slots[x.slot.id];
      const b = s.slots[x.slot.id];
      return !a || a.playerId !== b.playerId || a.roleId !== b.roleId || a.focus !== b.focus;
    }).map((x) => x.slot.id);
    return { s, e, changed, diff: diffSetups(setup, s) };
  }, [open, fix, setup]);
  const delta = fix.before && fix.after ? fix.after.metric - fix.before.metric : 0;
  const good = minimize ? delta < 0 : delta > 0;
  const afterColor = delta === 0 ? C.text : good ? C.good : C.bad;
  return (
    <Card style={styles.card}>
      <Text style={[styles.kicker, { color: t.c }]}>{t.ru}</Text>
      <Text style={styles.title}>{fix.titleRu}</Text>
      {fix.before && fix.after ? (
        <View style={styles.baBlock}>
          <Text style={styles.metricL}>{metricLabel}</Text>
          <View style={styles.baRow}>
            <Pill label="Было" value={fix.before.metric} />
            <ChevronIcon size={16} color={C.dim} />
            <Pill label="Станет" value={fix.after.metric} color={afterColor} />
            <Delta v={delta} invert={minimize} />
          </View>
        </View>
      ) : null}
      {fix.patch ? (
        <View style={styles.actions}>
          <Btn label="Попробовать (можно отменить)" onPress={() => commit(applyPatch(setup, fix.patch!), fix.titleRu)} />
        </View>
      ) : null}
      <Text style={styles.reason} numberOfLines={fix.patch ? 3 : 6}>{fix.reasonRu}</Text>
      {fix.before && fix.after ? (
        <View style={styles.minis}>
          <Mini label="Рейтинг" a={fix.before.rating} b={fix.after.rating} />
          <Mini label="Атака" a={fix.before.attack} b={fix.after.attack} />
          <Mini label="Риск" a={fix.before.defRisk} b={fix.after.defRisk} invert />
        </View>
      ) : null}
      {fix.patch ? (
        <Btn
          label={open ? 'Скрыть поле' : 'Показать на поле'}
          kind="ghost"
          icon={<PitchIcon size={16} color={C.text} />}
          onPress={() => setOpen((v) => !v)}
          style={{ marginTop: space.sm }}
        />
      ) : null}
      {preview ? (
        <View style={styles.preview}>
          <Row style={styles.previewMetrics}>
            <Metric label="Рейтинг" value={preview.e.rating} color={scoreColor(preview.e.rating)} delta={preview.e.rating - ev.rating} />
            <Metric label="Атака" value={preview.e.attackScore} delta={preview.e.attackScore - ev.attackScore} />
            <Metric label="Риск" value={preview.e.defRisk} color={riskColor(preview.e.defRisk)} delta={preview.e.defRisk - ev.defRisk} invert />
          </Row>
          {preview.diff.map((d, i) => (
            <View key={i} style={styles.diffRow}>
              <View style={styles.diffDot} />
              <T small style={{ flex: 1 }}>{d}</T>
            </View>
          ))}
          <View style={{ marginTop: space.sm, alignItems: 'center' }}>
            <Pitch
              setup={preview.s}
              ev={preview.e}
              W={Math.max(220, W - 64)}
              mode="out"
              highlight={preview.changed.length < 11 ? preview.changed : undefined}
              label="Предпросмотр · без мяча"
            />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card2 },
  kicker: { ...typo.caption, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  title: { ...typo.title, marginBottom: 4 },
  reason: { ...typo.footnote, color: C.sub },
  baBlock: { marginTop: space.md, gap: 8 },
  metricL: { ...typo.caption, color: C.dim },
  baRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: C.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
  },
  pillL: { ...typo.caption, color: C.dim },
  pillV: { ...typo.metric, fontSize: 20, lineHeight: 24 },
  minis: { flexDirection: 'row', gap: 8 },
  mini: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 2,
  },
  miniL: { ...typo.caption, color: C.dim },
  miniN: { ...typo.caption, color: C.text, fontWeight: '700', fontVariant: ['tabular-nums'] },
  actions: { marginTop: space.md, gap: 8 },
  preview: { marginTop: space.md, gap: 6 },
  previewMetrics: { alignSelf: 'stretch', marginBottom: 4 },
  diffRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 3 },
  diffDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.gold, marginTop: 6 },
});
