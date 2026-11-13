import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { laneDistribution } from '../model/engine';
import { getApproach, getFormation } from '../model/data';
import { useStore } from '../state';
import { BallIcon, ChartIcon, ShieldIcon, UndoIcon } from '../ui/icons';
import { Bar, Btn, Card, Delta, Disclaimer, H, Metric, Row, T } from '../ui/kit';
import { Pitch } from '../ui/Pitch';
import { LaneBars, Spider } from '../ui/charts';
import { C, radius, riskColor, scoreColor, space, type as typo } from '../ui/theme';
import { diffSetups } from '../ui/diff';
import { APPROACH_RU, BUILDUP_RU } from '../ui/labels';

const SPIDER_RU: Record<string, string> = { attack: 'Атака', defence: 'Оборона', buildUp: 'Пас', width: 'Ширина', length: 'Глубина', endurance: 'Силы' };
const clean = (s: string) => s.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

function SideList({ title, color, rows }: { title: string; color: string; rows: { id: string; name: string; value: number }[] }) {
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Text style={[styles.sideTitle, { color }]}>{title}</Text>
      {rows.map((r) => (
        <View key={r.id} style={{ gap: 4 }}>
          <View style={styles.sideHead}>
            <Text style={styles.sideName} numberOfLines={1}>{r.name}</Text>
            <Text style={[styles.sideVal, { color }]}>{r.value}</Text>
          </View>
          <Bar value={r.value} color={color} height={4} />
        </View>
      ))}
    </View>
  );
}

