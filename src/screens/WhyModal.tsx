import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { CATEGORY_RU, Category, diagnose, Diagnosis } from '../model/diagnose';
import { getFormation } from '../model/data';
import { useStore } from '../state';
import { ArrowUpRightIcon, FlagIcon, LayersIcon, ShieldCheckIcon, type IconProps } from '../ui/icons';
import { Badge, Btn, Card, Delta, Disclaimer, H, Row, Sheet, Spinner, T } from '../ui/kit';
import { Pitch } from '../ui/Pitch';
import { C, riskColor, scoreColor } from '../ui/theme';
import { BUILDUP_RU, APPROACH_RU } from '../ui/labels';

const CATS: { id: Category; Icon: React.ComponentType<IconProps> }[] = [
  { id: 'defence', Icon: ShieldCheckIcon },
  { id: 'possession', Icon: LayersIcon },
  { id: 'attack', Icon: ArrowUpRightIcon },
  { id: 'all', Icon: FlagIcon },
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
  const row = (label: string, a: number, b: number, invert?: boolean) => (
    <Row key={label} style={{ paddingVertical: 6, borderBottomWidth: 1, borderColor: C.line, minHeight: 40 }}>
      <Text style={{ color: C.text, flex: 1, fontSize: 16, paddingRight: 6 }}>{label}</Text>
      <Text style={{ color: C.text, width: 36, textAlign: 'right', fontSize: 16, fontVariant: ['tabular-nums'] }}>{a}</Text>
      <Text style={{ color: C.dim, width: 18, textAlign: 'center', fontSize: 16 }}>→</Text>
      <Text style={{ color: C.text, width: 36, fontWeight: '800', fontSize: 16, fontVariant: ['tabular-nums'] }}>{b}</Text>
      <View style={{ width: 48, alignItems: 'flex-end' }}><Delta v={b - a} invert={invert} /></View>
    </Row>
  );
  return (
    <Sheet visible={visible} onClose={onClose} title="Почему не работает?"
      footer={res && res.improved ? <Btn testID="why-apply" label="Применить" kind="gold" onPress={apply} style={{ marginTop: 8 }} /> : null}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CATS.map((c) => (
          <View key={c.id} style={{ width: '48%' }}>
            <Btn testID={`why-${c.id}`} label={CATEGORY_RU[c.id]} icon={<c.Icon size={18} color={cat === c.id ? '#fff' : C.sub} />} kind={cat === c.id ? 'garnet' : 'ghost'} onPress={() => run(c.id)} disabled={busy} />
          </View>
        ))}
      </View>
      {busy ? <Spinner label="Считаю вариант" /> : null}
      {res ? (
        <View style={{ marginTop: 14 }}>
          <H>Диагноз</H>
          {res.issues.length ? res.issues.map((i, k) => (
            <Card key={k} accent={i.severity >= 60 ? C.bad : i.severity >= 38 ? C.warn : C.sub} style={{ backgroundColor: C.card2 }}>
              <T b style={{ fontSize: 17 }}>{i.titleRu}</T>
              <T style={{ fontSize: 16, marginTop: 4 }}>{i.reasonRu}</T>
            </Card>
          )) : <T style={{ fontSize: 16 }}>Явных проблем в этой категории нет.</T>}
          <H style={{ marginTop: 8 }}>Альтернатива</H>
          {!res.improved ? <T style={{ fontSize: 16 }}>Текущая тактика уже близка к лучшей по этой категории.</T> : (
            <>
              <T style={{ fontSize: 16 }}>{getFormation(res.alternative.formationId).name} · {BUILDUP_RU[res.alternative.buildUp]} · {APPROACH_RU[res.alternative.defApproach]} · {res.alternative.lineHeight}</T>
              {res.changes.map((ch, k) => (
                <View key={k} style={{ marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: C.card }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Badge label={KIND_RU[ch.kind]} color={ch.kind === 'swap' ? C.garnetL : ch.kind === 'role' ? C.gold : C.blueL} />
                    {ch.contribution ? <Delta v={ch.contribution} /> : null}
                  </Row>
                  <T b style={{ marginTop: 6, fontSize: 17 }}>{ch.titleRu}</T>
                  <T style={{ fontSize: 16, marginTop: 4 }}>{ch.reasonRu}</T>
                </View>
              ))}
              <H style={{ marginTop: 12 }}>До и после</H>
              {row(res.objectiveRu, Math.round(res.objectiveBefore), Math.round(res.objectiveAfter))}
              {row('Опасность', res.before.rating, res.after.rating)}
              {row('Атака', res.before.attackScore, res.after.attackScore)}
              {row('Риск', res.before.defRisk, res.after.defRisk, true)}
              {res.before.defence.map((c) => { const a = res.after.defence.find((x) => x.id === c.id)!; return Math.abs(a.value - c.value) >= 5 ? row(c.nameRu, c.value, a.value, true) : null; })}
              {res.before.attack.map((c) => { const a = res.after.attack.find((x) => x.id === c.id)!; return Math.abs(a.value - c.value) >= 5 ? row(c.nameRu, c.value, a.value) : null; })}
              <Row style={{ marginTop: 12, alignItems: 'flex-start' }} gap={8}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Pitch setup={setup} ev={res.before} W={half} small mode="out" />
                  <Text style={{ color: scoreColor(res.before.rating), fontSize: 16, fontWeight: '800', marginTop: 4 }}>{res.before.rating}</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Pitch setup={res.alternative} ev={res.after} W={half} small mode="out" />
                  <Text style={{ color: scoreColor(res.after.rating), fontSize: 16, fontWeight: '800', marginTop: 4 }}>{res.after.rating}</Text>
                </View>
              </Row>
              <Text style={{ color: C.text, fontSize: 16, marginTop: 8 }}>Риск после: <Text style={{ color: riskColor(res.after.defRisk), fontWeight: '800' }}>{res.after.defRisk}</Text></Text>
            </>
          )}
          <Disclaimer />
        </View>
      ) : null}
    </Sheet>
  );
}
