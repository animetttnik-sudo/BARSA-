import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { evaluate } from '../model/engine';
import { applyPatch } from '../model/setup';
import type { Fix } from '../model/fixes';
import { useStore } from '../state';
import { Badge, Btn, Card, Delta, ExplainButton, Metric, Row, Sheet, T } from './kit';
import { Pitch } from './Pitch';
import { C, riskColor, scoreColor } from './theme';
import { diffSetups } from './diff';

const TYPE: Record<string, { ru: string; c: string }> = {
  tactic: { ru: 'ТАКТИКА', c: C.blueL }, role: { ru: 'РОЛЬ', c: C.gold }, swap: { ru: 'ЗАМЕНА', c: C.garnetL }, manual: { ru: 'ВРУЧНУЮ', c: '#B07CFF' }, formation: { ru: 'СХЕМА', c: C.good },
};

export function FixCard({ fix, W, metricLabel, minimize = true }: { fix: Fix; W: number; metricLabel: string; minimize?: boolean }) {
  const { setup, ev, commit } = useStore();
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState(false);
  const t = TYPE[fix.type];
  const preview = useMemo(() => {
    if (!open || !fix.patch) return null;
    const s = applyPatch(setup, fix.patch);
    const e = evaluate(s);
    const changed = e.slots.filter((x) => { const a = setup.slots[x.slot.id]; const b = s.slots[x.slot.id]; return !a || a.playerId !== b.playerId || a.roleId !== b.roleId || a.focus !== b.focus; }).map((x) => x.slot.id);
    return { s, e, changed, diff: diffSetups(setup, s) };
  }, [open, fix, setup]);
  return (
    <Card accent={t.c} style={{ backgroundColor: C.card2 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Badge label={t.ru} color={t.c} />
        <Row gap={8}>
          {fix.before && fix.after ? (
            <Row gap={6}>
              <T>{metricLabel} {fix.before.metric}→{fix.after.metric}</T>
              <Delta v={fix.after.metric - fix.before.metric} invert={minimize} />
            </Row>
          ) : null}
          <ExplainButton onPress={() => setWhy(true)} />
        </Row>
      </Row>
      <T b style={{ marginTop: 8, fontSize: 17 }}>{fix.titleRu}</T>
      {fix.before && fix.after ? (
        <Row style={{ marginTop: 8 }} gap={12}>
          <T>Рейтинг {fix.before.rating}→{fix.after.rating}</T><Delta v={fix.after.rating - fix.before.rating} />
          <T>Атака</T><Delta v={fix.after.attack - fix.before.attack} />
          <T>Риск</T><Delta v={fix.after.defRisk - fix.before.defRisk} invert />
        </Row>
      ) : null}
      {fix.patch ? (
        <Row style={{ marginTop: 10 }}>
          <Btn label={open ? 'Скрыть' : 'Предпросмотр'} kind="ghost" onPress={() => setOpen(!open)} style={{ flex: 1 }} />
          <Btn label="Применить" onPress={() => commit(applyPatch(setup, fix.patch!), fix.titleRu)} style={{ flex: 1 }} />
        </Row>
      ) : null}
      {preview ? (
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <Row style={{ marginBottom: 8, alignSelf: 'stretch' }}>
            <Metric label="Рейтинг" value={preview.e.rating} color={scoreColor(preview.e.rating)} delta={preview.e.rating - ev.rating} />
            <Metric label="Атака" value={preview.e.attackScore} delta={preview.e.attackScore - ev.attackScore} />
            <Metric label="Риск" value={preview.e.defRisk} color={riskColor(preview.e.defRisk)} delta={preview.e.defRisk - ev.defRisk} invert />
          </Row>
          {preview.diff.map((d, i) => <T key={i} style={{ alignSelf: 'stretch', fontSize: 16 }}>{d}</T>)}
          <View style={{ marginTop: 8 }}>
            <Pitch setup={preview.s} ev={preview.e} W={W - 50} mode="out" highlight={preview.changed.length < 11 ? preview.changed : undefined} />
          </View>
        </View>
      ) : null}
      <Sheet visible={why} onClose={() => setWhy(false)} title={fix.titleRu}>
        <Text style={{ color: C.text, fontSize: 17, lineHeight: 24 }}>{fix.reasonRu}</Text>
      </Sheet>
    </Card>
  );
}
