import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { APPROACHES, BUILDUPS, FORMATIONS, getApproach, getFormation, getPlayer } from '../model/data';
import { applyPatch, bench, changeFormation, swapSlots, switchSquadMode } from '../model/setup';
import { posFamiliarity } from '../model/profile';
import { useStore } from '../state';
import { Btn, Card, Chip, Disclaimer, H, Row, T } from '../ui/kit';
import { Legend, Pitch, PitchMode } from '../ui/Pitch';
import { C } from '../ui/theme';
import { shortName } from '../ui/labels';
import { SlotSheet } from './SlotSheet';

export function PitchScreen({ W, onWhy, setScroll }: { W: number; onWhy: () => void; setScroll: (b: boolean) => void }) {
  const { setup, ev, commit } = useStore();
  const [mode, setMode] = useState<PitchMode>('shape');
  const [sheet, setSheet] = useState<string | null>(null);
  const [benchSel, setBenchSel] = useState<string | null>(null);
  const ap = getApproach(setup.defApproach);
  const bn = bench(setup);
  const onTap = (id: string) => {
    if (benchSel) {
      commit(applyPatch(setup, { swaps: [{ slot: id, playerId: benchSel }] }), `${id}: ${getPlayer(benchSel)?.nameRu} из запаса`);
      setBenchSel(null);
    } else setSheet(id);
  };
  const line = (d: number) => {
    const v = Math.max(ap.lineMin, Math.min(ap.lineMax, setup.lineHeight + d));
    commit({ ...setup, lineHeight: v }, `Высота линии ${v}`);
  };
  const benchSelPlayer = getPlayer(benchSel);
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
        {FORMATIONS.map((f) => (
          <Chip key={f.id} label={f.name} active={f.id === setup.formationId} onPress={() => commit(changeFormation(setup, f.id), `Схема ${f.name}`)} />
        ))}
      </ScrollView>
      <Row style={{ marginBottom: 6 }} gap={0}>
        <Chip label="Схема" active={mode === 'shape'} onPress={() => setMode('shape')} color={C.garnet} />
        <Chip label="С мячом" active={mode === 'in'} onPress={() => setMode('in')} color={C.garnet} />
        <Chip label="Без мяча" active={mode === 'out'} onPress={() => setMode('out')} color={C.garnet} />
      </Row>
      <Pitch
        setup={setup} ev={ev} W={W} mode={mode}
        onTapSlot={onTap}
        onSwap={(a, b) => commit(swapSlots(setup, a, b), `Обмен ${a} ↔ ${b}`)}
        onDragState={(d) => setScroll(!d)}
        highlight={benchSel ? ev.slots.filter((s) => benchSelPlayer && posFamiliarity(benchSelPlayer, s.slot.pos) !== 'oop').map((s) => s.slot.id) : undefined}
        dimTokens={!!benchSel}
        label={mode === 'shape' ? getFormation(setup.formationId).name : mode === 'in' ? 'Позиции с мячом (модель)' : 'Позиции без мяча (модель)'}
      />
      <Legend />
      <T dim small style={{ marginTop: 4 }}>Нажми на игрока — роль, фокус и замена. Перетащи игрока на другого — поменять местами.</T>

      <View style={{ marginTop: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <H style={{ marginBottom: 2 }}>Запас ({bn.length})</H>
          {benchSel ? <Pressable onPress={() => setBenchSel(null)}><Text style={{ color: C.gold }}>Отмена</Text></Pressable> : null}
        </Row>
        <T dim small>{benchSel ? `Выбран ${benchSelPlayer?.nameRu} — теперь нажми на слот на поле (подсвечены подходящие позиции).` : 'Нажми на игрока запаса, затем на слот на поле.'}</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          {bn.map((p) => (
            <Pressable key={p.id} onPress={() => setBenchSel(benchSel === p.id ? null : p.id)} style={{ alignItems: 'center', width: 64, marginRight: 4, opacity: benchSel && benchSel !== p.id ? 0.5 : 1 }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: benchSel === p.id ? C.gold : C.blue, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: benchSel === p.id ? '#000' : '#fff', fontWeight: '800', fontSize: 12 }}>{p.number ?? '·'}</Text>
              </View>
              <Text style={{ color: C.text, fontSize: 10 }} numberOfLines={1}>{shortName(p)}</Text>
              <Text style={{ color: C.dim, fontSize: 9 }}>{p.positions.slice(0, 2).join('/')}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Btn testID="btn-why" label="ПОЧЕМУ НЕ РАБОТАЕТ?" kind="garnet" icon="🩺" onPress={onWhy} style={{ marginVertical: 12 }} />

      <Card>
        <H>Тактика команды</H>
        <T dim small>Стиль розыгрыша (Build-Up Style)</T>
        <Row style={{ flexWrap: 'wrap', marginTop: 4 }} gap={0}>
          {BUILDUPS.map((b) => <Chip key={b.id} label={b.nameRu} active={setup.buildUp === b.id} onPress={() => commit(applyPatch(setup, { buildUp: b.id }), `Розыгрыш: ${b.nameRu}`)} />)}
        </Row>
        <T dim small>{BUILDUPS.find((b) => b.id === setup.buildUp)?.descRu}</T>
        <T dim small style={{ marginTop: 10 }}>Подход в обороне (Defensive Approach)</T>
        <Row style={{ flexWrap: 'wrap', marginTop: 4 }} gap={0}>
          {APPROACHES.map((a) => <Chip key={a.id} label={a.nameRu} active={setup.defApproach === a.id} onPress={() => commit(applyPatch(setup, { defApproach: a.id }), `Подход: ${a.nameRu}`)} />)}
        </Row>
        <T dim small>Слежение за забеганиями: {ap.runTracking}. Давление: {ap.pressure}.{ap.offsideTrap ? ' Ловушка офсайда включена.' : ''}</T>
        <Row style={{ marginTop: 10, justifyContent: 'space-between' }}>
          <T>Высота линии: <Text style={{ color: C.gold, fontWeight: '800' }}>{setup.lineHeight}</Text> <Text style={{ color: C.dim }}>({ap.lineMin}–{ap.lineMax})</Text></T>
          <Row>
            <Btn label="−5" kind="ghost" onPress={() => line(-5)} style={{ paddingVertical: 6 }} />
            <Btn label="−1" kind="ghost" onPress={() => line(-1)} style={{ paddingVertical: 6 }} />
            <Btn label="+1" kind="ghost" onPress={() => line(1)} style={{ paddingVertical: 6 }} />
            <Btn label="+5" kind="ghost" onPress={() => line(5)} style={{ paddingVertical: 6 }} />
          </Row>
        </Row>
      </Card>

      <Card>
        <H>Режим</H>
        <T dim small>База игроков</T>
        <Row style={{ flexWrap: 'wrap', marginTop: 4 }} gap={0}>
          <Chip label="Состав FC 26" active={setup.squadMode === 'fc26'} onPress={() => commit(switchSquadMode(setup, 'fc26'), 'База: FC 26')} color={C.garnet} />
          <Chip label="Реальный 2026/27" active={setup.squadMode === 'real2627'} onPress={() => commit(switchSquadMode(setup, 'real2627'), 'База: реальный 2026/27')} color={C.garnet} />
        </Row>
        <T dim small>{setup.squadMode === 'fc26' ? 'Игроки и атрибуты из базы FC 26 (состав Барселоны в игре).' : 'Реальный состав 2026/27: ушедшие убраны, новички (Родри, Габриэл Жезус, Гордон, Адейеми, Ливакович) — с атрибутами из FC 26 их нынешних клубов.'}</T>
        <T dim small style={{ marginTop: 8 }}>Тип матча (выносливость)</T>
        <Row style={{ flexWrap: 'wrap', marginTop: 4 }} gap={0}>
          <Chip label="Authentic" active={setup.matchMode === 'authentic'} onPress={() => commit({ ...setup, matchMode: 'authentic' }, 'Режим Authentic')} color={C.garnet} />
          <Chip label="Competitive" active={setup.matchMode === 'competitive'} onPress={() => commit({ ...setup, matchMode: 'competitive' }, 'Режим Competitive')} color={C.garnet} />
        </Row>
        <T dim small>По Pitch Notes EA: в Competitive игрок под твоим управлением не замедляется от усталости (ИИ-партнёры устают), в Authentic усталость действует на всех. Учитывается в планировщике замен.</T>
      </Card>
      <Disclaimer compact />
      <SlotSheet slotId={sheet} onClose={() => setSheet(null)} />
    </View>
  );
}
