import React, { useMemo } from 'react';
import { View } from 'react-native';
import { planSubs } from '../model/subs';
import { applyPatch } from '../model/setup';
import { useStore } from '../state';
import { Badge, Btn, Card, Row, SectionTitle, T, useExplain } from '../ui/kit';
import { EnergyChart } from '../ui/charts';
import { C } from '../ui/theme';

export function SubsScreen({ W }: { W: number }) {
  const { setup, commit } = useStore();
  const explain = useExplain();
  const plan = useMemo(() => planSubs(setup), [setup]);
  const windows = [...new Set(plan.subs.map((s) => s.window))];
  return (
    <View>
      <Card>
        <SectionTitle>Энергия</SectionTitle>
        <EnergyChart curves={plan.curves} W={W - 26} subs={plan.subs} />
      </Card>
      <Card accent={C.gold}>
        <SectionTitle onExplain={() => explain.open('Замены', plan.subs.length ? plan.subs.map((s) => `${s.minute}' · ${s.outRu} → ${s.inRu}. ${s.reasonRu}`).join('\n\n') + `\n\n${plan.noteRu}` : plan.noteRu)}>Кого менять</SectionTitle>
        {windows.map((w) => (
          <View key={w} style={{ marginBottom: 12 }}>
            <Badge label={w} color={C.gold} />
            {plan.subs.filter((s) => s.window === w).map((s) => (
              <View key={s.outId} style={{ marginTop: 8, padding: 10, backgroundColor: C.card2, borderRadius: 12 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T b style={{ flex: 1, fontSize: 17 }}>{s.minute}' · {s.outRu} → {s.inRu}</T>
                </Row>
                <Btn label="В состав" kind="ghost" onPress={() => commit(applyPatch(setup, s.patch), `Замена: ${s.outRu} → ${s.inRu}`)} style={{ marginTop: 8 }} />
              </View>
            ))}
          </View>
        ))}
      </Card>
      <Card accent={C.blueL}>
        <SectionTitle onExplain={() => explain.open('Тактика по ходу', plan.tactics.map((t) => `${t.window}' · ${t.situationRu}. ${t.changeRu} ${t.reasonRu}`).join('\n\n'))}>Когда менять</SectionTitle>
        {plan.tactics.map((t, i) => (
          <View key={i} style={{ marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderColor: C.line }}>
            <Row style={{ flexWrap: 'wrap' }} gap={8}>
              <Badge label={`${t.window}'`} color={C.blueL} />
              <T b style={{ fontSize: 16 }}>{t.situationRu}</T>
            </Row>
            <T style={{ marginTop: 6, color: C.gold, fontSize: 16, fontWeight: '700' }}>{t.changeRu}</T>
            {t.patch ? <Btn label="Попробовать" kind="ghost" onPress={() => commit(applyPatch(setup, t.patch!), `${t.window}: ${t.changeRu}`)} style={{ marginTop: 8 }} /> : null}
          </View>
        ))}
      </Card>
      {explain.sheet}
    </View>
  );
}
