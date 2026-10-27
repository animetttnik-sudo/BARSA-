import React, { useMemo } from 'react';
import { View } from 'react-native';
import { planSubs } from '../model/subs';
import { applyPatch } from '../model/setup';
import { useStore } from '../state';
import { Badge, Btn, Card, Disclaimer, H, Row, T } from '../ui/kit';
import { EnergyChart } from '../ui/charts';
import { C } from '../ui/theme';

export function SubsScreen({ W }: { W: number }) {
  const { setup, commit } = useStore();
  const plan = useMemo(() => planSubs(setup), [setup]);
  const windows = [...new Set(plan.subs.map((s) => s.window))];
  return (
    <View>
      <Card>
        <H>Планировщик замен</H>
        <T dim small>Энергия каждого полевого игрока по ходу матча (модель): расход зависит от роли (прессинг, забегания), подхода в обороне, стиля розыгрыша, атрибута Stamina и PlayStyle Relentless. Красная полоса — зона, где игрок заметно теряет скорость и точность.</T>
        <View style={{ marginTop: 8 }}><EnergyChart curves={plan.curves} W={W - 26} subs={plan.subs} /></View>
      </Card>
      <Card accent={C.gold}>
        <H>Кого и когда менять</H>
        {plan.subs.length === 0 ? <T dim small>По модели никто не «садится» критично — замены можно делать по ситуации (жёлтые карточки, счёт).</T> : null}
        {windows.map((w) => (
          <View key={w} style={{ marginBottom: 10 }}>
            <Badge label={`Окно ${w}`} color={C.gold} />
            {plan.subs.filter((s) => s.window === w).map((s) => (
              <View key={s.outId} style={{ marginTop: 6, padding: 8, backgroundColor: C.card2, borderRadius: 10 }}>
                <T b>{s.minute}' · {s.outRu} → {s.inRu} <T dim small>({s.slot})</T></T>
                <T dim small>{s.reasonRu}</T>
                <Btn label="Применить к составу" kind="ghost" onPress={() => commit(applyPatch(setup, s.patch), `Замена: ${s.outRu} → ${s.inRu}`)} style={{ marginTop: 6, paddingVertical: 6 }} />
              </View>
            ))}
          </View>
        ))}
        <T dim small>Не больше 5 замен в 3 окна (+ перерыв), как в правилах FC 26.</T>
      </Card>
      <Card accent={C.blueL}>
        <H>Когда менять тактику</H>
        {plan.tactics.map((t, i) => (
          <View key={i} style={{ marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderColor: C.line }}>
            <Row style={{ flexWrap: 'wrap' }}><Badge label={t.window + "'"} color={C.blueL} /><T small b>{t.situationRu}</T></Row>
            <T small style={{ marginTop: 4, color: C.gold }}>{t.changeRu}</T>
            <T dim small>{t.reasonRu}</T>
            {t.patch ? <Btn label="Попробовать (можно отменить)" kind="ghost" onPress={() => commit(applyPatch(setup, t.patch!), `${t.window}: ${t.changeRu}`)} style={{ marginTop: 6, paddingVertical: 6 }} /> : null}
          </View>
        ))}
      </Card>
      <T dim small>{plan.noteRu}</T>
      <Disclaimer compact />
    </View>
  );
}
