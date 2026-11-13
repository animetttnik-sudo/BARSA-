import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, G, Line, Path } from 'react-native-svg';
import { counterPlus } from '../model/counter';
import { useStore } from '../state';
import { BallIcon, BoltIcon } from '../ui/icons';
import { Bar, Card, Disclaimer, H, Row, T } from '../ui/kit';
import { Pitch, toPx } from '../ui/Pitch';
import { FixCard } from '../ui/FixCard';
import { C, scoreColor, space, type as typo } from '../ui/theme';

export function CounterPlusScreen({ W }: { W: number }) {
  const { setup, ev } = useStore();
  const cp = useMemo(() => counterPlus(setup), [setup]);
  const top = cp.runners.slice(0, 3).map((r) => r.s.slot.id).concat(cp.passers.slice(0, 1).map((p) => p.s.slot.id));
  const lane = cp.channels[0]?.nameRu ?? '—';
  const arrows = (
    <G>
      {cp.arrows.map((a, i) => {
        const p0 = toPx(W, a.from.x, a.from.y);
        const p1 = toPx(W, a.to.x, a.to.y);
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const hl = 11;
        const head = `M ${p1.x} ${p1.y} L ${p1.x - hl * Math.cos(ang - 0.4)} ${p1.y - hl * Math.sin(ang - 0.4)} L ${p1.x - hl * Math.cos(ang + 0.4)} ${p1.y - hl * Math.sin(ang + 0.4)} Z`;
        const col = i === 0 ? C.gold : C.blueL;
        return (
          <G key={i}>
            <Line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={col} strokeWidth={i === 0 ? 2.5 : 1.6} strokeDasharray={i ? '6,5' : undefined} opacity={0.55 + 0.4 * a.strength} />
            <Path d={head} fill={col} />
            <Circle cx={p1.x} cy={p1.y} r={14} fill={col} opacity={0.16} />
          </G>
        );
      })}
    </G>
  );
  return (
    <View>
      <Card>
        <Row gap={8}>
          <BoltIcon size={18} color={C.gold} />
          <H style={styles.hFlat}>Контратака</H>
        </Row>
        <Text style={styles.note}>Кто уходит после отбора, кто отдаёт первый пас и какой коридор опаснее. Золотая стрелка — основной маршрут.</Text>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Угроза</Text>
            <Text style={[styles.hero, { color: scoreColor(cp.counterScore) }]}>{cp.counterScore}</Text>
          </View>
          <View style={{ flex: 1.2 }}>
            <Text style={styles.kicker}>Коридор</Text>
            <Text style={styles.lane} numberOfLines={2}>{lane}</Text>
          </View>
        </View>
      </Card>
      <Pitch setup={setup} ev={ev} W={W} mode="out" overlay={arrows} highlight={top} dimTokens label="Момент отбора · маршруты" />

      <Card style={{ marginTop: space.sm }}>
        <H>Схема</H>
        {cp.patternRu.map((p, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepN}><Text style={styles.stepNT}>{i + 1}</Text></View>
            <Text style={styles.stepT}>{p}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <H>Коридоры</H>
        {cp.channels.map((c, i) => (
          <View key={c.lane} style={styles.block}>
            <View style={styles.blockHead}>
              <Text style={[styles.rank, i === 0 && { color: C.gold }]}>{i + 1}</Text>
              <Text style={styles.blockName} numberOfLines={1}>{c.nameRu.charAt(0).toUpperCase() + c.nameRu.slice(1)}</Text>
              <Text style={[styles.blockScore, { color: i === 0 ? C.gold : scoreColor(c.score) }]}>{c.score}</Text>
            </View>
            <Bar value={c.score} color={i === 0 ? C.gold : C.garnet} height={4} />
            <Text style={styles.note} numberOfLines={2}>{c.whyRu}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Row gap={8}><BoltIcon size={16} color={C.garnetL} /><H style={styles.hFlat}>Бегуны</H></Row>
        {cp.runners.slice(0, 5).map((r, i) => (
          <Person key={r.s.slot.id} rank={i + 1} name={r.s.player!.nameRu} score={r.score} why={r.whyRu} color={i === 0 ? C.gold : C.garnet} />
        ))}
        <Row gap={8} style={{ marginTop: space.md }}><BallIcon size={16} color={C.blueL} /><H style={styles.hFlat}>Первый пас</H></Row>
        {cp.passers.slice(0, 3).map((p, i) => (
          <Person key={p.s.slot.id} rank={i + 1} name={p.s.player!.nameRu} score={p.score} why={p.whyRu} color={i === 0 ? C.gold : C.blueL} />
        ))}
      </Card>

      <H style={{ marginTop: space.xs }}>Как усилить</H>
      {cp.adjustments.length
        ? cp.adjustments.map((f) => <FixCard key={f.id + f.titleRu} fix={f} W={W} metricLabel="Угроза" minimize={false} />)
        : <T dim small>Модель не нашла правки, которая заметно усиливает контратаку.</T>}
      <Text style={[styles.note, { marginTop: space.sm }]}>{cp.noteRu}</Text>
      <Disclaimer compact />
    </View>
  );
}

function Person({ rank, name, score, why, color }: { rank: number; name: string; score: number; why: string; color: string }) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={[styles.rank, rank === 1 && { color: C.gold }]}>{rank}</Text>
        <Text style={styles.blockName} numberOfLines={1}>{name}</Text>
        <Text style={[styles.blockScore, { color }]}>{score}</Text>
      </View>
      <Bar value={score} color={color} height={4} />
      <Text style={styles.note} numberOfLines={2}>{why}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hFlat: { marginBottom: 0, flex: 1 },
  kicker: { ...typo.caption, color: C.dim, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroRow: { flexDirection: 'row', gap: 16, marginTop: space.md },
  hero: { fontSize: 40, lineHeight: 44, fontWeight: '700', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  lane: { ...typo.title, fontSize: 22, lineHeight: 26, marginTop: 2, textTransform: 'capitalize' },
  note: { ...typo.footnote, color: C.sub, marginTop: 4 },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  stepN: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNT: { color: C.gold, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  stepT: { ...typo.footnote, color: C.text, flex: 1 },
  block: { gap: 6, paddingVertical: 8 },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rank: { width: 16, color: C.dim, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  blockName: { ...typo.callout, fontWeight: '600', flex: 1 },
  blockScore: { fontSize: 16, lineHeight: 20, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 28, textAlign: 'right' },
});
