import React from 'react';
import { Text, View } from 'react-native';
import { useStore } from '../state';
import type { Component } from '../model/engine';
import { Bar, Card, Delta, Metric, Row, SectionTitle, useExplain } from '../ui/kit';
import { Gauge } from '../ui/charts';
import { C, riskColor, scoreColor } from '../ui/theme';

function CompRow({ c, prev, risk }: { c: Component; prev?: Component; risk?: boolean }) {
  const col = risk ? riskColor(c.value) : scoreColor(c.value);
  return (
    <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: C.line, minHeight: 44, justifyContent: 'center' }}>
      <Row>
        <Text style={{ color: C.text, flex: 1.6, fontSize: 16, fontWeight: '600' }} numberOfLines={2}>{c.nameRu}</Text>
        <Bar value={c.value} color={col} />
        <Text style={{ color: col, width: 32, textAlign: 'right', fontWeight: '800', fontSize: 17, fontVariant: ['tabular-nums'] }}>{c.value}</Text>
        <View style={{ width: 44, alignItems: 'flex-end' }}>{prev ? <Delta v={c.value - prev.value} invert={risk} /> : null}</View>
      </Row>
    </View>
  );
}

export function RatingScreen({ W }: { W: number }) {
  const { ev, prevEv } = useStore();
  const explain = useExplain();
  const pa = (id: string) => prevEv?.attack.find((x) => x.id === id);
  const pd = (id: string) => prevEv?.defence.find((x) => x.id === id);
  const worstA = [...ev.attack].sort((a, b) => a.value - b.value)[0];
  const worstD = [...ev.defence].sort((a, b) => b.value * b.weight - a.value * a.weight)[0];
  const attackWhy = ev.attack.map((c) => `${c.nameRu} — ${c.value}. ${c.reasonRu}`).join('\n\n');
  const defenceWhy = ev.defence.map((c) => `${c.nameRu} — ${c.value}. ${c.reasonRu}`).join('\n\n');
  const synWhy = ev.synergies.map((s) => `${s.delta > 0 ? '+' : ''}${s.delta}. ${s.textRu}`).join('\n\n');
  return (
    <View>
      <Card style={{ alignItems: 'center' }}>
        <SectionTitle>Опасность</SectionTitle>
        <Gauge value={ev.rating} size={Math.min(260, W - 40)} />
        {prevEv ? <Row><Delta v={ev.rating - prevEv.rating} /></Row> : null}
        <Row style={{ marginTop: 10, alignSelf: 'stretch' }}>
          <Metric label="Атака" value={ev.attackScore} color={scoreColor(ev.attackScore)} delta={prevEv ? ev.attackScore - prevEv.attackScore : undefined} />
          <Metric label="Риск" value={ev.defRisk} color={riskColor(ev.defRisk)} delta={prevEv ? ev.defRisk - prevEv.defRisk : undefined} invert />
        </Row>
      </Card>
      <Card accent={C.warn}>
        <SectionTitle onExplain={() => explain.open('Слабые места', `Атака: «${worstA.nameRu}» — ${worstA.value}. ${worstA.reasonRu}\n\nОборона: «${worstD.nameRu}» — риск ${worstD.value}. ${worstD.reasonRu}`)}>Слабые места</SectionTitle>
        <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '600', flex: 1 }}>{worstA.nameRu}</Text>
          <Text style={{ color: scoreColor(worstA.value), fontSize: 20, fontWeight: '800' }}>{worstA.value}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '600', flex: 1 }}>{worstD.nameRu}</Text>
          <Text style={{ color: riskColor(worstD.value), fontSize: 20, fontWeight: '800' }}>{worstD.value}</Text>
        </Row>
      </Card>
      <Card>
        <SectionTitle onExplain={() => explain.open('Атака', attackWhy)}>Атака</SectionTitle>
        {ev.attack.map((c) => <CompRow key={c.id} c={c} prev={pa(c.id)} />)}
      </Card>
      <Card>
        <SectionTitle onExplain={() => explain.open('Риск в обороне', defenceWhy)}>Риск</SectionTitle>
        {ev.defence.map((c) => <CompRow key={c.id} c={c} prev={pd(c.id)} risk />)}
      </Card>
      {ev.synergies.length ? (
        <Card>
          <SectionTitle onExplain={() => explain.open('Связки', synWhy)}>Связки</SectionTitle>
          <Row style={{ flexWrap: 'wrap' }} gap={8}>
            {ev.synergies.map((s, i) => <Delta key={i} v={s.delta} />)}
          </Row>
        </Card>
      ) : null}
      {explain.sheet}
    </View>
  );
}