export function SummaryScreen({ W }: { W: number }) {
  const { setup, ev, prev, prevEv, history, undo } = useStore();
  const lanes = laneDistribution(ev);
  const ap = getApproach(setup.defApproach);
  const field = ev.slots.filter((s) => s.player && s.slot.pos !== 'GK');
  const pressers = [...field].sort((a, b) => b.v.press * b.q - a.v.press * a.q).slice(0, 3);
  const blockY = field.reduce((m, s) => m + s.posOut.y, 0) / Math.max(1, field.length);
  const defLine = field.length ? Math.min(...field.map((s) => s.posOut.y)) : 0;
  const keys = Object.keys(ev.spider) as (keyof typeof ev.spider)[];
  const diff = prev ? diffSetups(prev.setup, setup) : [];
  const inner = Math.max(220, W - 28);
  const half = Math.floor((inner - 8) / 2);
  const plus = [...ev.attack].sort((a, b) => b.value - a.value).slice(0, 3).map((c) => ({ id: c.id, name: clean(c.nameRu), value: c.value }));
  const minus = [...ev.defence].sort((a, b) => b.value - a.value).slice(0, 3).map((c) => ({ id: c.id, name: clean(c.nameRu), value: c.value }));
  const shape = blockY > 0.42 ? 'Высокий блок' : blockY > 0.32 ? 'Средний блок' : 'Низкий блок';
  const moved = prevEv
    ? [...ev.attack, ...ev.defence].flatMap((c) => {
      const p = [...prevEv.attack, ...prevEv.defence].find((x) => x.id === c.id);
      if (!p || Math.abs(c.value - p.value) < 3) return [];
      return [{ c, prev: p.value, d: c.value - p.value }];
    }).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 6)
    : [];
  return (
    <View>
      <Card>
        <Text style={styles.kicker}>Состав</Text>
        <Text style={styles.hero}>{getFormation(setup.formationId).name}</Text>
        <Text style={styles.subline}>{BUILDUP_RU[setup.buildUp]} · {APPROACH_RU[setup.defApproach]} · линия {setup.lineHeight}</Text>
        <View style={styles.tags}>
          {ev.tags.length ? ev.tags.map((t, i) => (
            <View key={t} style={[styles.tag, i > 0 && styles.tagQuiet]}>
              <Text style={[styles.tagT, i > 0 && styles.tagQuietT]}>{t}</Text>
            </View>
          )) : <Text style={styles.note}>Сбалансированный профиль</Text>}
        </View>
        <Row style={{ marginTop: space.md }}>
          <Metric label="Опасность" value={ev.rating} color={scoreColor(ev.rating)} delta={prevEv ? ev.rating - prevEv.rating : undefined} />
          <Metric label="Атака" value={ev.attackScore} color={scoreColor(ev.attackScore)} delta={prevEv ? ev.attackScore - prevEv.attackScore : undefined} />
          <Metric label="Риск" value={ev.defRisk} color={riskColor(ev.defRisk)} delta={prevEv ? ev.defRisk - prevEv.defRisk : undefined} invert />
        </Row>
      </Card>

      <Card>
        <Row gap={8}>
          <ChartIcon size={18} color={C.garnetL} />
          <H style={styles.hFlat}>Тактический профиль</H>
        </Row>
        <View style={{ alignItems: 'center' }}>
          <Spider data={keys.map((k) => ({ label: SPIDER_RU[k], v: ev.spider[k] }))} prev={prevEv ? keys.map((k) => prevEv.spider[k]) : undefined} size={Math.min(300, inner)} />
        </View>
        {prevEv ? <Text style={styles.note}>Пунктир — прошлая версия.</Text> : null}
      </Card>

      <Card>
        <H>Плюсы и минусы</H>
        <View style={styles.sides}>
          <SideList title="Сильнее" color={C.good} rows={plus} />
          <SideList title="Уязвимее" color={C.bad} rows={minus} />
        </View>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <H style={styles.hFlat}>Форма</H>
          <View style={styles.tag}><Text style={styles.tagT}>{shape}</Text></View>
        </Row>
        <Row gap={8} style={{ alignItems: 'flex-start', marginTop: space.sm }}>
          <View style={styles.pitchCol}><Pitch setup={setup} ev={ev} W={half} mode="in" small /><Text style={styles.pitchCap}>С мячом</Text></View>
          <View style={styles.pitchCol}><Pitch setup={setup} ev={ev} W={half} mode="out" small /><Text style={styles.pitchCap}>Без мяча</Text></View>
        </Row>
        <View style={{ marginTop: space.md }}>
          <LaneBars title="Атака по коридорам" d={lanes.attack} color={C.garnet} />
          <LaneBars title="Оборона по коридорам" d={lanes.defence} color={C.blueL} />
        </View>
        <Row>
          <Metric label="Блок" value={`${Math.round(blockY * 100)}%`} />
          <Metric label="Линия" value={`${Math.round(defLine * 100)}%`} />
          <Metric label="Страховка" value={ev.extras.restCount.toFixed(1)} />
        </Row>
      </Card>

      <Card>
        <Row gap={8}>
          <ShieldIcon size={18} color={C.blueL} />
          <H style={styles.hFlat}>Прессинг</H>
        </Row>
        <Text style={styles.note}>{ap.nameRu}. {ap.runTracking}.{ap.offsideTrap ? ' Ловушка офсайда.' : ''}</Text>
        <Row style={{ marginTop: space.sm }}>
          <Metric label="Контрпрессинг" value={ev.risks.cpress} color={riskColor(ev.risks.cpress)} delta={prevEv ? ev.risks.cpress - prevEv.risks.cpress : undefined} invert />
          <Metric label="Расход" value={`×${ap.staminaMult}`} />
          <Metric label="К 75'" value={`${Math.round(ev.extras.avgEnergy75)}%`} />
        </Row>
        <View style={styles.pressers}>
          {pressers.map((s) => (
            <View key={s.slot.id} style={styles.presser}>
              <Text style={styles.presserN} numberOfLines={1}>{s.player!.nameRu}</Text>
              <Text style={styles.presserR} numberOfLines={1}>{s.role.nameRu}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <H style={styles.hFlat}>Что изменилось</H>
          {prev ? <Btn label="Отменить" kind="ghost" icon={<UndoIcon size={14} color={C.text} />} onPress={undo} style={{ paddingVertical: 6 }} /> : null}
        </Row>
        {!prev ? <Text style={[styles.note, { marginTop: space.sm }]}>Пока без правок. Изменение на «Поле» появится здесь.</Text> : (
          <View style={{ marginTop: space.sm, gap: 8 }}>
            <Text style={styles.note}>{prev.labelRu}</Text>
            {diff.slice(0, 8).map((d, i) => (
              <View key={i} style={styles.diffRow}>
                <View style={styles.diffDot} />
                <T small style={{ flex: 1 }}>{d}</T>
              </View>
            ))}
            {moved.map((m) => (
              <View key={m.c.id} style={styles.moveRow}>
                <Row gap={6} style={{ flex: 1, paddingRight: 8 }}>
                  {m.c.group === 'attack' ? <BallIcon size={14} color={C.sub} /> : <ShieldIcon size={14} color={C.sub} />}
                  <Text style={styles.moveName} numberOfLines={1}>{clean(m.c.nameRu)}</Text>
                </Row>
                <Text style={styles.moveNums}>{m.prev} → {m.c.value}</Text>
                <Delta v={m.d} invert={m.c.group === 'defence'} />
              </View>
            ))}
            {history.length > 1 ? (
              <Text style={styles.note} numberOfLines={2}>{history.slice(-4).map((h) => h.labelRu).reverse().join('  ←  ')}</Text>
            ) : null}
          </View>
        )}
      </Card>
      <Disclaimer compact />
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { ...typo.caption, color: C.gold, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  hero: { color: C.text, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6, marginTop: 2 },
  subline: { ...typo.footnote, marginTop: 2 },
  hFlat: { marginBottom: 0, flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.md },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(237,187,0,0.14)' },
  tagQuiet: { backgroundColor: C.card2 },
  tagT: { color: C.gold, fontSize: 11, lineHeight: 14, fontWeight: '700' },
  tagQuietT: { color: C.sub },
  note: { ...typo.footnote, color: C.sub },
  sides: { flexDirection: 'row', gap: 16 },
  sideTitle: { ...typo.caption, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  sideHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sideName: { ...typo.caption, color: C.text, flex: 1 },
  sideVal: { fontSize: 12, lineHeight: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  pitchCol: { alignItems: 'center', gap: 4 },
  pitchCap: { ...typo.caption },
  pressers: { flexDirection: 'row', gap: 8, marginTop: space.md },
  presser: { flex: 1, backgroundColor: C.card2, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 8, gap: 2 },
  presserN: { ...typo.caption, color: C.text, fontWeight: '700' },
  presserR: { ...typo.caption, color: C.dim },
  diffRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  diffDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.gold, marginTop: 6 },
  moveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 },
  moveName: { ...typo.footnote, color: C.text, flex: 1 },
  moveNums: { ...typo.caption, fontVariant: ['tabular-nums'], color: C.sub },
});
