import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import type { Evaluation, SlotEval } from '../model/engine';
import { getFormation, getPlayer } from '../model/data';
import type { Setup } from '../model/types';
import { C } from './theme';
import { focusAbbr, roleAbbr, shortName } from './labels';

export type PitchMode = 'shape' | 'in' | 'out';
export const PAD = 10;
export const pitchH = (W: number) => Math.round(W * 1.36);
export const toPx = (W: number, x: number, y: number) => {
  const H = pitchH(W);
  return { x: PAD + x * (W - 2 * PAD), y: PAD + (1 - y) * (H - 2 * PAD) };
};

const famColor: Record<string, string> = { 'role++': C.gold, 'role+': '#7FB6FF', natural: '#FFFFFF', related: C.warn, oop: C.bad };

export function PitchLines({ W }: { W: number }) {
  const H = pitchH(W);
  const iw = W - 2 * PAD, ih = H - 2 * PAD;
  const bx = (w: number) => PAD + (iw - w * iw) / 2;
  const stripes = Array.from({ length: 10 }, (_, i) => i);
  return (
    <G>
      <Rect x={0} y={0} width={W} height={H} fill={C.pitch} rx={14} />
      {stripes.map((i) => (i % 2 ? <Rect key={i} x={PAD} y={PAD + (i * ih) / 10} width={iw} height={ih / 10} fill={C.pitch2} /> : null))}
      <Rect x={PAD} y={PAD} width={iw} height={ih} stroke={C.pitchLine} strokeWidth={1.5} fill="none" />
      <Line x1={PAD} y1={PAD + ih / 2} x2={PAD + iw} y2={PAD + ih / 2} stroke={C.pitchLine} strokeWidth={1.5} />
      <Circle cx={W / 2} cy={PAD + ih / 2} r={iw * 0.13} stroke={C.pitchLine} strokeWidth={1.5} fill="none" />
      <Rect x={bx(0.58)} y={PAD} width={iw * 0.58} height={ih * 0.16} stroke={C.pitchLine} strokeWidth={1.5} fill="none" />
      <Rect x={bx(0.26)} y={PAD} width={iw * 0.26} height={ih * 0.055} stroke={C.pitchLine} strokeWidth={1.5} fill="none" />
      <Rect x={bx(0.58)} y={PAD + ih * 0.84} width={iw * 0.58} height={ih * 0.16} stroke={C.pitchLine} strokeWidth={1.5} fill="none" />
      <Rect x={bx(0.26)} y={PAD + ih * 0.945} width={iw * 0.26} height={ih * 0.055} stroke={C.pitchLine} strokeWidth={1.5} fill="none" />
      <Rect x={W / 2 - iw * 0.06} y={PAD + ih - 1} width={iw * 0.12} height={4} fill={C.gold} />
    </G>
  );
}

interface Props {
  setup: Setup;
  ev: Evaluation;
  W: number;
  mode?: PitchMode;
  overlay?: React.ReactNode;
  underlay?: React.ReactNode;
  onTapSlot?: (slotId: string) => void;
  onSwap?: (a: string, b: string) => void;
  onDragState?: (dragging: boolean) => void;
  selected?: string | null;
  highlight?: string[];
  dimTokens?: boolean;
  small?: boolean;
  label?: string;
}

export function Pitch({ setup, ev, W, mode = 'shape', overlay, underlay, onTapSlot, onSwap, onDragState, selected, highlight, dimTokens, small, label }: Props) {
  const H = pitchH(W);
  const f = getFormation(setup.formationId);
  const targets = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    for (const s of ev.slots) {
      const p = mode === 'in' ? s.posIn : mode === 'out' ? s.posOut : { x: s.slot.x, y: s.slot.y };
      m[s.slot.id] = toPx(W, p.x, p.y);
    }
    return m;
  }, [ev, mode, W]);
  const evBySlot = useMemo(() => new Map(ev.slots.map((s) => [s.slot.id, s])), [ev]);
  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill as any}>
        <PitchLines W={W} />
        {underlay}
        {overlay}
      </Svg>
      {f.slots.map((sl) => (
        <Token
          key={f.id + sl.id}
          slotId={sl.id}
          se={evBySlot.get(sl.id)}
          playerId={setup.slots[sl.id]?.playerId ?? null}
          target={targets[sl.id] ?? toPx(W, sl.x, sl.y)}
          targets={targets}
          onTap={onTapSlot}
          onSwap={onSwap}
          onDragState={onDragState}
          selected={selected === sl.id}
          highlighted={highlight?.includes(sl.id)}
          dim={dimTokens && !highlight?.includes(sl.id)}
          small={small}
        />
      ))}
      {label ? <View style={styles.label}><Text style={styles.labelT}>{label}</Text></View> : null}
    </View>
  );
}

