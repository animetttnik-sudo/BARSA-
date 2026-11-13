import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { C, scoreColor, space, type as typo } from './theme';

type Pt = { x: number; y: number };

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Мягкая кривая. На почти линейных отрезках остаётся читаемой и не раздувает пики. */
function smooth(pts: Pt[]): string {
  if (!pts.length) return '';
  if (pts.length === 1) return `M ${r1(pts[0].x)} ${r1(pts[0].y)}`;
  let d = `M ${r1(pts[0].x)} ${r1(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${r1(c1x)} ${r1(c1y)}, ${r1(c2x)} ${r1(c2y)}, ${r1(p2.x)} ${r1(p2.y)}`;
  }
  return d;
}

/** Две половины: излом на 45' (восстановление в перерыве) не сглаживается. */
function halves(pts: Pt[]): string {
  if (pts.length < 5) return smooth(pts);
  const mid = Math.round((pts.length - 1) / 2);
  const right = smooth(pts.slice(mid)).replace(/^M/, 'L');
  return `${smooth(pts.slice(0, mid + 1))} ${right}`;
}

const SERIES = ['#A50044', '#004D98', '#C4376A', '#2F7BD8', '#7A1A45', '#1A4E96', '#E07A9A', '#6FA0D8', '#5C2A40', '#9AA7C2'];

