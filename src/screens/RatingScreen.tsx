import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStore } from '../state';
import type { Component } from '../model/engine';
import { BallIcon, ShieldIcon } from '../ui/icons';
import { Bar, Card, Delta, Disclaimer, H, Metric, Row, T } from '../ui/kit';
import { Gauge } from '../ui/charts';
import { C, riskColor, scoreColor } from '../ui/theme';

function CompRow({ c, prev, risk }: { c: Component; prev?: Component; risk?: boolean }) {
  const [open, setOpen] = useState(false);
  const col = risk ? riskColor(c.value) : scoreColor(c.value);
  return (
    <Pressable onPress={() => setOpen(!open)} style={{ paddingVertical: 6, borderBottomWidth: 1, borderColor: C.line }}>
      <Row>
        <Text style={{ color: C.text, flex: 1.5, fontSize: 12.5 }} numberOfLines={open ? 3 : 1}>{c.nameRu}</Text>
        <Text style={{ color: C.dim, fontSize: 10, width: 30 }}>×{Math.round(c.weight * 100)}%</Text>
        <Bar value={c.value} color={col} />
        <Text style={{ color: col, width: 26, textAlign: 'right', fontWeight: '700', fontVariant: ['tabular-nums'] }}>{c.value}</Text>
        <View style={{ width: 30, alignItems: 'flex-end' }}>{prev ? <Delta v={c.value - prev.value} invert={risk} /> : null}</View>
      </Row>
      {open ? <T dim small style={{ marginTop: 4 }}>{c.reasonRu}</T> : null}
    </Pressable>
  );
}

export function RatingScreen({ W }: { W: number }) {
  const { ev, prevEv } = useStore();
  const pa = (id: string) => prevEv?.attack.find((x) => x.id === id);
  const pd = (id: string) => prevEv?.defence.find((x) => x.id === id);
  const worstA = [...ev.attack].sort((a, b) => a.value * 1 - b.value)[0];
  const worstD = [...ev.defence].sort((a, b) => b.value * b.weight - a.value * a.weight)[0];
  return (
    <View>
      <Card style={{ alignItems: 'center' }}>
        <H>Рейтинг опасности</H>
        <Gauge value={ev.rating} size={Math.min(260, W - 40)} label="0–100 · не зависит от OVR" />
        {prevEv ? <Row><T dim small>к прошлой версии:</T><Delta v={ev.rating - prevEv.rating} /></Row> : null}
        <Row style={{ marginTop: 10, alignSelf: 'stretch' }}>
          <Metric label="Атака (больше — лучше)" value={ev.attackScore} color={scoreColor(ev.attackScore)} delta={prevEv ? ev.attackScore - prevEv.attackScore : undefined} />
          <Metric label="Риск в обороне (меньше — лучше)" value={ev.defRisk} color={riskColor(ev.defRisk)} delta={prevEv ? ev.defRisk - prevEv.defRisk : undefined} invert />
        </Row>
        <T dim small style={{ marginTop: 8, textAlign: 'center' }}>Рейтинг = 0.55 × Атака + 0.45 × (100 − Риск){'\n'}= 0.55 × {ev.attackScore} + 0.45 × {100 - ev.defRisk} ≈ {ev.rating}</T>
      </Card>
      <Card accent={C.warn}>
        <H>Что тянет вниз сильнее всего</H>
        <Row style={{ alignItems: 'flex-start' }} gap={6}>
          <View style={{ marginTop: 2 }}><BallIcon size={14} color={C.sub} /></View>
          <T small style={{ flex: 1 }}>Атака: «{worstA.nameRu}» — {worstA.value}. {worstA.reasonRu}</T>
        </Row>
        <Row style={{ alignItems: 'flex-start', marginTop: 4 }} gap={6}>
          <View style={{ marginTop: 2 }}><ShieldIcon size={14} color={C.sub} /></View>
          <T small style={{ flex: 1 }}>Оборона: «{worstD.nameRu}» — риск {worstD.value}. {worstD.reasonRu}</T>
        </Row>
      </Card>
      <Card>
        <H>Атака — из чего складывается</H>
        <T dim small style={{ marginBottom: 4 }}>Нажми на строку — причина. ×% — вес в подоценке.</T>
        {ev.attack.map((c) => <CompRow key={c.id} c={c} prev={pa(c.id)} />)}
      </Card>
      <Card>
        <H>Риск в обороне — из чего складывается</H>
        {ev.defence.map((c) => <CompRow key={c.id} c={c} prev={pd(c.id)} risk />)}
      </Card>
      {ev.synergies.length ? (
        <Card>
          <H>Сочетания ролей</H>
          {ev.synergies.map((s, i) => <Row key={i} style={{ alignItems: 'flex-start' }}><Delta v={s.delta} /><T small style={{ flex: 1 }}>{s.textRu}</T></Row>)}
        </Card>
      ) : null}
      <Card>
        <H>Как считается</H>
        <T dim small>• OVR не используется. Каждый игрок оценивается по детальным атрибутам (скорость, ускорение, выносливость, пас, отбор, игра головой…) и PlayStyles (PlayStyle+ считается вдвое).{'\n'}• Роль и фокус задают «вектор поведения»: насколько игрок идёт вперёд, смещается в центр/к бровке, прессингует, забегает, создаёт, возвращается. Описания — из официальных описаний ролей FC 26.{'\n'}• Отметка роли у игрока (++/+) даёт бонус 8%/4%, смежная позиция −5%, чужая −14%.{'\n'}• Из этого считаются позиции с мячом и без, покрытие зон, риски при потере и атакующие компоненты.{'\n'}• Любое изменение (игрок, роль, фокус, схема, тактика, линия, режим) пересчитывает рейтинг мгновенно.</T>
      </Card>
      <Disclaimer />
    </View>
  );
}
