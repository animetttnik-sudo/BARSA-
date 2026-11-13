import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { planSubs, type SubRec, type TacticRec } from '../model/subs';
import { evaluate } from '../model/engine';
import { applyPatch } from '../model/setup';
import { useStore } from '../state';
import { BoltIcon, RepeatIcon, ShieldIcon, type IconProps } from '../ui/icons';
import { Btn, Card, Disclaimer, H, Row } from '../ui/kit';
import { EnergyChart, type EnergyMode } from '../ui/charts';
import { C, radius, space, type as typo } from '../ui/theme';

type Mark = '60' | '70' | '85';
const MARKS: { id: Mark; label: string }[] = [
  { id: '60', label: "60'" },
  { id: '70', label: "70+'" },
  { id: '85', label: "85+'" },
];

function subMark(minute: number): Mark {
  if (minute >= 85) return '85';
  if (minute >= 65) return '70';
  return '60';
}

function tacticMark(window: string): 'start' | Mark {
  if (window.startsWith('85')) return '85';
  if (window.startsWith('0')) return 'start';
  if (window.startsWith('70') || window.startsWith('65') || window.startsWith('75') || window.startsWith('80')) return '70';
  return '60';
}

function TacticGlyph({ situation, ...rest }: { situation: string } & IconProps) {
  const Icon = situation.includes('Проигрыва') ? BoltIcon : situation.includes('Ведёшь') ? ShieldIcon : RepeatIcon;
  return <Icon {...rest} />;
}

export function SubsScreen({ W }: { W: number }) {
  const { setup, ev, commit } = useStore();
  const plan = useMemo(() => planSubs(setup), [setup]);
  const energy = useMemo(() => {
    const other = evaluate({ ...setup, matchMode: setup.matchMode === 'authentic' ? 'competitive' : 'authentic' });
    const authRisk = setup.matchMode === 'authentic' ? ev.risks.fatigue : other.risks.fatigue;
    const compRisk = setup.matchMode === 'competitive' ? ev.risks.fatigue : other.risks.fatigue;
    const ratio = authRisk > 0 ? Math.min(1, compRisk / authRisk) : 1;
    const authentic = Array.from({ length: plan.curves[0]?.points.length ?? 19 }, (_, k) => {
      if (!plan.curves.length) return 100;
      const sum = plan.curves.reduce((m, c) => m + (c.points[k] ?? 0), 0);
      return Math.round(sum / plan.curves.length);
    });
    const competitive = authentic.map((e) => Math.round(100 - (100 - e) * ratio));
    const modes: EnergyMode[] = [
      { id: 'authentic', label: 'Authentic', points: authentic, risk: authRisk },
      { id: 'competitive', label: 'Competitive', points: competitive, risk: compRisk },
    ];
    return { modes, ratio };
  }, [setup, ev, plan.curves]);
  const start = plan.tactics.filter((t) => tacticMark(t.window) === 'start');
  const buckets = MARKS.map((m) => ({
    ...m,
    subs: plan.subs.filter((s) => subMark(s.minute) === m.id),
    tactics: plan.tactics.filter((t) => tacticMark(t.window) === m.id),
  }));
  return (
    <View>
      <Card>
        <Row gap={8}>
          <RepeatIcon size={18} color={C.garnetL} />
          <H style={styles.hFlat}>Выносливость</H>
        </Row>
        <Text style={styles.note}>
          Тонкие линии — полевые. Сплошная средняя — текущий режим, пунктир — второй. Competitive мягче на коэффициент риска усталости ×{energy.ratio.toFixed(2)}.
        </Text>
        <View style={{ marginTop: space.sm }}>
          <EnergyChart curves={plan.curves} W={Math.max(240, W - 28)} subs={plan.subs} modes={energy.modes} active={setup.matchMode} />
        </View>
        <Text style={[styles.note, { marginTop: space.sm }]}>Полоса — порог, где падают скорость и точность. Золотые точки — минуты замен.</Text>
      </Card>

      {start.length ? (
        <Card>
          <Text style={styles.kicker}>До 60'</Text>
          {start.map((t, i) => <TacticCard key={`s-${i}`} t={t} onTry={() => t.patch && commit(applyPatch(setup, t.patch), `${t.window}: ${t.changeRu}`)} />)}
        </Card>
      ) : null}

      <Card>
        <H>Окна замен</H>
        <Text style={styles.note}>Три окна трансляции. Минута на карточке — расчёт модели, не круглая отсечка.</Text>
        <View style={{ marginTop: space.md }}>
          {buckets.map((b, i) => (
            <View key={b.id} style={styles.window}>
              <Text style={styles.mark}>{b.label}</Text>
              <View style={styles.railLine}>
                <View style={styles.markDot} />
                {i < buckets.length - 1 ? <View style={styles.stem} /> : null}
              </View>
              <View style={styles.windowBody}>
                {b.subs.length + b.tactics.length === 0 ? <Text style={styles.note}>В это окно модель замену не ставит.</Text> : null}
                {b.subs.map((s) => (
                  <SubCard key={s.outId} s={s} onTry={() => commit(applyPatch(setup, s.patch), `Замена: ${s.outRu} → ${s.inRu}`)} />
                ))}
                {b.tactics.map((t, k) => (
                  <TacticCard key={`${b.id}-${k}`} t={t} onTry={() => t.patch && commit(applyPatch(setup, t.patch), `${t.window}: ${t.changeRu}`)} />
                ))}
              </View>
            </View>
          ))}
        </View>
        <Text style={[styles.note, { marginTop: 4 }]}>До 5 замен в 3 окна, плюс перерыв — как в FC 26.</Text>
      </Card>
      <Text style={[styles.note, { marginBottom: space.sm }]}>{plan.noteRu}</Text>
      <Disclaimer compact />
    </View>
  );
}

