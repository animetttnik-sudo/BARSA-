import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import type { Evaluation, SlotEval } from '../model/engine';
import { getFormation, getPlayer } from '../model/data';
import type { Setup } from '../model/types';
import { Jersey } from './jersey';
import { C } from './theme';
import { shortName } from './labels';

export type PitchMode = 'shape' | 'in' | 'out' | 'board';
export const PAD = 10;
export const pitchH = (W: number) => Math.round(W * 1.36);
export const toPx = (W: number, x: number, y: number) => {
  const H = pitchH(W);
  return { x: PAD + x * (W - 2 * PAD), y: PAD + (1 - y) * (H - 2 * PAD) };
};
export const fromPx = (W: number, px: number, py: number) => {
  const H = pitchH(W);
  const x = (px - PAD) / (W - 2 * PAD);
  const y = 1 - (py - PAD) / (H - 2 * PAD);
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
};

const famColor: Record<string, string> = { 'role++': C.gold, 'role+': '#7FB6FF', natural: '#FFFFFF', related: C.warn, oop: C.bad };

export function PitchLines({ W }: { W: number }) {
  const H = pitchH(W);
  const iw = W - 2 * PAD, ih = H - 2 * PAD;
  const bx = (w: number) => PAD + (iw - w * iw) / 2;
  const stripes = Array.from({ length: 10 }, (_, i) => i);
  return (
    <G>
      <Rect x={0} y={0} width={W} height={H} fill={C.pitch} rx={16} />
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
  onBoardMove?: (slotId: string, x: number, y: number) => void;
  onBoardDrop?: (slotId: string, x: number, y: number) => { x: number; y: number } | void;
  board?: boolean;
  ghost?: { x: number; y: number } | null;
  liveChip?: { role: string; focus: string } | null;
  selected?: string | null;
  highlight?: string[];
  dimTokens?: boolean;
  small?: boolean;
  label?: string;
}

export function Pitch({
  setup, ev, W, mode = 'shape', overlay, underlay, onTapSlot, onSwap, onDragState, onBoardMove, onBoardDrop,
  board, ghost, liveChip, selected, highlight, dimTokens, small, label,
}: Props) {
  const H = pitchH(W);
  const f = getFormation(setup.formationId);
  const targets = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    for (const s of ev.slots) {
      const p = mode === 'in' || mode === 'board' ? s.posIn : mode === 'out' ? s.posOut : { x: s.slot.x, y: s.slot.y };
      m[s.slot.id] = toPx(W, p.x, p.y);
    }
    return m;
  }, [ev, mode, W]);
  const evBySlot = useMemo(() => new Map(ev.slots.map((s) => [s.slot.id, s])), [ev]);
  return (
    <View style={[{ width: W, height: H, overflow: 'visible' }, board && styles.boardFrame]}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill as any}>
        <PitchLines W={W} />
        {underlay}
        {overlay}
      </Svg>
      {ghost ? <Ghost W={W} ghost={ghost} /> : null}
      {f.slots.map((sl) => (
        <Token
          key={f.id + sl.id}
          W={W}
          slotId={sl.id}
          se={evBySlot.get(sl.id)}
          playerId={setup.slots[sl.id]?.playerId ?? null}
          target={targets[sl.id] ?? toPx(W, sl.x, sl.y)}
          targets={targets}
          onTap={onTapSlot}
          onSwap={board ? undefined : onSwap}
          onBoardMove={board ? onBoardMove : undefined}
          onBoardDrop={board ? onBoardDrop : undefined}
          board={!!board}
          onDragState={onDragState}
          selected={selected === sl.id}
          highlighted={highlight?.includes(sl.id)}
          dim={dimTokens && !highlight?.includes(sl.id)}
          small={small}
        />
      ))}
      {liveChip ? (
        <View pointerEvents="none" style={styles.liveWrap}>
          <View style={styles.liveChip}>
            <Text style={styles.liveRole} numberOfLines={1}>{liveChip.role}</Text>
            <Text style={styles.liveFocus} numberOfLines={1}>{liveChip.focus}</Text>
          </View>
        </View>
      ) : null}
      {label ? <View style={styles.label}><Text style={styles.labelT}>{label}</Text></View> : null}
    </View>
  );
}

function Ghost({ W, ghost }: { W: number; ghost: { x: number; y: number } }) {
  const pos = useRef(new Animated.ValueXY(toPx(W, ghost.x, ghost.y))).current;
  const primed = useRef(false);
  useEffect(() => {
    const p = toPx(W, ghost.x, ghost.y);
    if (!primed.current) { primed.current = true; pos.setValue(p); return; }
    Animated.spring(pos, { toValue: p, useNativeDriver: false, friction: 7, tension: 90 }).start();
  }, [ghost.x, ghost.y, W, pos]);
  return <Animated.View pointerEvents="none" style={[styles.ghost, { transform: pos.getTranslateTransform() }]} />;
}

