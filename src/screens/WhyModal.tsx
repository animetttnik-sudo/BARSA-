import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { CATEGORY_RU, Category, diagnose, Diagnosis } from '../model/diagnose';
import { getFormation } from '../model/data';
import { useStore } from '../state';
import { BallIcon, RepeatIcon, ShieldIcon, SparkIcon, type IconProps } from '../ui/icons';
import { Badge, Btn, Card, Delta, Disclaimer, H, Row, Sheet, Spinner, T } from '../ui/kit';
import { Pitch } from '../ui/Pitch';
import { C, riskColor, scoreColor } from '../ui/theme';
import { BUILDUP_RU, APPROACH_RU } from '../ui/labels';

const CATS: { id: Category; Icon: React.ComponentType<IconProps>; hint: string }[] = [
  { id: 'defence', Icon: ShieldIcon, hint: 'Пропускаем с контратак, за спину, с флангов' },
  { id: 'possession', Icon: RepeatIcon, hint: 'Теряем мяч, не можем выйти из обороны' },
  { id: 'attack', Icon: BallIcon, hint: 'Мало моментов, нет забеганий, нет людей в штрафной' },
  { id: 'all', Icon: SparkIcon, hint: 'Всё сразу — ищем лучший общий баланс' },
];
const KIND_RU = { formation: 'СХЕМА', tactic: 'ТАКТИКА', role: 'РОЛЬ', swap: 'ИГРОК' };

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
  const apply = () => { if (!res) return; commit(res.alternative, `«Почему не работает»: ${CATEGORY_RU[res.category]}`); onClose(); };
  const half = (W - 52) / 2;
  const row = (label: string, a: number, b: number, invert?: boolean, icon?: React.ReactNode) => (
    <Row key={label} style={{ paddingVertical: 4, borderBottomWidth: 1, borderColor: C.line }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 6 }}>
        {icon}
        <Text style={{ color: C.sub, flex: 1, fontSize: 12.5 }}>{label}</Text>
      </View>
      <Text style={{ color: C.text, width: 40, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{a}</Text>
      <Text style={{ color: C.dim, width: 18, textAlign: 'center' }}>→</Text>
      <Text style={{ color: C.text, width: 34, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{b}</Text>
      <View style={{ width: 36, alignItems: 'flex-end' }}><Delta v={b - a} invert={invert} /></View>
    </Row>
  );
  return (
    <Sheet visible={visible} onClose={onClose} title="Почему не работает?"
      footer={res && res.improved ? <Btn testID="why-apply" label="Применить альтернативу" kind="gold" onPress={apply} style={{ marginTop: 8 }} /> : null}>
      <T dim small style={{ marginBottom: 8 }}>Выбери, что не получается в игре. Модель найдёт причины в текущей тактике и подберёт альтернативу (схема, тактика, роли, до 3 игроков) — с объяснением каждого изменения.</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CATS.map((c) => (
          <View key={c.id} style={{ width: '48%' }}>
            <Btn testID={`why-${c.id}`} label={CATEGORY_RU[c.id]} icon={<c.Icon size={16} color={cat === c.id ? '#fff' : C.sub} focused={cat === c.id} />} kind={cat === c.id ? 'garnet' : 'ghost'} onPress={() => run(c.id)} disabled={busy} />
            <Text style={{ color: C.dim, fontSize: 10.5, marginTop: 2, textAlign: 'center' }}>{c.hint}</Text>
          </View>
        ))}
      </View>
      {busy ? <Spinner label="Перебираю схемы, роли, тактику и замены…" /> : null}
      {res ? (
        <View style={{ marginTop: 12 }}>
          <H>Диагноз</H>
          {res.issues.length ? res.issues.map((i, k) => (
            <Card key={k} accent={i.severity >= 60 ? C.bad : i.severity >= 38 ? C.warn : C.sub} style={{ backgroundColor: C.card2 }}>
              <T b>{i.titleRu}</T>
              <T dim small>{i.reasonRu}</T>
            </Card>
          )) : <T dim small>Явных проблем в этой категории модель не видит.</T>}
          <H style={{ marginTop: 6 }}>Альтернатива</H>
          {!res.improved ? <T small>Текущая тактика уже близка к лучшей по этой категории — заметно лучше вариант не найден. Смотри советы «вручную» на вкладке «Контра −».</T> : (
            <>
              <T dim small>{getFormation(res.alternative.formationId).name} · {BUILDUP_RU[res.alternative.buildUp]} · {APPROACH_RU[res.alternative.defApproach]} ({res.alternative.lineHeight})</T>
              {res.changes.map((ch, k) => (
                <View key={k} style={{ marginTop: 8, padding: 8, borderRadius: 10, backgroundColor: C.card }}>
                  <Row style={{ justifyContent: 'space-between' }}><Badge label={KIND_RU[ch.kind]} color={ch.kind === 'swap' ? C.garnetL : ch.kind === 'role' ? C.gold : C.blueL} />{ch.contribution ? <Row gap={4}><T dim small>вклад</T><Delta v={ch.contribution} /></Row> : null}</Row>
                  <T b style={{ marginTop: 4 }}>{ch.titleRu}</T>
                  <T dim small>{ch.reasonRu}</T>
                  {ch.topEffectsRu ? <T small style={{ color: '#b9c9ff' }}>Эффект: {ch.topEffectsRu}</T> : null}
                </View>
              ))}
              <H style={{ marginTop: 12 }}>До / после</H>
              {row('Цель: ' + res.objectiveRu, Math.round(res.objectiveBefore), Math.round(res.objectiveAfter))}
              {row('Рейтинг опасности', res.before.rating, res.after.rating)}
              {row('Атака', res.before.attackScore, res.after.attackScore)}
              {row('Риск в обороне', res.before.defRisk, res.after.defRisk, true)}
              {res.before.defence.map((c) => { const a = res.after.defence.find((x) => x.id === c.id)!; return Math.abs(a.value - c.value) >= 5 ? row(c.nameRu, c.value, a.value, true, <ShieldIcon size={12} color={C.sub} />) : null; })}
              {res.before.attack.map((c) => { const a = res.after.attack.find((x) => x.id === c.id)!; return Math.abs(a.value - c.value) >= 5 ? row(c.nameRu, c.value, a.value, false, <BallIcon size={12} color={C.sub} />) : null; })}
              <Row style={{ marginTop: 10, alignItems: 'flex-start' }} gap={8}>
                <View style={{ alignItems: 'center' }}><Pitch setup={setup} ev={res.before} W={half} small mode="out" /><Text style={{ color: scoreColor(res.before.rating), fontSize: 12 }}>Сейчас · {res.before.rating}</Text></View>
                <View style={{ alignItems: 'center' }}><Pitch setup={res.alternative} ev={res.after} W={half} small mode="out" /><Text style={{ color: scoreColor(res.after.rating), fontSize: 12 }}>Альтернатива · {res.after.rating}</Text></View>
              </Row>
              <T dim small style={{ marginTop: 4 }}>Риск в обороне после: <Text style={{ color: riskColor(res.after.defRisk) }}>{res.after.defRisk}</Text>. Кнопка ниже применит всё сразу; отменить можно на вкладке «Сводка».</T>
            </>
          )}
          <Disclaimer compact />
        </View>
      ) : null}
    </Sheet>
  );
}
