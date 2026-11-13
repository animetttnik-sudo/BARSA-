import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Evaluation, SlotEval } from '../model/engine';
import { getFormation, getPlayer } from '../model/data';
import type { Setup } from '../model/types';
import { haptic } from './haptics';
import { FAM_COLOR, focusAbbr, roleAbbr, surname } from './labels';
import { C, nums } from './theme';

export type PitchMode = 'shape' | 'in' | 'out';
export const PAD = 10;
export const pitchH = (W: number) => Math.round(W * 1.36);
export const toPx = (W: number, x: number, y: number) => {
  const H = pitchH(W);
  return { x: PAD + x * (W - 2 * PAD), y: PAD + (1 - y) * (H - 2 * PAD) };
};

const LINE = 'rgba(255,255,255,0.78)';
const LINE_DIM = 'rgba(255,255,255,0.42)';
const GRASS_DARK = '#0C221C';
const GRASS_LIGHT = '#164536';

function penaltyArc(cx: number, spotY: number, edgeY: number, r: number, bulge: 'down' | 'up') {
  const dy = Math.abs(edgeY - spotY);
  if (dy >= r - 0.4) return '';
  const dx = Math.sqrt(r * r - dy * dy);
  const sweep = bulge === 'down' ? 1 : 0;
  return `M ${cx - dx} ${edgeY} A ${r} ${r} 0 0 ${sweep} ${cx + dx} ${edgeY}`;
}