export function Spider({ data, prev, size = 240 }: { data: { label: string; v: number }[]; prev?: number[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 58;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / data.length;
    return [cx + Math.cos(a) * R * (v / 100), cy + Math.sin(a) * R * (v / 100)] as const;
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, Math.max(4, v)).join(',')).join(' ');
  const peak = Math.max(...data.map((d) => d.v));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {[25, 50, 75, 100].map((ring) => (
          <Polygon key={ring} points={poly(data.map(() => ring))} fill="none" stroke={C.grid} strokeWidth={StyleSheet.hairlineWidth * 2} />
        ))}
        {data.map((_, i) => {
          const [x, y] = pt(i, 100);
          return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.hairline} strokeWidth={1} />;
        })}
        {prev ? <Polygon points={poly(prev)} fill="rgba(154,167,194,0.08)" stroke={C.sub} strokeDasharray="3,4" strokeWidth={1.25} /> : null}
        <Polygon points={poly(data.map((d) => d.v))} fill="rgba(165,0,68,0.22)" stroke={C.garnet} strokeWidth={2} strokeLinejoin="round" />
        {data.map((d, i) => {
          const [x, y] = pt(i, Math.max(4, d.v));
          const key = d.v === peak && d.v >= 60;
          return <Circle key={d.label} cx={x} cy={y} r={key ? 4 : 3} fill={key ? C.gold : C.garnetL} />;
        })}
      </Svg>
      {data.map((d, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / data.length;
        const lx = cx + Math.cos(a) * (R + 28);
        const ly = cy + Math.sin(a) * (R + 28);
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const w = 72;
        const rawLeft = cos > 0.3 ? lx - 2 : cos < -0.3 ? lx - w + 2 : lx - w / 2;
        const rawTop = sin < -0.35 ? ly - 28 : sin > 0.35 ? ly - 2 : ly - 14;
        const left = Math.max(0, Math.min(size - w, rawLeft));
        const top = Math.max(0, Math.min(size - 28, rawTop));
        const align = cos > 0.3 ? 'left' : cos < -0.3 ? 'right' : 'center';
        return (
          <View key={d.label} style={{ position: 'absolute', left, top, width: w }} pointerEvents="none">
            <Text style={[styles.spiderL, { textAlign: align }]} numberOfLines={1}>{d.label}</Text>
            <Text style={[styles.spiderV, { textAlign: align, color: scoreColor(d.v) }]}>{d.v}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function Gauge({ value, size = 200, label }: { value: number; size?: number; label?: string }) {
  const r = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2 + 4;
  const H = size / 2 + 44;
  const clamped = Math.max(0, Math.min(100, value));
  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from / 100);
    const a1 = Math.PI * (1 - to / 100);
    const p0 = [cx + r * Math.cos(a0), cy - r * Math.sin(a0)];
    const p1 = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
    return `M ${r1(p0[0])} ${r1(p0[1])} A ${r} ${r} 0 0 1 ${r1(p1[0])} ${r1(p1[1])}`;
  };
  const endA = Math.PI * (1 - clamped / 100);
  const ex = cx + r * Math.cos(endA);
  const ey = cy - r * Math.sin(endA);
  const col = scoreColor(clamped);
  return (
    <View style={{ width: size, height: H }} accessibilityLabel={label ? `${label} ${clamped}` : String(clamped)}>
      <Svg width={size} height={H}>
        <Path d={arc(0, 100)} stroke={C.grid} strokeWidth={10} fill="none" strokeLinecap="round" />
        {clamped > 0 ? <Path d={arc(0, Math.max(clamped, 1.5))} stroke={col} strokeWidth={10} fill="none" strokeLinecap="round" /> : null}
        <Circle cx={ex} cy={ey} r={6} fill={col} />
        <Circle cx={ex} cy={ey} r={2.5} fill={C.bg} />
      </Svg>
      <Text style={[styles.gaugeEnd, { left: 6, top: cy + 10 }]}>0</Text>
      <Text style={[styles.gaugeEnd, { right: 2, top: cy + 10 }]}>100</Text>
      <Text style={[styles.gaugeV, { top: cy - 48 }]}>{clamped}</Text>
      {label ? <Text style={[styles.gaugeL, { top: cy + 12 }]} numberOfLines={2}>{label}</Text> : null}
    </View>
  );
}

export type EnergyMode = {
  id: 'authentic' | 'competitive';
  label: string;
  points: number[];
  risk?: number;
};

export function EnergyChart({
  curves, W, subs, modes, active,
}: {
  curves: { nameRu: string; points: number[]; threshold: number }[];
  W: number;
  subs?: { minute: number; outRu: string }[];
  modes?: EnergyMode[];
  active?: 'authentic' | 'competitive';
}) {
  const H = 196;
  const L = 32;
  const T = 16;
  const B = 22;
  const x = (m: number) => L + (m / 90) * (W - L - 10);
  const y = (e: number) => T + (1 - (Math.max(30, Math.min(100, e)) - 30) / 70) * (H - T - B);
  const toPts = (values: number[]) => {
    const n = Math.max(1, values.length - 1);
    return values.map((v, k) => ({ x: x((k / n) * 90), y: y(v) }));
  };
  const base = y(30);
  const legend = curves.map((c, i) => ({ c, i })).sort((a, b) => a.c.points[a.c.points.length - 1] - b.c.points[b.c.points.length - 1]);
  const modeColor = (id: string) => (id === 'authentic' ? C.garnet : C.blueL);
  return (
    <View>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H}>
          <Defs>
            <LinearGradient id="energyWash" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={modeColor(active ?? 'authentic')} stopOpacity={0.28} />
              <Stop offset="1" stopColor={modeColor(active ?? 'authentic')} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {[40, 60, 80, 100].map((e) => (
            <Line key={e} x1={L} x2={W - 10} y1={y(e)} y2={y(e)} stroke={C.grid} strokeWidth={1} />
          ))}
          <Rect x={L} y={y(64)} width={W - L - 10} height={Math.max(0, y(56) - y(64))} fill="rgba(240,80,110,0.18)" />
          <Line x1={x(45)} x2={x(45)} y1={T} y2={H - B} stroke={C.sub} strokeDasharray="2,3" strokeWidth={1} />
          {[60, 70, 85].map((m) => (
            <Line key={m} x1={x(m)} x2={x(m)} y1={T} y2={H - B} stroke={C.gold} strokeOpacity={0.28} strokeWidth={1} />
          ))}
          {curves.map((c, i) => (
            <Path key={`${c.nameRu}-${i}`} d={halves(toPts(c.points))} stroke={SERIES[i % SERIES.length]} strokeWidth={1.35} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
          ))}
          {(modes ?? []).map((m) => {
            const pts = toPts(m.points);
            const on = !active || active === m.id;
            const d = halves(pts);
            return (
              <React.Fragment key={m.id}>
                {on ? <Path d={`${d} L ${r1(pts[pts.length - 1].x)} ${r1(base)} L ${r1(pts[0].x)} ${r1(base)} Z`} fill="url(#energyWash)" stroke="none" /> : null}
                <Path d={d} stroke={modeColor(m.id)} strokeWidth={on ? 2.5 : 1.75} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={on ? undefined : '5,4'} />
              </React.Fragment>
            );
          })}
          {(subs ?? []).map((s, i) => (
            <Circle key={`${s.minute}-${i}`} cx={x(s.minute)} cy={T - 2} r={3.5} fill={C.gold} />
          ))}
        </Svg>
        {[40, 60, 80, 100].map((e) => (
          <Text key={e} style={[styles.yTick, { top: y(e) - 6 }]}>{e}</Text>
        ))}
        {[0, 45, 60, 75, 90].map((m) => (
          <Text key={m} style={[styles.xTick, { left: x(m) - 14, top: H - 16 }]}>{m}'</Text>
        ))}
      </View>
      {modes?.length ? (
        <View style={{ marginTop: space.sm, gap: 6 }}>
          {modes.map((m) => {
            const end = m.points[m.points.length - 1] ?? 0;
            const on = !active || active === m.id;
            return (
              <View key={m.id} style={styles.modeRow}>
                <View style={[styles.modeSwatch, { backgroundColor: modeColor(m.id), height: on ? 3 : 2, opacity: on ? 1 : 0.55 }]} />
                <Text style={[styles.modeName, on ? { color: C.text } : null]}>{m.label}</Text>
                {m.risk !== undefined ? <Text style={styles.modeRisk}>риск {m.risk}</Text> : null}
                <Text style={styles.modeEnd}>{end}%</Text>
              </View>
            );
          })}
        </View>
      ) : null}
      <View style={styles.legend}>
        {legend.map(({ c, i }) => {
          const end = c.points[c.points.length - 1] ?? 0;
          const tired = end < c.threshold;
          return (
            <View key={c.nameRu} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: SERIES[i % SERIES.length] }]} />
              <Text style={styles.legendName} numberOfLines={1}>{c.nameRu}</Text>
              <Text style={[styles.legendEnd, tired ? { color: C.bad } : null]}>{end}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const LANES = [
  { k: 'L' as const, label: 'Левый' },
  { k: 'C' as const, label: 'Центр' },
  { k: 'R' as const, label: 'Правый' },
];

export function LaneBars({ title, d, color }: { title: string; d: { L: number; C: number; R: number }; color: string }) {
  const max = Math.max(d.L, d.C, d.R, 1);
  const leaders = LANES.filter((lane) => d[lane.k] === max);
  const gold = leaders.length === 1 ? leaders[0].k : null;
  return (
    <View style={styles.lanes}>
      <Text style={styles.laneTitle}>{title}</Text>
      <View style={styles.laneRow}>
        {LANES.map((lane) => {
          const on = gold === lane.k;
          const bar = on ? C.gold : color;
          return (
            <View key={lane.k} style={styles.laneCol}>
              <View style={styles.laneHead}>
                <Text style={styles.laneL}>{lane.label}</Text>
                <Text style={[styles.laneV, { color: bar }]}>{d[lane.k]}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${Math.max(6, (d[lane.k] / max) * 100)}%`, backgroundColor: bar }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spiderL: { ...typo.caption, color: C.sub, fontWeight: '600' },
  spiderV: { ...typo.caption, fontSize: 12, lineHeight: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  gaugeV: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: C.text,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  gaugeL: { ...typo.caption, position: 'absolute', left: 24, right: 24, textAlign: 'center' },
  gaugeEnd: { ...typo.caption, position: 'absolute', color: C.dim, fontVariant: ['tabular-nums'] },
  yTick: {
    position: 'absolute',
    left: 0,
    width: 28,
    textAlign: 'right',
    color: C.dim,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  xTick: {
    position: 'absolute',
    width: 28,
    textAlign: 'center',
    color: C.dim,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 22 },
  modeSwatch: { width: 18, borderRadius: 2 },
  modeName: { ...typo.footnote, color: C.sub, fontWeight: '600', flex: 1 },
  modeRisk: { ...typo.caption, fontVariant: ['tabular-nums'] },
  modeEnd: { ...typo.footnote, color: C.text, fontWeight: '700', fontVariant: ['tabular-nums'], width: 40, textAlign: 'right' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.sm },
  legendItem: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 6, flexGrow: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legendName: { ...typo.caption, flex: 1 },
  legendEnd: { ...typo.caption, fontWeight: '700', fontVariant: ['tabular-nums'], color: C.sub },
  lanes: { marginBottom: space.md, gap: 8 },
  laneTitle: { ...typo.footnote, color: C.sub },
  laneRow: { flexDirection: 'row', gap: 10 },
  laneCol: { flex: 1, gap: 6 },
  laneHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 4 },
  laneL: { ...typo.caption, color: C.sub, flex: 1 },
  laneV: { fontSize: 12, lineHeight: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, backgroundColor: C.grid, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3 },
});
