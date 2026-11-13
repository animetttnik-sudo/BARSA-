import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { G, Rect } from 'react-native-svg';
import { vulnerabilities } from '../model/fixes';
import { useStore } from '../state';
import { haptic } from '../ui/haptics';
import { ShieldIcon } from '../ui/icons';
import { Bar, Card, Disclaimer, H, Row, T } from '../ui/kit';
import { Pitch, pitchH, PAD } from '../ui/Pitch';
import { FixCard } from '../ui/FixCard';
import { C, riskColor, sevColor, space, type as typo } from '../ui/theme';

const SEV_RU = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };

export function CounterMinusScreen({ W }: { W: number }) {
  const { setup, ev } = useStore();
  const zones = useMemo(() => vulnerabilities(setup, ev), [setup, ev]);
  const [sel, setSel] = useState<string | null>(null);
  const selId = sel ?? zones[0]?.id;
  const z = zones.find((x) => x.id === selId);
  const pick = (id: string) => { haptic('selection'); setSel(id); };
  const PH = pitchH(W);
  const iw = W - 2 * PAD;
  const ih = PH - 2 * PAD;
  const heat = (
    <G>
      {zones.filter((x) => x.rect[2] > x.rect[0]).map((x) => {
        const [x0, y0, x1, y1] = x.rect;
        const rx = PAD + x0 * iw;
        const ry = PAD + (1 - y1) * ih;
        const w = (x1 - x0) * iw;
        const h = (y1 - y0) * ih;
        const on = x.id === selId;
        return (
          <G key={x.id} onPress={() => pick(x.id)}>
            <Rect x={rx} y={ry} width={w} height={h} fill={riskColor(x.risk)} opacity={0.12 + (x.risk / 100) * 0.46} stroke={on ? C.text : 'transparent'} strokeWidth={1.5} rx={8} />
          </G>
        );
      })}
    </G>
  );
  return (
    <View>
      <Card>
        <Row gap={8}>
          <ShieldIcon size={18} color={C.blueL} />
          <H style={styles.hFlat}>Где нас ловят</H>
        </Row>
        <Text style={styles.note}>Тепло без мяча и в момент потери. Ярче зона — выше шанс, что соперник выйдет туда в контратаку.</Text>
      </Card>
      <Pitch setup={setup} ev={ev} W={W} mode="out" underlay={heat} dimTokens highlight={[]} label="Без мяча · риск 0–100" />
      <View style={styles.list}>
        {zones.map((x) => {
          const on = x.id === selId;
          return (
            <Pressable key={x.id} onPress={() => pick(x.id)} style={({ pressed }) => [styles.zone, on && styles.zoneOn, pressed && { opacity: 0.72 }]}>
              <View style={[styles.sev, { backgroundColor: sevColor(x.severity) }]} />
              <Text style={styles.zoneName} numberOfLines={2}>{x.nameRu}</Text>
              <View style={{ width: 72 }}><Bar value={x.risk} color={riskColor(x.risk)} height={4} /></View>
              <Text style={[styles.zoneRisk, { color: riskColor(x.risk) }]}>{x.risk}</Text>
            </Pressable>
          );
        })}
      </View>
      {z ? (
        <Card style={{ marginTop: space.sm }}>
          <View style={styles.detailHead}>
            <Text style={styles.detailTitle}>{z.nameRu}</Text>
            <Text style={[styles.detailSev, { color: sevColor(z.severity) }]}>{SEV_RU[z.severity]} · {z.risk}</Text>
          </View>
          <Text style={styles.reason}>{z.reasonRu}</Text>
          <Text style={styles.fixHead}>Как закрыть</Text>
          {z.fixes.filter((f) => f.type !== 'manual').length === 0 ? (
            <T dim small>{z.risk < 30 ? 'Риск низкий — состав можно не трогать.' : 'Автоматической правки без большой потери модель не нашла. Ниже — действие в матче.'}</T>
          ) : null}
          {z.fixes.map((f) => <FixCard key={f.id + f.titleRu} fix={f} W={W} metricLabel="Риск зоны" />)}
        </Card>
      ) : null}
      <Disclaimer compact />
    </View>
  );
}

const styles = StyleSheet.create({
  hFlat: { marginBottom: 0, flex: 1 },
  note: { ...typo.footnote, color: C.sub, marginTop: 4 },
  list: { marginTop: space.md, gap: 4 },
  zone: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12 },
  zoneOn: { backgroundColor: C.card2 },
  sev: { width: 8, height: 8, borderRadius: 4 },
  zoneName: { ...typo.footnote, color: C.text, flex: 1 },
  zoneRisk: { width: 28, textAlign: 'right', fontSize: 15, lineHeight: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  detailHead: { gap: 4, marginBottom: 8 },
  detailTitle: { ...typo.title },
  detailSev: { ...typo.caption, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: 0.3 },
  reason: { ...typo.footnote, color: C.sub },
  fixHead: { ...typo.footnote, color: C.text, fontWeight: '700', marginTop: space.md, marginBottom: 4 },
});