interface TokenProps {
  slotId: string; se?: SlotEval; playerId: string | null; target: { x: number; y: number }; targets: Record<string, { x: number; y: number }>;
  onTap?: (id: string) => void; onSwap?: (a: string, b: string) => void; onDragState?: (d: boolean) => void; selected?: boolean; highlighted?: boolean; dim?: boolean; small?: boolean;
}
function Token({ slotId, se, playerId, target, targets, onTap, onSwap, onDragState, selected, highlighted, dim, small }: TokenProps) {
  const pos = useRef(new Animated.ValueXY(target)).current;
  const cur = useRef(target);
  const dragging = useRef(false);
  const live = useRef({ targets, onTap, onSwap, onDragState, target });
  live.current = { targets, onTap, onSwap, onDragState, target };
  useEffect(() => {
    cur.current = target;
    Animated.spring(pos, { toValue: target, useNativeDriver: false, friction: 8, tension: 60 }).start();
  }, [target.x, target.y]);
  const pr = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !!(live.current.onTap || live.current.onSwap),
    onMoveShouldSetPanResponder: (_, g) => !!live.current.onSwap && Math.abs(g.dx) + Math.abs(g.dy) > 6,
    onPanResponderTerminationRequest: () => !dragging.current,
    onPanResponderGrant: () => { dragging.current = false; },
    onPanResponderMove: (_, g) => {
      if (!live.current.onSwap) return;
      if (!dragging.current && Math.abs(g.dx) + Math.abs(g.dy) > 6) { dragging.current = true; live.current.onDragState?.(true); }
      if (dragging.current) pos.setValue({ x: live.current.target.x + g.dx, y: live.current.target.y + g.dy });
    },
    onPanResponderRelease: (_, g) => {
      if (!dragging.current) { live.current.onTap?.(slotId); return; }
      dragging.current = false; live.current.onDragState?.(false);
      const x = live.current.target.x + g.dx, y = live.current.target.y + g.dy;
      let best: string | null = null, bd = 34;
      for (const [id, p] of Object.entries(live.current.targets)) {
        if (id === slotId) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bd) { bd = d; best = id; }
      }
      if (best) live.current.onSwap?.(slotId, best);
      Animated.spring(pos, { toValue: live.current.target, useNativeDriver: false, friction: 8 }).start();
    },
    onPanResponderTerminate: () => {
      if (dragging.current) { dragging.current = false; live.current.onDragState?.(false); }
      Animated.spring(pos, { toValue: live.current.target, useNativeDriver: false }).start();
    },
  }), [slotId]);
  const p = getPlayer(playerId);
  const sz = small ? 22 : 32;
  const fam = se?.fam ?? 'natural';
  return (
    <Animated.View
      {...pr.panHandlers}
      testID={`slot-${slotId}`}
      style={[styles.token, { width: 70, marginLeft: -35, marginTop: -sz / 2, opacity: dim ? 0.35 : 1, transform: pos.getTranslateTransform() }]}
    >
      <View style={[styles.disc, { width: sz, height: sz, borderRadius: sz / 2, borderColor: p ? famColor[fam] : C.dim, backgroundColor: p ? (se?.slot.pos === 'GK' ? '#1f6b4f' : C.garnet) : 'rgba(0,0,0,0.4)' },
        selected && { borderColor: C.gold, borderWidth: 3, transform: [{ scale: 1.15 }] }, highlighted && { shadowColor: C.gold, shadowOpacity: 0.9, shadowRadius: 8, borderColor: C.gold }]}>
        <View style={[StyleSheet.absoluteFill, { borderRadius: sz / 2, overflow: 'hidden', flexDirection: 'row', opacity: 0.55 }]}>
          {p && se?.slot.pos !== 'GK' ? <><View style={{ flex: 1, backgroundColor: C.blue }} /><View style={{ flex: 1 }} /><View style={{ flex: 1, backgroundColor: C.blue }} /></> : null}
        </View>
        <Text style={[styles.num, small && { fontSize: 9 }]}>{p ? (p.number ?? '·') : '+'}</Text>
      </View>
      {!small ? (
        <>
          <Text style={styles.name} numberOfLines={1}>{p ? shortName(p) : 'пусто'}</Text>
          {se ? <Text style={styles.role} numberOfLines={1}>{roleAbbr(se.role.id)}·{focusAbbr(se.focus.id)}</Text> : null}
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  token: { position: 'absolute', left: 0, top: 0, alignItems: 'center', userSelect: 'none' } as any,
  disc: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  num: { color: '#fff', fontWeight: '900', fontSize: 13 },
  name: { color: '#fff', fontSize: 10.5, fontWeight: '700', marginTop: 1, textShadowColor: '#000', textShadowRadius: 3, maxWidth: 70 },
  role: { color: C.gold, fontSize: 9, fontWeight: '700', textShadowColor: '#000', textShadowRadius: 3 },
  label: { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  labelT: { color: C.text, fontSize: 11, fontWeight: '700' },
});

export const Legend = () => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
    {Object.entries({ 'Роль++': famColor['role++'], 'Роль+': famColor['role+'], 'Своя поз.': famColor.natural, 'Смежная': famColor.related, 'Не своя': famColor.oop }).map(([k, c]) => (
      <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: c }} />
        <Text style={{ color: C.sub, fontSize: 11 }}>{k}</Text>
      </View>
    ))}
  </View>
);
