import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APPROACHES, BUILDUPS, FORMATIONS, getApproach, getFormation, getPlayer } from '../model/data';
import { applyPatch, bench, changeFormation, swapSlots, switchSquadMode } from '../model/setup';
import { posFamiliarity } from '../model/profile';
import type { Player } from '../model/types';
import { useStore } from '../state';
import { DiagnoseIcon } from '../ui/icons';
import { haptic } from '../ui/haptics';
import { Btn, Card, Disclaimer, H, Row, T } from '../ui/kit';
import { Legend, Pitch, PitchMode } from '../ui/Pitch';
import { C, nums, radius, space } from '../ui/theme';
import { surname } from '../ui/labels';
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
  const atMin = setup.lineHeight <= ap.lineMin;
  const atMax = setup.lineHeight >= ap.lineMax;
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.pills}
      >
        {FORMATIONS.map((f) => (
          <Pill
            key={f.id}
            label={f.name}
            active={f.id === setup.formationId}
            onPress={() => commit(changeFormation(setup, f.id), `Схема ${f.name}`)}
          />
        ))}
      </ScrollView>
      <Segment
        value={mode}
        options={[
          { id: 'shape', label: 'Схема' },
          { id: 'in', label: 'С мячом' },
          { id: 'out', label: 'Без мяча' },
        ]}
        onChange={setMode}
      />
      <View style={{ marginTop: space.sm }}>
        <Pitch
          setup={setup} ev={ev} W={W} mode={mode}
          onTapSlot={onTap}
          onSwap={(a, b) => commit(swapSlots(setup, a, b), `Обмен ${a} ↔ ${b}`)}
          onDragState={(d) => setScroll(!d)}
          highlight={benchSel ? ev.slots.filter((slot) => benchSelPlayer && posFamiliarity(benchSelPlayer, slot.slot.pos) !== 'oop').map((slot) => slot.slot.id) : undefined}
          dimTokens={!!benchSel}
          label={mode === 'shape' ? getFormation(setup.formationId).name : mode === 'in' ? 'Позиции с мячом (модель)' : 'Позиции без мяча (модель)'}
        />
      </View>
      <Legend />
      <T dim small style={s.hint}>
        {benchSel
          ? `Золотой контур — куда встаёт ${benchSelPlayer?.nameRu}. Остальные слоты приглушены. Нажми слот.`
          : 'Нажми игрока — роль, фокус и замена. Перетащи на другого — поменять местами.'}
      </T>

      <View style={s.block}>
        <Row style={s.blockHead}>
          <H style={s.blockTitle}>Запас <Text style={s.count}>{bn.length}</Text></H>
          {benchSel ? (
            <Pressable
              onPress={() => { haptic('selection'); setBenchSel(null); }}
              hitSlop={8}
              style={s.cancel}
              accessibilityRole="button"
              accessibilityLabel="Снять выбор"
            >
              <Text style={s.cancelT}>Отмена</Text>
            </Pressable>
          ) : null}
        </Row>
        <T dim small>
          {benchSel
            ? `${benchSelPlayer?.nameRu} выбран. На поле подсвечены своя и смежная позиции.`
            : 'Нажми игрока запаса, затем слот на поле.'}
        </T>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.benchRow}
        >
          {bn.map((p) => (
            <BenchToken
              key={p.id}
              player={p}
              active={benchSel === p.id}
              dim={!!benchSel && benchSel !== p.id}
              onPress={() => setBenchSel(benchSel === p.id ? null : p.id)}
            />
          ))}
        </ScrollView>
      </View>

      <Btn testID="btn-why" label="Почему не работает?" kind="garnet" icon={<DiagnoseIcon size={18} color="#fff" />} onPress={onWhy} style={s.why} />

      <Card>
        <H>Тактика команды</H>
        <Text style={s.kicker}>Стиль розыгрыша</Text>
        <View style={s.wrapPills}>
          {BUILDUPS.map((b) => (
            <Pill key={b.id} label={b.nameRu} active={setup.buildUp === b.id} onPress={() => commit(applyPatch(setup, { buildUp: b.id }), `Розыгрыш: ${b.nameRu}`)} />
          ))}
        </View>
        <T dim small style={s.note}>{BUILDUPS.find((b) => b.id === setup.buildUp)?.descRu}</T>

        <Text style={[s.kicker, { marginTop: space.lg }]}>Подход в обороне</Text>
        <View style={s.wrapPills}>
          {APPROACHES.map((a) => (
            <Pill
              key={a.id}
              label={a.nameRu}
              active={setup.defApproach === a.id}
              onPress={() => commit(applyPatch(setup, { defApproach: a.id }), `Подход: ${a.nameRu}`)}
            />
          ))}
        </View>
        <T dim small style={s.note}>
          Слежение за забеганиями: {ap.runTracking}. Давление: {ap.pressure}.{ap.offsideTrap ? ' Ловушка офсайда включена.' : ''}
        </T>

        <View style={s.lineBlock}>
          <View style={s.lineCopy}>
            <Text style={s.kicker}>Высота линии</Text>
            <Text style={s.lineValue}>
              {setup.lineHeight}
              <Text style={s.lineRange}>  {ap.lineMin}–{ap.lineMax}</Text>
            </Text>
          </View>
          <View style={s.steps}>
            <Step label="−5" disabled={atMin} onPress={() => line(-5)} />
            <Step label="−1" disabled={atMin} onPress={() => line(-1)} />
            <Step label="+1" disabled={atMax} onPress={() => line(1)} />
            <Step label="+5" disabled={atMax} onPress={() => line(5)} />
          </View>
        </View>
      </Card>

      <Card>
        <H>Режим</H>
        <Text style={s.kicker}>База игроков</Text>
        <Segment
          value={setup.squadMode}
          options={[
            { id: 'fc26', label: 'Состав FC 26' },
            { id: 'real2627', label: 'Реальный 2026/27' },
          ]}
          onChange={(id) => commit(switchSquadMode(setup, id), id === 'fc26' ? 'База: FC 26' : 'База: реальный 2026/27')}
        />
        <T dim small style={s.note}>
          {setup.squadMode === 'fc26'
            ? 'Игроки и атрибуты из базы FC 26 (состав Барселоны в игре).'
            : 'Реальный состав 2026/27: ушедшие убраны, новички (Родри, Габриэл Жезус, Гордон, Адейеми, Ливакович) — с атрибутами из FC 26 их нынешних клубов.'}
        </T>

        <Text style={[s.kicker, { marginTop: space.lg }]}>Тип матча</Text>
        <Segment
          value={setup.matchMode}
          options={[
            { id: 'authentic', label: 'Authentic' },
            { id: 'competitive', label: 'Competitive' },
          ]}
          onChange={(id) => commit({ ...setup, matchMode: id }, id === 'authentic' ? 'Режим Authentic' : 'Режим Competitive')}
        />
        <T dim small style={s.note}>
          По Pitch Notes EA: в Competitive игрок под твоим управлением не замедляется от усталости (ИИ-партнёры устают), в Authentic усталость действует на всех. Учитывается в планировщике замен.
        </T>
      </Card>
      <Disclaimer compact />
      <SlotSheet slotId={sheet} onClose={() => setSheet(null)} />
    </View>
  );
}

