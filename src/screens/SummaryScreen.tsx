import React from 'react';
import { Text, View } from 'react-native';
import { laneDistribution } from '../model/engine';
import { getApproach, getBuildUp, getFormation } from '../model/data';
import { useStore } from '../state';
import { BallIcon, ShieldIcon, UndoIcon } from '../ui/icons';
import { Badge, Btn, Card, Delta, Disclaimer, H, Metric, Row, T } from '../ui/kit';
import { Pitch } from '../ui/Pitch';
import { LaneBars, Spider } from '../ui/charts';
import { C, riskColor, scoreColor } from '../ui/theme';
import { diffSetups } from '../ui/diff';
import { APPROACH_RU, BUILDUP_RU } from '../ui/labels';

const SPIDER_RU: Record<string, string> = { attack: 'Атака', defence: 'Оборона', buildUp: 'Розыгрыш', width: 'Ширина', length: 'Глубина', endurance: 'Выносл.' };

export function SummaryScreen({ W }: { W: number }) {
  const { setup, ev, prev, prevEv, history, undo } = useStore();
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
  return (
    <View>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H>{getFormation(setup.formationId).name} · {BUILDUP_RU[setup.buildUp]} · {APPROACH_RU[setup.defApproach]} ({setup.lineHeight})</H>
        </Row>
        <Row style={{ flexWrap: 'wrap' }} gap={6}>
          {ev.tags.length ? ev.tags.map((t) => <Badge key={t} label={t} color={C.gold} />) : <T dim small>Ярко выраженного стиля нет — сбалансированная команда.</T>}
        </Row>
        <Row style={{ marginTop: 10 }}>
          <Metric label="Рейтинг опасности" value={ev.rating} color={scoreColor(ev.rating)} delta={prevEv ? ev.rating - prevEv.rating : undefined} />
          <Metric label="Атака" value={ev.attackScore} color={scoreColor(ev.attackScore)} delta={prevEv ? ev.attackScore - prevEv.attackScore : undefined} />
          <Metric label="Риск в обороне" value={ev.defRisk} color={riskColor(ev.defRisk)} delta={prevEv ? ev.defRisk - prevEv.defRisk : undefined} invert />
        </Row>
      </Card>

      <Card>
        <H>Профиль команды</H>
        <View style={{ alignItems: 'center' }}>
          <Spider data={keys.map((k) => ({ label: SPIDER_RU[k], v: ev.spider[k] }))} prev={prevEv ? keys.map((k) => prevEv.spider[k]) : undefined} size={Math.min(320, W - 26)} />
        </View>
        {prevEv ? <T dim small>Пунктир — предыдущая версия тактики.</T> : null}
      </Card>

      <Card>
        <H>Где атакуем и где обороняемся</H>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <View style={{ alignItems: 'center' }}><Pitch setup={setup} ev={ev} W={half} mode="in" small /><T dim small>С мячом</T></View>
          <View style={{ alignItems: 'center' }}><Pitch setup={setup} ev={ev} W={half} mode="out" small /><T dim small>Без мяча</T></View>
        </Row>
        <View style={{ marginTop: 8 }}>
          <LaneBars title="Атака по коридорам (сколько атакующей активности в каждом)" d={lanes.attack} color={C.garnet} />
          <LaneBars title="Оборона по коридорам (кто прикрывает)" d={lanes.defence} color={C.blue} />
        </View>
        <T small>Средняя высота блока без мяча: <Text style={{ color: C.gold, fontWeight: '700' }}>{Math.round(blockY * 100)}%</Text> длины поля, последняя линия ≈{Math.round(defLine * 100)}%. {blockY > 0.42 ? 'Встречаешь соперника на его половине.' : blockY > 0.32 ? 'Средний блок.' : 'Низкий блок у своей штрафной.'}</T>
        <T small style={{ marginTop: 4 }}>Розыгрыш «{bu.nameRu}»: {bu.descRu}</T>
      </Card>

      <Card>
        <H>Прессинг</H>
        <T small>Подход «{ap.nameRu}»: давление — {ap.pressure.toLowerCase()}, слежение за забеганиями — {ap.runTracking.toLowerCase()}.{ap.offsideTrap ? ' Ловушка офсайда.' : ''}</T>
        <Row style={{ marginTop: 8 }}>
          <Metric label="Контрпрессинг (риск)" value={ev.risks.cpress} color={riskColor(ev.risks.cpress)} delta={prevEv ? ev.risks.cpress - prevEv.risks.cpress : undefined} invert />
          <Metric label="Расход сил" value={`×${ap.staminaMult}`} />
          <Metric label="Энергия к 75'" value={`${Math.round(ev.extras.avgEnergy75)}%`} />
        </Row>
        <T small style={{ marginTop: 6 }}>Главные прессингующие: {pressers.map((s) => `${s.player!.nameRu} (${s.role.nameRu})`).join(', ')}.</T>
      </Card>

      <Card accent={C.gold}>
        <Row style={{ justifyContent: 'space-between' }}>
          <H>Что изменилось</H>
          {prev ? <Btn label="Отменить" kind="ghost" icon={<UndoIcon size={14} color={C.text} />} onPress={undo} style={{ paddingVertical: 5 }} /> : null}
        </Row>
        {!prev ? <T dim small>Изменений пока нет. Поменяй что-нибудь на вкладке «Поле» — здесь появится сравнение с предыдущей версией.</T> : (
          <>
            <T dim small>Последнее действие: {prev.labelRu}</T>
            {diff.map((d, i) => <T key={i} small>• {d}</T>)}
            <View style={{ marginTop: 8 }}>
              {[...ev.attack, ...ev.defence].map((c) => {
                const p = [...prevEv!.attack, ...prevEv!.defence].find((x) => x.id === c.id)!;
                const d = c.value - p.value;
                if (Math.abs(d) < 2) return null;
                return <Row key={c.id} style={{ justifyContent: 'space-between' }}><Row gap={6} style={{ flex: 1, paddingRight: 8 }}>{c.group === 'attack' ? <BallIcon size={14} color={C.sub} /> : <ShieldIcon size={14} color={C.sub} />}<T small style={{ flex: 1 }}>{c.nameRu}</T></Row><Row><T dim small>{p.value}→{c.value}</T><Delta v={d} invert={c.group === 'defence'} /></Row></Row>;
              })}
            </View>
            {history.length > 1 ? <T dim small style={{ marginTop: 8 }}>История: {history.slice(-6).map((h) => h.labelRu).reverse().join(' ← ')}</T> : null}
          </>
        )}
      </Card>
      <Disclaimer compact />
    </View>
  );
}
