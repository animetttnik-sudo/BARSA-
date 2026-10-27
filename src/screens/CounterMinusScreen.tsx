import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { G, Rect, Text as SvgText } from 'react-native-svg';
import { vulnerabilities } from '../model/fixes';
import { useStore } from '../state';
import { Badge, Bar, Card, Disclaimer, H, Row, T } from '../ui/kit';
import { Pitch, pitchH, PAD } from '../ui/Pitch';
import { FixCard } from '../ui/FixCard';
import { SVG_FONT, C, riskColor, sevColor } from '../ui/theme';

const SEV_RU = { high: 'ВЫСОКИЙ', medium: 'СРЕДНИЙ', low: 'НИЗКИЙ' };

export function CounterMinusScreen({ W }: { W: number }) {
  const { setup, ev } = useStore();
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
            {h > 14 && x.risk >= 20 ? <G><Rect x={rx + 3} y={ry + 3} width={24} height={15} rx={4} fill="rgba(0,0,0,0.6)" /><SvgText fontFamily={SVG_FONT} x={rx + 15} y={ry + 14} fill={riskColor(x.risk)} fontSize={10.5} fontWeight="900" textAnchor="middle">{String(x.risk)}</SvgText></G> : null}
          </G>
        );
      })}
    </G>
  );
  return (
    <View>
      <Card>
        <H>Контратака − : где нас ловят</H>
        <T dim small>Тепловая карта рисков без мяча и в момент потери. Чем краснее зона — тем вероятнее, что соперник выйдет туда в контратаку. Нажми на зону или карточку.</T>
      </Card>
      <Pitch setup={setup} ev={ev} W={W} mode="out" underlay={heat} dimTokens highlight={[]} label="Без мяча · риск 0–100" />
      <View style={{ marginTop: 10 }}>
        {zones.map((x) => (
          <Pressable key={x.id} onPress={() => setSel(x.id)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10, backgroundColor: x.id === selId ? C.card2 : 'transparent' }}>
              <Text style={{ color: C.text, flex: 1, fontSize: 12.5 }} numberOfLines={2}>{x.nameRu}</Text>
              <View style={{ width: 90 }}><Bar value={x.risk} color={riskColor(x.risk)} /></View>
              <Text style={{ color: riskColor(x.risk), width: 28, textAlign: 'right', fontWeight: '800' }}>{x.risk}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {z ? (
        <Card accent={sevColor(z.severity)} style={{ marginTop: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H style={{ flex: 1 }}>{z.nameRu}</H>
            <Badge label={`${SEV_RU[z.severity]} · ${z.risk}`} color={sevColor(z.severity)} />
          </Row>
          <T small>Почему: {z.reasonRu}</T>
          <H style={{ marginTop: 10, fontSize: 14 }}>Как исправить</H>
          {z.fixes.filter((f) => f.type !== 'manual').length === 0 ? <T dim small>{z.risk < 30 ? 'Риск низкий — менять ничего не нужно.' : 'Модель не нашла изменения, которое заметно снижает этот риск без больших потерь. Попробуй совет ниже.'}</T> : null}
          {z.fixes.map((f) => <FixCard key={f.id + f.titleRu} fix={f} W={W} metricLabel="Риск зоны" />)}
        </Card>
      ) : null}
      <Disclaimer compact />
    </View>
  );
}