export function PitchLines({ W }: { W: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '') || 'pitch';
  const H = pitchH(W);
  const iw = W - 2 * PAD;
  const ih = H - 2 * PAD;
  const x0 = PAD;
  const y0 = PAD;
  const x1 = PAD + iw;
  const y1 = PAD + ih;
  const midY = y0 + ih / 2;
  const cx = W / 2;
  const rCenter = iw * 0.13;
  const boxW = iw * 0.58;
  const boxH = ih * 0.16;
  const sixW = iw * 0.26;
  const sixH = ih * 0.055;
  const bx = (w: number) => x0 + (iw - w) / 2;
  const spotOff = ih * 0.105;
  const cr = Math.min(11, Math.max(6, iw * 0.022));
  const gw = iw * 0.118;
  const gd = Math.min(7, PAD - 2);
  const gx = (W - gw) / 2;
  const stripes = Array.from({ length: 10 }, (_, i) => i);
  const corners = [
    `M ${x0} ${y0 + cr} A ${cr} ${cr} 0 0 0 ${x0 + cr} ${y0}`,
    `M ${x1 - cr} ${y0} A ${cr} ${cr} 0 0 1 ${x1} ${y0 + cr}`,
    `M ${x1} ${y1 - cr} A ${cr} ${cr} 0 0 1 ${x1 - cr} ${y1}`,
    `M ${x0 + cr} ${y1} A ${cr} ${cr} 0 0 1 ${x0} ${y1 - cr}`,
  ].join(' ');
  const arcs = [
    penaltyArc(cx, y0 + spotOff, y0 + boxH, rCenter, 'down'),
    penaltyArc(cx, y1 - spotOff, y1 - boxH, rCenter, 'up'),
  ].join(' ');
  const attackGoal = `M ${gx} ${y0} L ${gx} ${y0 - gd} L ${gx + gw} ${y0 - gd} L ${gx + gw} ${y0}`;
  const ownGoal = `M ${gx} ${y1} L ${gx} ${y1 + gd} L ${gx + gw} ${y1 + gd} L ${gx + gw} ${y1}`;

  return (
    <G>
      <Defs>
        <RadialGradient id={`flood-${uid}`} cx="50%" cy="34%" r="74%">
          <Stop offset="0%" stopColor="#1C5242" stopOpacity="0.5" />
          <Stop offset="58%" stopColor={GRASS_DARK} stopOpacity="0.04" />
          <Stop offset="100%" stopColor="#05070B" stopOpacity="0.66" />
        </RadialGradient>
        <RadialGradient id={`atk-${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={`own-${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#9BB4CC" stopOpacity="0.14" />
          <Stop offset="100%" stopColor="#9BB4CC" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <G>
        <Rect x={0} y={0} width={W} height={H} rx={16} fill={GRASS_DARK} />
        {stripes.map((i) => (i % 2 === 1 ? (
          <Rect key={i} x={x0} y={y0 + (i * ih) / 10} width={iw} height={ih / 10 + 0.6} fill={GRASS_LIGHT} />
        ) : null))}
        <Rect x={0} y={0} width={W} height={H} rx={16} fill={`url(#flood-${uid})`} />
        <Ellipse cx={cx} cy={y0 + ih * 0.04} rx={iw * 0.28} ry={ih * 0.1} fill={`url(#atk-${uid})`} />
        <Ellipse cx={cx} cy={y1 - ih * 0.035} rx={iw * 0.22} ry={ih * 0.075} fill={`url(#own-${uid})`} />

        <Rect x={x0} y={y0} width={iw} height={ih} stroke={LINE} strokeWidth={1.2} fill="none" />
        <Line x1={x0} y1={midY} x2={x1} y2={midY} stroke={LINE} strokeWidth={1.2} />
        <Circle cx={cx} cy={midY} r={rCenter} stroke={LINE} strokeWidth={1.2} fill="none" />
        <Circle cx={cx} cy={midY} r={2.15} fill={LINE} />

        <Rect x={bx(boxW)} y={y0} width={boxW} height={boxH} stroke={LINE} strokeWidth={1.2} fill="none" />
        <Rect x={bx(sixW)} y={y0} width={sixW} height={sixH} stroke={LINE} strokeWidth={1.2} fill="none" />
        <Rect x={bx(boxW)} y={y1 - boxH} width={boxW} height={boxH} stroke={LINE} strokeWidth={1.2} fill="none" />
        <Rect x={bx(sixW)} y={y1 - sixH} width={sixW} height={sixH} stroke={LINE} strokeWidth={1.2} fill="none" />
        <Path d={arcs} stroke={LINE} strokeWidth={1.2} fill="none" />
        <Circle cx={cx} cy={y0 + spotOff} r={2} fill={LINE} />
        <Circle cx={cx} cy={y1 - spotOff} r={2} fill={LINE} />
        <Path d={corners} stroke={LINE} strokeWidth={1.2} fill="none" />

        <Path d={attackGoal} stroke="rgba(255,255,255,0.92)" strokeWidth={1.35} fill="none" strokeLinejoin="round" />
        <Path d={ownGoal} stroke={LINE_DIM} strokeWidth={1.15} fill="none" strokeLinejoin="round" />
      </G>
      <Rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={15.5} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
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
  const nameW = small ? 32 : Math.max(64, Math.min(88, (W - 2 * PAD) * 0.2 - 4));
  return (
    <View style={{ width: W, height: H }}>
      <View pointerEvents="none" style={[styles.shadow, { width: W, height: H }]} />
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
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
          nameW={nameW}
        />
      ))}
      {label ? (
        <View pointerEvents="none" style={[styles.label, { zIndex: 8 }]}>
          <Text style={styles.labelT}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

interface TokenProps {
  slotId: string; se?: SlotEval; playerId: string | null; target: { x: number; y: number }; targets: Record<string, { x: number; y: number }>;
  onTap?: (id: string) => void; onSwap?: (a: string, b: string) => void; onDragState?: (d: boolean) => void; selected?: boolean; highlighted?: boolean; dim?: boolean; small?: boolean;
  nameW: number;
}

function nameType(label: string, maxW: number) {
  const n = Math.max(1, [...label].length);
  let fontSize = 11;
  const widthAt = (size: number) => n * size * 0.74;
  while (fontSize > 8 && widthAt(fontSize) > maxW) fontSize -= 0.5;
  return {
    fontSize,
    letterSpacing: n >= 10 ? -0.45 : -0.12,
    lineHeight: Math.round(fontSize + 3),
    width: Math.ceil(widthAt(fontSize)) + 4,
  };
}

function Token({ slotId, se, playerId, target, targets, onTap, onSwap, onDragState, selected, highlighted, dim, small, nameW }: TokenProps) {
  const pos = useRef(new Animated.ValueXY(target)).current;
  const dragging = useRef(false);
  const [lifted, setLifted] = useState(false);
  const live = useRef({ targets, onTap, onSwap, onDragState, target });
  live.current = { targets, onTap, onSwap, onDragState, target };
  useEffect(() => {
    Animated.spring(pos, { toValue: target, useNativeDriver: false, friction: 8, tension: 60 }).start();
  }, [target.x, target.y]);
  const pr = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !!(live.current.onTap || live.current.onSwap),
    onMoveShouldSetPanResponder: (_, g) => !!live.current.onSwap && Math.abs(g.dx) + Math.abs(g.dy) > 6,
    onPanResponderTerminationRequest: () => !dragging.current,
    onPanResponderGrant: () => { dragging.current = false; },
    onPanResponderMove: (_, g) => {
      if (!live.current.onSwap) return;
      if (!dragging.current && Math.abs(g.dx) + Math.abs(g.dy) > 6) {
        dragging.current = true;
        setLifted(true);
        haptic('light');
        live.current.onDragState?.(true);
      }
      if (dragging.current) pos.setValue({ x: live.current.target.x + g.dx, y: live.current.target.y + g.dy });
    },
    onPanResponderRelease: (_, g) => {
      if (!dragging.current) {
        if (live.current.onTap) haptic('selection');
        live.current.onTap?.(slotId);
        return;
      }
      dragging.current = false;
      setLifted(false);
      live.current.onDragState?.(false);
      const x = live.current.target.x + g.dx, y = live.current.target.y + g.dy;
      let best: string | null = null, bd = 34;
      for (const [id, p] of Object.entries(live.current.targets)) {
        if (id === slotId) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bd) { bd = d; best = id; }
      }
      if (best) {
        haptic('success');
        live.current.onSwap?.(slotId, best);
      }
      Animated.spring(pos, { toValue: live.current.target, useNativeDriver: false, friction: 8 }).start();
    },
    onPanResponderTerminate: () => {
      if (dragging.current) {
        dragging.current = false;
        setLifted(false);
        live.current.onDragState?.(false);
      }
      Animated.spring(pos, { toValue: live.current.target, useNativeDriver: false }).start();
    },
  }), [slotId]);
  const p = getPlayer(playerId);
  const sz = small ? 22 : 32;
  const fam = se?.fam ?? 'natural';
  const ring = p ? (FAM_COLOR[fam] ?? '#FFFFFF') : C.dim;
  const isGk = se?.slot.pos === 'GK';
  const name = p ? surname(p) : (se?.slot.pos ?? '—');
  const meta = p && se ? `${se.slot.pos}·${roleAbbr(se.role.id)}·${focusAbbr(se.focus.id)}` : 'пусто';
  const fitted = nameType(name, nameW);
  const boxW = small ? sz + 8 : Math.max(nameW, Math.min(96, fitted.width));
  return (
    <Animated.View
      {...pr.panHandlers}
      testID={`slot-${slotId}`}
      accessibilityRole={onTap ? 'button' : undefined}
      accessibilityLabel={p ? `${p.nameRu}, ${meta}` : name}
      style={[
        styles.token,
        {
          width: boxW,
          marginLeft: -boxW / 2,
          marginTop: -(sz / 2 + 3),
          opacity: lifted ? 1 : dim ? 0.36 : 1,
          zIndex: lifted ? 30 : highlighted || selected ? 4 : 0,
          transform: pos.getTranslateTransform(),
        },
      ]}
    >
      <View style={[
        styles.halo,
        (highlighted || selected) && styles.haloOn,
        lifted && styles.lifted,
        (selected || lifted) && { transform: [{ scale: lifted ? 1.08 : 1.05 }] },
      ]}>
        <View style={[styles.disc, { width: sz, height: sz, borderRadius: sz / 2, borderColor: selected ? C.gold : ring, backgroundColor: p ? (isGk ? '#123F36' : C.garnet) : 'rgba(6,10,14,0.55)' }, !p && styles.empty]}>
          {p && !isGk ? (
            <View style={[StyleSheet.absoluteFill, styles.stripes]}>
              <View style={[styles.stripe, { backgroundColor: C.blue }]} />
              <View style={[styles.stripe, { flex: 1.15, backgroundColor: C.garnet }]} />
              <View style={[styles.stripe, { backgroundColor: C.blue }]} />
            </View>
          ) : null}
          {p && isGk ? <View style={styles.gkBand} /> : null}
          {p ? <View style={styles.sheen} /> : null}
          <Text style={[styles.num, nums, small && { fontSize: 9 }, !p && { color: C.sub }]}>{p ? (p.number ?? '·') : '+'}</Text>
        </View>
      </View>
      {!small ? (
        <>
          <Text style={[styles.name, { fontSize: fitted.fontSize, letterSpacing: fitted.letterSpacing, lineHeight: fitted.lineHeight }]} numberOfLines={1}>{name}</Text>
          <Text style={[styles.meta, { color: p ? ring : C.dim }]} numberOfLines={1}>{meta}</Text>
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    borderRadius: 16,
    backgroundColor: GRASS_DARK,
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  token: { position: 'absolute', left: 0, top: 0, alignItems: 'center', userSelect: 'none' } as any,
  halo: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 2,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  haloOn: { borderColor: 'rgba(237,187,0,0.92)' },
  lifted: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  disc: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  empty: { borderStyle: 'dashed' },
  stripes: { flexDirection: 'row' },
  stripe: { flex: 1 },
  gkBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '40%',
    height: 3,
    backgroundColor: 'rgba(238,242,250,0.72)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  num: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  name: {
    color: '#fff',
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
    alignSelf: 'stretch',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  meta: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    textAlign: 'center',
    alignSelf: 'stretch',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  label: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(8,12,16,0.62)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  labelT: { color: C.text, fontSize: 11, lineHeight: 14, fontWeight: '600' },
});

const LEGEND: { k: string; c: string }[] = [
  { k: 'Роль++', c: FAM_COLOR['role++'] },
  { k: 'Роль+', c: FAM_COLOR['role+'] },
  { k: 'Своя', c: FAM_COLOR.natural },
  { k: 'Смежная', c: FAM_COLOR.related },
  { k: 'Не своя', c: FAM_COLOR.oop },
];

export const Legend = () => (
  <View style={stylesLegend.row}>
    {LEGEND.map((item) => (
      <View key={item.k} style={stylesLegend.item}>
        <View style={[stylesLegend.dot, { borderColor: item.c }]} />
        <Text style={stylesLegend.text}>{item.k}</Text>
      </View>
    ))}
  </View>
);

const stylesLegend = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 12,
    rowGap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, backgroundColor: 'transparent' },
  text: { color: C.sub, fontSize: 11, lineHeight: 14, fontWeight: '500' },
});