interface TokenProps {
  W: number;
  slotId: string;
  se?: SlotEval;
  playerId: string | null;
  target: { x: number; y: number };
  targets: Record<string, { x: number; y: number }>;
  onTap?: (id: string) => void;
  onSwap?: (a: string, b: string) => void;
  onBoardMove?: (slotId: string, x: number, y: number) => void;
  onBoardDrop?: (slotId: string, x: number, y: number) => { x: number; y: number } | void;
  board?: boolean;
  onDragState?: (d: boolean) => void;
  selected?: boolean;
  highlighted?: boolean;
  dim?: boolean;
  small?: boolean;
}
function Token({ W, slotId, se, playerId, target, targets, onTap, onSwap, onBoardMove, onBoardDrop, board, onDragState, selected, highlighted, dim, small }: TokenProps) {
  const pos = useRef(new Animated.ValueXY(target)).current;
  const dragging = useRef(false);
  const live = useRef({ targets, onTap, onSwap, onBoardMove, onBoardDrop, onDragState, target, board, W });
  live.current = { targets, onTap, onSwap, onBoardMove, onBoardDrop, onDragState, target, board, W };
  useEffect(() => {
    if (dragging.current) return;
    Animated.spring(pos, { toValue: target, useNativeDriver: false, friction: 8, tension: 60 }).start();
  }, [target.x, target.y, pos]);
  const pr = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !!(live.current.onTap || live.current.onSwap || live.current.board),
    onMoveShouldSetPanResponder: (_, g) => !!(live.current.onSwap || live.current.board) && Math.abs(g.dx) + Math.abs(g.dy) > 6,
    onPanResponderTerminationRequest: () => !dragging.current,
    onPanResponderGrant: () => { dragging.current = false; },
    onPanResponderMove: (_, g) => {
      const canDrag = !!(live.current.onSwap || live.current.board);
      if (!canDrag) return;
      if (!dragging.current && Math.abs(g.dx) + Math.abs(g.dy) > 6) { dragging.current = true; live.current.onDragState?.(true); }
      if (!dragging.current) return;
      const x = live.current.target.x + g.dx;
      const y = live.current.target.y + g.dy;
      pos.setValue({ x, y });
      if (live.current.board) {
        const field = fromPx(live.current.W, x, y);
        live.current.onBoardMove?.(slotId, field.x, field.y);
      }
    },
    onPanResponderRelease: (_, g) => {
      if (!dragging.current) { live.current.onTap?.(slotId); return; }
      dragging.current = false;
      const x = live.current.target.x + g.dx;
      const y = live.current.target.y + g.dy;
      if (live.current.board) {
        const field = fromPx(live.current.W, x, y);
        const landingField = live.current.onBoardDrop?.(slotId, field.x, field.y);
        const landing = landingField ? toPx(live.current.W, landingField.x, landingField.y) : live.current.target;
        Animated.spring(pos, { toValue: landing, useNativeDriver: false, friction: 8 }).start();
        live.current.onDragState?.(false);
        return;
      }
      live.current.onDragState?.(false);
      let best: string | null = null, bd = 46;
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
  }), [slotId, pos]);
  const p = getPlayer(playerId);
  const jw = small ? 26 : 44;
  const fam = se?.fam ?? 'natural';
  const variant = !p ? 'dark' : highlighted || selected ? 'gold' : se?.slot.pos === 'GK' ? 'gk' : 'home';
  return (
    <Animated.View
      {...pr.panHandlers}
      testID={`slot-${slotId}`}
      style={[styles.token, { width: small ? 40 : 72, marginLeft: small ? -20 : -36, marginTop: small ? -14 : -22, opacity: dim ? 0.35 : 1, transform: pos.getTranslateTransform() }]}
    >
      <Jersey width={jw} variant={variant} number={small ? null : p ? (p.number ?? '·') : '+'} trim={p ? famColor[fam] : C.dim} emphasized={!!(selected || highlighted)} />
      {!small ? <Text style={styles.name}>{p ? shortName(p) : 'пусто'}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  token: { position: 'absolute', left: 0, top: 0, alignItems: 'center', overflow: 'visible', userSelect: 'none' } as any,
  name: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 1,
    textShadowColor: '#000',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
    textAlign: 'center',
  },
  label: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(9,17,36,0.82)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  labelT: { color: C.text, fontSize: 13, fontWeight: '700' },
  boardFrame: { borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(237,187,0,0.55)' },
  ghost: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 36,
    height: 36,
    marginLeft: -18,
    marginTop: -18,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: C.gold,
    backgroundColor: 'rgba(237,187,0,0.16)',
  },
  liveWrap: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center', zIndex: 5 },
  liveChip: {
    backgroundColor: 'rgba(9,17,36,0.92)',
    borderColor: 'rgba(237,187,0,0.85)',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    maxWidth: '88%',
  },
  liveRole: { color: '#fff', fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.3 },
  liveFocus: { color: C.gold, fontSize: 16, lineHeight: 20, fontWeight: '700', marginTop: 1 },
});

export const Legend = () => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
    {Object.entries({ 'Роль++': famColor['role++'], 'Роль+': famColor['role+'], 'Своя': famColor.natural, 'Смежная': famColor.related, 'Чужая': famColor.oop }).map(([k, c]) => (
      <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: c }} />
        <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>{k}</Text>
      </View>
    ))}
  </View>
);