function Segment<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (id: T) => void }) {
  return (
    <View style={s.segment}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => { if (!on) { haptic('selection'); onChange(o.id); } }}
            style={[s.segmentItem, on && s.segmentOn]}
          >
            <Text style={[s.segmentText, on && s.segmentTextOn]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={() => { if (active) return; haptic('selection'); onPress(); }}
      style={({ pressed }) => [s.pill, active && s.pillOn, pressed && { opacity: 0.72 }]}
    >
      <Text style={[s.pillT, active && s.pillTOn]}>{label}</Text>
    </Pressable>
  );
}

function Step({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
      onPress={disabled ? undefined : () => { haptic('light'); onPress(); }}
      style={({ pressed }) => [s.step, disabled && s.stepOff, pressed && !disabled && { opacity: 0.7 }]}
    >
      <Text style={s.stepT}>{label}</Text>
    </Pressable>
  );
}

function BenchToken({ player, active, dim, onPress }: { player: Player; active: boolean; dim: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => { haptic('selection'); onPress(); }}
      style={({ pressed }) => [s.bench, active && s.benchOn, dim && { opacity: 0.42 }, pressed && { opacity: 0.75 }]}
    >
      <View style={[s.kit, active && { borderColor: C.gold }]}>
        <View style={s.kitStripes}>
          <View style={[s.kitStripe, { backgroundColor: C.blue }]} />
          <View style={[s.kitStripe, { flex: 1.15, backgroundColor: C.garnet }]} />
          <View style={[s.kitStripe, { backgroundColor: C.blue }]} />
        </View>
        <Text style={s.kitNum}>{player.number ?? '·'}</Text>
      </View>
      <View style={s.benchCopy}>
        <Text style={s.benchName}>{surname(player)}</Text>
        <Text style={s.benchPos}>{player.positions.slice(0, 3).join(' · ')}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pills: { gap: space.sm, paddingVertical: 2 },
  wrapPills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  pill: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOn: { backgroundColor: C.blue, borderColor: C.blue },
  pillT: { color: C.sub, fontSize: 13, lineHeight: 16, fontWeight: '600' },
  pillTOn: { color: '#fff' },
  segment: {
    flexDirection: 'row',
    backgroundColor: C.card2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
    padding: 2,
    marginTop: space.sm,
  },
  segmentItem: {
    flex: 1,
    minHeight: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segmentOn: { backgroundColor: 'rgba(255,255,255,0.12)' },
  segmentText: { color: C.sub, fontSize: 13, lineHeight: 16, fontWeight: '600' },
  segmentTextOn: { color: C.text },
  hint: { marginTop: space.sm },
  block: { marginTop: space.lg },
  blockHead: { justifyContent: 'space-between', minHeight: 32 },
  blockTitle: { marginBottom: 0 },
  count: { ...nums, color: C.sub, fontWeight: '600' },
  cancel: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 4 },
  cancelT: { color: C.sub, fontSize: 13, fontWeight: '600' },
  benchRow: { gap: space.sm, paddingTop: space.sm, paddingBottom: 2 },
  bench: {
    minHeight: 56,
    paddingVertical: space.sm,
    paddingLeft: space.sm,
    paddingRight: space.md,
    borderRadius: radius.md,
    backgroundColor: C.card2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  benchOn: { borderColor: C.gold, backgroundColor: 'rgba(237,187,0,0.08)' },
  kit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  kitStripes: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row' },
  kitStripe: { flex: 1 },
  kitNum: { color: '#fff', fontSize: 12, fontWeight: '800', ...nums, textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  benchCopy: { flexShrink: 0 },
  benchName: { color: C.text, fontSize: 12, lineHeight: 15, fontWeight: '700' },
  benchPos: { color: C.sub, fontSize: 11, lineHeight: 14, marginTop: 1 },
  why: { marginTop: space.lg, marginBottom: space.sm },
  kicker: { color: C.sub, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  note: { marginTop: space.sm },
  lineBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.lg, gap: space.sm },
  lineCopy: { flexShrink: 1 },
  lineValue: { color: C.text, fontSize: 22, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4, marginTop: 2, ...nums },
  lineRange: { color: C.dim, fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: 0, ...nums },
  steps: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 0 },
  step: {
    width: 36,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  stepOff: { opacity: 0.35 },
  stepT: { color: C.text, fontSize: 13, fontWeight: '600', ...nums },
});