function SubCard({ s, onTry }: { s: SubRec; onTry: () => void }) {
  const col = s.energyAtSub < 56 ? C.bad : s.energyAtSub <= 64 ? C.warn : C.good;
  return (
    <View style={styles.item}>
      <View style={styles.itemTop}>
        <Text style={styles.minute}>{s.minute}'</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.out} numberOfLines={1}>{s.outRu}</Text>
          <Text style={styles.in} numberOfLines={1}>{s.inRu}</Text>
        </View>
        <View style={[styles.energy, { backgroundColor: col + '22' }]}>
          <Text style={[styles.energyT, { color: col }]}>{s.energyAtSub}%</Text>
        </View>
      </View>
      <Text style={styles.meta}>{s.slot} · окно {s.window}</Text>
      <Text style={styles.note} numberOfLines={3}>{s.reasonRu}</Text>
      <Btn label="Попробовать" kind="ghost" icon={<RepeatIcon size={15} color={C.text} />} onPress={onTry} style={{ marginTop: 8, paddingVertical: 8 }} />
    </View>
  );
}

function TacticCard({ t, onTry }: { t: TacticRec; onTry: () => void }) {
  return (
    <View style={styles.item}>
      <Row gap={8}>
        <TacticGlyph situation={t.situationRu} size={16} color={C.blueL} />
        <Text style={styles.situation}>{t.situationRu}</Text>
        <Text style={styles.windowTag}>{t.window}</Text>
      </Row>
      <Text style={styles.change}>{t.changeRu}</Text>
      <Text style={styles.note} numberOfLines={3}>{t.reasonRu}</Text>
      {t.patch ? <Btn label="Попробовать" kind="ghost" icon={<RepeatIcon size={15} color={C.text} />} onPress={onTry} style={{ marginTop: 8, paddingVertical: 8 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hFlat: { marginBottom: 0, flex: 1 },
  kicker: { ...typo.caption, color: C.gold, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  note: { ...typo.footnote, color: C.sub, marginTop: 4 },
  window: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  mark: { width: 48, textAlign: 'right', color: C.gold, fontSize: 16, lineHeight: 20, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  railLine: { width: 12, alignItems: 'center' },
  markDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold, marginTop: 6 },
  stem: { width: StyleSheet.hairlineWidth, flex: 1, backgroundColor: C.line, marginTop: 4 },
  windowBody: { flex: 1, gap: 8, paddingBottom: 16 },
  item: { backgroundColor: C.card2, borderRadius: radius.md, padding: 12, gap: 4 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  minute: { color: C.text, fontSize: 18, lineHeight: 22, fontWeight: '700', fontVariant: ['tabular-nums'], width: 40 },
  out: { ...typo.footnote, color: C.sub },
  in: { ...typo.callout, fontWeight: '700' },
  energy: { minWidth: 48, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, alignItems: 'center' },
  energyT: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  meta: { ...typo.caption, fontVariant: ['tabular-nums'] },
  situation: { ...typo.footnote, color: C.text, fontWeight: '700', flex: 1 },
  windowTag: { ...typo.caption, color: C.blueL, fontWeight: '700', fontVariant: ['tabular-nums'] },
  change: { ...typo.callout, fontWeight: '600', marginTop: 2 },
});