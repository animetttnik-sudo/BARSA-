import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { G, Rect, Text as SvgText } from 'react-native-svg';
import { vulnerabilities } from '../model/fixes';
import { useStore } from '../state';
import { Badge, Bar, Card, H, Row, SectionTitle, useExplain } from '../ui/kit';
import { Pitch, pitchH, PAD } from '../ui/Pitch';
import { FixCard } from '../ui/FixCard';
import { SVG_FONT, C, riskColor, sevColor } from '../ui/theme';

const SEV_RU = { high: 'ВЫСОКИЙ', medium: 'СРЕДНИЙ', low: 'НИЗКИЙ' };

export function CounterMinusScreen({ W }: { W: number }) {
  const { setup, ev } = useStore();
  const explain = useExplain();
  const zones = useMemo(() => vulnerabilities(setup, ev), [setup, ev]);
  const [sel, setSel] = useState<string | null>(null);
  const selId = sel ?? zones[0]?.id;
  const z = zones.find((x) => x.id === selId);
  const PH = pitchH(W), iw = W - 2 * PAD, ih = PH - 2 * PAD;
  const heat = (
    <G>
      {zones.filter((x) => x.rect[2] > x.rect[0]).map((x) => {
        const [x0, y0, x1, y1] = x.rect;
        const rx = PAD + x0 * iw, ry = PAD + (1 - y1) * ih, w = (x1 - x0) * iw, h = (y1 - y0) * ih;
        return (
          <G key={x.id} onPress={() => setSel(x.id)}>
            <Rect x={rx} y={ry} width={w} height={h} fill={riskColor(x.risk)} opacity={0.12 + (x.risk / 100) * 0.55} stroke={x.id === selId ? '#fff' : 'none'} strokeWidth={2} rx={6} />
            {h > 18 && x.risk >= 20 ? <G><Rect x={rx + 4} y={ry + 4} width={28} height={18} rx={5} fill="rgba(9,17,36,0.72)" /><SvgText fontFamily={SVG_FONT} x={rx + 18} y={ry + 17} fill={riskColor(x.risk)} fontSize={13} fontWeight="800" textAnchor="middle">{String(x.risk)}</SvgText></G> : null}
          </G>
        );
      })}
    </G>
  );
  return (
    <View>
      <Pitch setup={setup} ev={ev} W={W} mode="out" underlay={heat} dimTokens highlight={[]} />
      <View style={{ marginTop: 12 }}>
        {zones.map((x) => (
          <Pressable key={x.id} onPress={() => setSel(x.id)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12, backgroundColor: x.id === selId ? C.card2 : 'transparent', minHeight: 44 }}>
              <Text style={{ color: C.text, flex: 1, fontSize: 16, fontWeight: '600' }} numberOfLines={2}>{x.nameRu}</Text>
              <View style={{ width: 90 }}><Bar value={x.risk} color={riskColor(x.risk)} /></View>
              <Text style={{ color: riskColor(x.risk), width: 32, textAlign: 'right', fontWeight: '800', fontSize: 17 }}>{x.risk}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {z ? (
        <Card accent={sevColor(z.severity)} style={{ marginTop: 10 }}>
          <SectionTitle onExplain={() => explain.open(z.nameRu, z.reasonRu)}>
            {z.nameRu}
          </SectionTitle>
          <Row style={{ marginBottom: 8 }}>
            <Badge label={`${SEV_RU[z.severity]} · ${z.risk}`} color={sevColor(z.severity)} />
          </Row>
          <H>Исправления</H>
          {z.fixes.map((f) => <FixCard key={f.id + f.titleRu} fix={f} W={W} metricLabel="Риск" />)}
        </Card>
      ) : null}
      {explain.sheet}
    </View>
  );
}
