import React from 'react';
import { Text, View } from 'react-native';
import { laneDistribution } from '../model/engine';
import { getApproach, getBuildUp, getFormation } from '../model/data';
import { useStore } from '../state';
import { BallIcon, ShieldIcon, UndoIcon } from '../ui/icons';
import { Badge, Btn, Card, Delta, H, Metric, Row, SectionTitle, T, useExplain } from '../ui/kit';
import { Pitch } from '../ui/Pitch';
import { LaneBars, Spider } from '../ui/charts';
import { C, riskColor, scoreColor } from '../ui/theme';
import { diffSetups } from '../ui/diff';
import { APPROACH_RU, BUILDUP_RU } from '../ui/labels';

const SPIDER_RU: Record<string, string> = { attack: 'Атака', defence: 'Оборона', buildUp: 'Розыгрыш', width: 'Ширина', length: 'Глубина', endurance: 'Выносл.' };

export function SummaryScreen({ W }: { W: number }) {
  const { setup, ev, prev, prevEv, undo } = useStore();
  const explain = useExplain();
  const lanes = laneDistribution(ev);
  const ap = getApproach(setup.defApproach);
  const bu = getBuildUp(setup.buildUp);
  const field = ev.slots.filter((s) => s.player && s.slot.pos !== 'GK');
  const pressers = [...field].sort((a, b) => b.v.press * b.q - a.v.press * a.q).slice(0, 3);
  const blockY = field.reduce((m, s) => m + s.posOut.y, 0) / Math.max(1, field.length);
  const defLine = Math.min(...field.map((s) => s.posOut.y));
  const keys = Object.keys(ev.spider) as (keyof typeof ev.spider)[];
  const diff = prev ? diffSetups(prev.setup, setup) : [];
  const half = (W - 26 - 8) / 2;
  const blockNote = `Средняя высота блока без мяча: ${Math.round(blockY * 100)}% поля, последняя линия ≈${Math.round(defLine * 100)}%. ${blockY > 0.42 ? 'Встречаешь соперника на его половине.' : blockY > 0.32 ? 'Средний блок.' : 'Низкий блок у своей штрафной.'}\n\nРозыгрыш «${bu.nameRu}»: ${bu.descRu}`;
  return (
    <View>
      <Card>
        <H>{getFormation(setup.formationId).name}</H>
        <Text style={{ color: C.sub, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{BUILDUP_RU[setup.buildUp]} · {APPROACH_RU[setup.defApproach]} · {setup.lineHeight}</Text>
        <Row style={{ flexWrap: 'wrap' }} gap={6}>
          {ev.tags.map((t) => <Badge key={t} label={t} color={C.gold} />)}
        </Row>
        <Row style={{ marginTop: 10 }}>
          <Metric label="Опасность" value={ev.rating} color={scoreColor(ev.rating)} delta={prevEv ? ev.rating - prevEv.rating : undefined} />
          <Metric label="Атака" value={ev.attackScore} color={scoreColor(ev.attackScore)} delta={prevEv ? ev.attackScore - prevEv.attackScore : undefined} />
          <Metric label="Риск" value={ev.defRisk} color={riskColor(ev.defRisk)} delta={prevEv ? ev.defRisk - prevEv.defRisk : undefined} invert />
        </Row>
      </Card>

      <Card>
        <SectionTitle onExplain={() => explain.open('Профиль', prevEv ? 'Сплошная фигура — текущая тактика. Пунктир — предыдущая версия. Оси: атака, оборона, розыгрыш, ширина, глубина, выносливость.' : 'Оси: атака, оборона, розыгрыш, ширина, глубина, выносливость.')}>Профиль</SectionTitle>
        <View style={{ alignItems: 'center' }}>
          <Spider data={keys.map((k) => ({ label: SPIDER_RU[k], v: ev.spider[k] }))} prev={prevEv ? keys.map((k) => prevEv.spider[k]) : undefined} size={Math.min(320, W - 26)} />
        </View>
      </Card>

      <Card>
        <SectionTitle onExplain={() => explain.open('Коридоры', blockNote)}>Коридоры</SectionTitle>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <View style={{ alignItems: 'center', flex: 1 }}><Pitch setup={setup} ev={ev} W={half} mode="in" small /><Text style={{ color: C.text, fontSize: 15, fontWeight: '700', marginTop: 4 }}>С мячом</Text></View>
          <View style={{ alignItems: 'center', flex: 1 }}><Pitch setup={setup} ev={ev} W={half} mode="out" small /><Text style={{ color: C.text, fontSize: 15, fontWeight: '700', marginTop: 4 }}>Без мяча</Text></View>
        </Row>
        <View style={{ marginTop: 10 }}>
          <LaneBars title="Атака" d={lanes.attack} color={C.garnet} />
          <LaneBars title="Оборона" d={lanes.defence} color={C.blue} />
        </View>
      </Card>

      <Card>
        <SectionTitle onExplain={() => explain.open('Прессинг', `Подход «${ap.nameRu}»: давление — ${ap.pressure.toLowerCase()}, слежение за забеганиями — ${ap.runTracking.toLowerCase()}.${ap.offsideTrap ? ' Ловушка офсайда.' : ''}\n\nГлавные прессингующие: ${pressers.map((s) => `${s.player!.nameRu} (${s.role.nameRu})`).join(', ')}.`)}>Прессинг</SectionTitle>
        <Row>
          <Metric label="Контрпресс" value={ev.risks.cpress} color={riskColor(ev.risks.cpress)} delta={prevEv ? ev.risks.cpress - prevEv.risks.cpress : undefined} invert />
          <Metric label="Расход" value={`×${ap.staminaMult}`} />
          <Metric label="К 75'" value={`${Math.round(ev.extras.avgEnergy75)}%`} />
        </Row>
        <Row style={{ marginTop: 10, flexWrap: 'wrap' }} gap={8}>
          {pressers.map((s) => <Text key={s.slot.id} style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{s.player!.nameRu}</Text>)}
        </Row>
      </Card>

      {prev ? (
        <Card accent={C.gold}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H>Изменения</H>
            <Btn label="Отменить" kind="ghost" icon={<UndoIcon size={16} color={C.text} />} onPress={undo} style={{ paddingVertical: 8 }} />
          </Row>
          <T style={{ fontSize: 16 }}>{prev.labelRu}</T>
          {diff.map((d, i) => <T key={i} style={{ fontSize: 16 }}>{d}</T>)}
          <View style={{ marginTop: 8 }}>
            {[...ev.attack, ...ev.defence].map((c) => {
              const p = [...prevEv!.attack, ...prevEv!.defence].find((x) => x.id === c.id)!;
              const d = c.value - p.value;
              if (Math.abs(d) < 2) return null;
              return (
                <Row key={c.id} style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                  <Row gap={6} style={{ flex: 1, paddingRight: 8 }}>
                    {c.group === 'attack' ? <BallIcon size={16} color={C.sub} /> : <ShieldIcon size={16} color={C.sub} />}
                    <T style={{ flex: 1, fontSize: 16 }}>{c.nameRu}</T>
                  </Row>
                  <Row><T style={{ fontSize: 16 }}>{p.value}→{c.value}</T><Delta v={d} invert={c.group === 'defence'} /></Row>
                </Row>
              );
            })}
          </View>
        </Card>
      ) : null}
      {explain.sheet}
    </View>
  );
}
