import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Circle, G, Line, Path } from 'react-native-svg';
import { counterPlus } from '../model/counter';
import { useStore } from '../state';
import { Bar, Card, Disclaimer, H, Metric, Row, T } from '../ui/kit';
import { Pitch, toPx } from '../ui/Pitch';
import { FixCard } from '../ui/FixCard';
import { C, scoreColor } from '../ui/theme';

export function CounterPlusScreen({ W }: { W: number }) {
  const { setup, ev } = useStore();
  const cp = useMemo(() => counterPlus(setup), [setup]);
  const top = cp.runners.slice(0, 3).map((r) => r.s.slot.id).concat(cp.passers.slice(0, 1).map((p) => p.s.slot.id));
  const arrows = (
    <G>
      {cp.arrows.map((a, i) => {
        const p0 = toPx(W, a.from.x, a.from.y), p1 = toPx(W, a.to.x, a.to.y);
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x), hl = 12;
        const head = `M ${p1.x} ${p1.y} L ${p1.x - hl * Math.cos(ang - 0.4)} ${p1.y - hl * Math.sin(ang - 0.4)} L ${p1.x - hl * Math.cos(ang + 0.4)} ${p1.y - hl * Math.sin(ang + 0.4)} Z`;
        const col = i === 0 ? C.gold : '#7FB6FF';
        return (
          <G key={i}>
            <Line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={col} strokeWidth={2 + 4 * a.strength} strokeDasharray={i ? '8,5' : undefined} opacity={0.9} />
            <Path d={head} fill={col} />
            <Circle cx={p1.x} cy={p1.y} r={16} fill={col} opacity={0.18} />
          </G>
        );
      })}
    </G>
  );
  return (
    <View>
      <Card>
        <H>Контратака + : как бить в ответ</H>
        <T dim small>Кто лучше всех убегает после отбора, кто отдаёт первый пас и через какой коридор контратака опаснее. Стрелки — главный и запасной маршрут.</T>
        <Row style={{ marginTop: 8 }}>
          <Metric label="Угроза контратаки" value={cp.counterScore} color={scoreColor(cp.counterScore)} />
          <Metric label="Главный коридор" value={cp.channels[0]?.nameRu ?? '—'} />
        </Row>
      </Card>
      <Pitch setup={setup} ev={ev} W={W} mode="out" overlay={arrows} highlight={top} dimTokens label="Момент отбора · маршруты" />
      <Card style={{ marginTop: 10 }} accent={C.gold}>
        <H>Схема контратаки</H>
        {cp.patternRu.map((p, i) => <T key={i} small style={{ marginBottom: 4 }}>{i + 1}. {p}</T>)}
      </Card>
      <Card>
        <H>Коридоры</H>
        {cp.channels.map((c) => (
          <View key={c.lane} style={{ marginBottom: 8 }}>
            <Row><Text style={{ color: C.text, width: 110, fontWeight: '700' }}>{c.nameRu}</Text><Bar value={c.score} color={scoreColor(c.score)} /><Text style={{ color: C.text, width: 30, textAlign: 'right' }}>{c.score}</Text></Row>
            <T dim small>{c.whyRu}</T>
          </View>
        ))}
      </Card>
      <Card>
        <H>Бегуны</H>
        {cp.runners.slice(0, 5).map((r) => (
          <View key={r.s.slot.id} style={{ marginBottom: 6 }}>
            <Row><Text style={{ color: C.text, width: 110 }} numberOfLines={1}>{r.s.player!.nameRu}</Text><Bar value={r.score} color={C.garnetL} /><Text style={{ color: C.text, width: 30, textAlign: 'right' }}>{r.score}</Text></Row>
            <T dim small>{r.whyRu}</T>
          </View>
        ))}
        <H style={{ marginTop: 8 }}>Первый пас</H>
        {cp.passers.slice(0, 3).map((p) => (
          <View key={p.s.slot.id} style={{ marginBottom: 6 }}>
            <Row><Text style={{ color: C.text, width: 110 }} numberOfLines={1}>{p.s.player!.nameRu}</Text><Bar value={p.score} color={C.blueL} /><Text style={{ color: C.text, width: 30, textAlign: 'right' }}>{p.score}</Text></Row>
            <T dim small>{p.whyRu}</T>
          </View>
        ))}
      </Card>
      <H style={{ marginTop: 4 }}>Как усилить контратаку</H>
      {cp.adjustments.length ? cp.adjustments.map((f) => <FixCard key={f.id + f.titleRu} fix={f} W={W} metricLabel="Угроза" minimize={false} />) : <T dim small>Модель не нашла изменений, которые заметно усиливают контратаку без больших потерь.</T>}
      <T dim small style={{ marginTop: 6 }}>{cp.noteRu}</T>
      <Disclaimer compact />
    </View>
  );
}
