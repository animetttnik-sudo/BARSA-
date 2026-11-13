import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { APPROACHES, BUILDUPS, FORMATIONS, getApproach, getPlayer } from '../model/data';
import { snapRoleFocus, type RoleSnap } from '../model/engine';
import { applyPatch, bench, changeFormation, swapSlots, switchSquadMode } from '../model/setup';
import { posFamiliarity } from '../model/profile';
import { useStore } from '../state';
import { GlassTile } from '../ui/glass';
import { haptic } from '../ui/haptics';
import { ArrowUpIcon, PitchIcon, ShieldCheckIcon, TacticsBoardIcon, TargetIcon } from '../ui/icons';
import { Jersey } from '../ui/jersey';
import { Btn, Card, Chip, H, Row, SectionTitle } from '../ui/kit';
import { Legend, Pitch, type PitchMode } from '../ui/Pitch';
import { shortName } from '../ui/labels';
import { C } from '../ui/theme';
import { SlotSheet } from './SlotSheet';

const MODE_RU: Record<PitchMode, string> = { shape: 'Схема', in: 'С мячом', out: 'Без мяча', board: 'Доска' };

export function PitchScreen({ W, onWhy, setScroll }: { W: number; onWhy: () => void; setScroll: (b: boolean) => void }) {
  const { setup, ev, commit } = useStore();
  const [mode, setMode] = useState<PitchMode>('shape');
  const [sheet, setSheet] = useState<string | null>(null);
  const [benchSel, setBenchSel] = useState<string | null>(null);
  const [live, setLive] = useState<{ slotId: string; snap: RoleSnap } | null>(null);
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
  const pickMode = (m: PitchMode) => { setMode(m); if (m !== 'board') setLive(null); };
  const onBoardMove = (slotId: string, x: number, y: number) => {
    const snap = snapRoleFocus(setup, slotId, x, y);
    setLive((prev) => (prev && prev.slotId === slotId && prev.snap.roleId === snap.roleId && prev.snap.focus === snap.focus ? prev : { slotId, snap }));
  };
  const onBoardDrop = (slotId: string, x: number, y: number) => {
    const snap = snapRoleFocus(setup, slotId, x, y);
    setLive(null);
    commit(applyPatch(setup, { roles: [{ slot: slotId, roleId: snap.roleId, focus: snap.focus }] }), `Доска · ${slotId}: ${snap.roleRu} / ${snap.focusRu}`);
    haptic('light');
    return snap.pos;
  };
  const benchSelPlayer = getPlayer(benchSel);
  const board = mode === 'board';
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {FORMATIONS.map((f) => (
          <Chip key={f.id} label={f.name} active={f.id === setup.formationId} onPress={() => commit(changeFormation(setup, f.id), `Схема ${f.name}`)} />
        ))}
      </ScrollView>
      <Row style={{ marginBottom: 8 }}>
        <GlassTile testID="mode-shape" size={44} active={mode === 'shape'} onPress={() => pickMode('shape')} accessibilityLabel="Схема">
          <PitchIcon size={22} color="#F4F7FF" />
        </GlassTile>
        <GlassTile testID="mode-in" size={44} active={mode === 'in'} onPress={() => pickMode('in')} accessibilityLabel="С мячом">
          <ArrowUpIcon size={22} />
        </GlassTile>
        <GlassTile testID="mode-out" size={44} active={mode === 'out'} onPress={() => pickMode('out')} accessibilityLabel="Без мяча">
          <ShieldCheckIcon size={22} />
        </GlassTile>
        <GlassTile testID="mode-board" size={44} active={board} onPress={() => pickMode('board')} accessibilityLabel="Доска тактики">
          <TacticsBoardIcon size={22} />
        </GlassTile>
        <Text style={{ flex: 1, textAlign: 'right', color: C.text, fontSize: 20, fontWeight: '800' }}>{MODE_RU[mode]}</Text>
      </Row>
      <Pitch
        setup={setup} ev={ev} W={W} mode={mode} board={board}
        onTapSlot={onTap}
        onSwap={(a, b) => commit(swapSlots(setup, a, b), `Обмен ${a} ↔ ${b}`)}
        onBoardMove={onBoardMove}
        onBoardDrop={onBoardDrop}
        onDragState={(d) => { setScroll(!d); if (!d) setLive(null); }}
        ghost={live?.snap.pos}
        liveChip={live ? { role: live.snap.roleRu, focus: live.snap.focusRu } : null}
        highlight={benchSel ? ev.slots.filter((s) => benchSelPlayer && posFamiliarity(benchSelPlayer, s.slot.pos) !== 'oop').map((s) => s.slot.id) : undefined}
        dimTokens={!!benchSel}
      />
      <Legend />

      <View style={{ marginTop: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <H style={{ marginBottom: 0 }}>{benchSelPlayer ? benchSelPlayer.nameRu : `Запас · ${bn.length}`}</H>
          {benchSel ? (
            <Pressable onPress={() => setBenchSel(null)} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ color: C.gold, fontSize: 16, fontWeight: '700' }}>Отмена</Text>
            </Pressable>
          ) : null}
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {bn.map((p) => (
            <Pressable key={p.id} onPress={() => setBenchSel(benchSel === p.id ? null : p.id)} style={{ alignItems: 'center', marginRight: 12, opacity: benchSel && benchSel !== p.id ? 0.45 : 1 }}>
              <Jersey width={40} variant={benchSel === p.id ? 'gold' : p.positions[0] === 'GK' ? 'gk' : 'bib'} number={p.number} emphasized={benchSel === p.id} />
              <Text style={{ color: C.text, fontSize: 14, fontWeight: '700', marginTop: 2 }}>{shortName(p)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Btn testID="btn-why" label="Почему не работает?" kind="garnet" icon={<TargetIcon size={18} color="#fff" />} onPress={onWhy} style={{ marginVertical: 14 }} />

      <Card>
        <SectionTitle>Тактика</SectionTitle>
        <Row style={{ flexWrap: 'wrap' }} gap={0}>
          {BUILDUPS.map((b) => <Chip key={b.id} label={b.nameRu} active={setup.buildUp === b.id} onPress={() => commit(applyPatch(setup, { buildUp: b.id }), `Розыгрыш: ${b.nameRu}`)} />)}
        </Row>
        <Row style={{ flexWrap: 'wrap', marginTop: 4 }} gap={0}>
          {APPROACHES.map((a) => <Chip key={a.id} label={a.nameRu} active={setup.defApproach === a.id} onPress={() => commit(applyPatch(setup, { defApproach: a.id }), `Подход: ${a.nameRu}`)} />)}
        </Row>
        <Row style={{ marginTop: 8, justifyContent: 'space-between' }}>
          <Text style={{ color: C.text, fontSize: 17, fontWeight: '700' }}>
            Линия <Text style={{ color: C.gold, fontSize: 22, fontWeight: '800' }}>{setup.lineHeight}</Text>
            <Text style={{ color: C.sub, fontSize: 15 }}>  {ap.lineMin}–{ap.lineMax}</Text>
          </Text>
        </Row>
        <Row style={{ marginTop: 8 }}>
          <Btn label="−5" kind="ghost" onPress={() => line(-5)} style={{ flex: 1 }} />
          <Btn label="−1" kind="ghost" onPress={() => line(-1)} style={{ flex: 1 }} />
          <Btn label="+1" kind="ghost" onPress={() => line(1)} style={{ flex: 1 }} />
          <Btn label="+5" kind="ghost" onPress={() => line(5)} style={{ flex: 1 }} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>Состав</SectionTitle>
        <Row style={{ flexWrap: 'wrap' }} gap={0}>
          <Chip label="FC 26" active={setup.squadMode === 'fc26'} onPress={() => commit(switchSquadMode(setup, 'fc26'), 'База: FC 26')} color={C.garnet} />
          <Chip label="2026/27" active={setup.squadMode === 'real2627'} onPress={() => commit(switchSquadMode(setup, 'real2627'), 'База: реальный 2026/27')} color={C.garnet} />
        </Row>
        <Row style={{ flexWrap: 'wrap' }} gap={0}>
          <Chip label="Authentic" active={setup.matchMode === 'authentic'} onPress={() => commit({ ...setup, matchMode: 'authentic' }, 'Режим Authentic')} color={C.garnet} />
          <Chip label="Competitive" active={setup.matchMode === 'competitive'} onPress={() => commit({ ...setup, matchMode: 'competitive' }, 'Режим Competitive')} color={C.garnet} />
        </Row>
      </Card>
      <SlotSheet slotId={sheet} onClose={() => setSheet(null)} />
    </View>
  );
}
