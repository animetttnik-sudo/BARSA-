import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { SVG_FONT, C, scoreColor } from './theme';

export function Spider({ data, prev, size = 240 }: { data: { label: string; v: number }[]; prev?: number[]; size?: number }) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 64;
  const pt = (i: number, v: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / data.length; return [cx + Math.cos(a) * R * (v / 100), cy + Math.sin(a) * R * (v / 100)]; };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, Math.max(4, v)).join(',')).join(' ');
  return (
    <Svg width={size} height={size}>
      {[25, 50, 75, 100].map((r) => <Polygon key={r} points={poly(data.map(() => r))} fill="none" stroke={C.grid} strokeWidth={1} />)}
      {data.map((_, i) => { const [x, y] = pt(i, 100); return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.grid} />; })}
      {prev ? <Polygon points={poly(prev)} fill="rgba(154,167,194,0.12)" stroke={C.sub} strokeDasharray="4,3" strokeWidth={1.2} /> : null}
      <Polygon points={poly(data.map((d) => d.v))} fill="rgba(165,0,68,0.35)" stroke={C.garnetL} strokeWidth={2} />
      {data.map((d, i) => { const [x, y] = pt(i, 128); return <SvgText fontFamily={SVG_FONT} key={d.label} x={x} y={y} fill={C.text} fontSize={13} fontWeight="700" textAnchor="middle">{`${d.label} ${d.v}`}</SvgText>; })}
    </Svg>
  );
}

export function Gauge({ value, size = 200, label }: { value: number; size?: number; label?: string }) {
  const r = size / 2 - 14, cx = size / 2, cy = size / 2 + 6;
  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from / 100), a1 = Math.PI * (1 - to / 100);
    const p0 = [cx + r * Math.cos(a0), cy - r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
    return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`;
  };
  return (
    <Svg width={size} height={size / 2 + 30}>
      <Path d={arc(0, 100)} stroke={C.grid} strokeWidth={16} fill="none" strokeLinecap="round" />
      <Path d={arc(0, Math.max(1, value))} stroke={scoreColor(value)} strokeWidth={16} fill="none" strokeLinecap="round" />
      <SvgText fontFamily={SVG_FONT} x={cx} y={cy - 8} fill={C.text} fontSize={42} fontWeight="900" textAnchor="middle">{String(value)}</SvgText>
      {label ? <SvgText fontFamily={SVG_FONT} x={cx} y={cy + 18} fill={C.sub} fontSize={15} textAnchor="middle">{label}</SvgText> : null}
    </Svg>
  );
}

const PALETTE = ['#EDBB00', '#E0306E', '#2F7BD8', '#36C98E', '#F2A93B', '#B07CFF', '#66D9EF', '#FF8A65', '#9CCC65', '#F06292', '#90A4AE'];
export function EnergyChart({ curves, W, subs }: { curves: { nameRu: string; points: number[]; threshold: number }[]; W: number; subs?: { minute: number; outRu: string }[] }) {
  const H = 190, L = 30, B = 22, T = 8;
  const x = (m: number) => L + (m / 90) * (W - L - 8), y = (e: number) => T + (1 - (e - 30) / 70) * (H - T - B);
  return (
    <View>
      <Svg width={W} height={H}>
        {[40, 60, 80, 100].map((e) => <G key={e}><Line x1={L} x2={W - 8} y1={y(e)} y2={y(e)} stroke={C.grid} /><SvgText fontFamily={SVG_FONT} x={0} y={y(e) + 4} fill={C.dim} fontSize={13}>{String(e)}</SvgText></G>)}
        {[0, 15, 30, 45, 60, 75, 90].map((m) => <SvgText fontFamily={SVG_FONT} key={m} x={x(m)} y={H - 4} fill={C.dim} fontSize={13} textAnchor="middle">{`${m}'`}</SvgText>)}
        <Line x1={x(45)} x2={x(45)} y1={T} y2={H - B} stroke={C.sub} strokeDasharray="3,3" />
        <Rect x={L} y={y(64)} width={W - L - 8} height={y(56) - y(64)} fill="rgba(240,80,110,0.12)" />
        {curves.map((c, i) => (
          <Path key={c.nameRu} d={c.points.map((p, k) => `${k ? 'L' : 'M'} ${x(k * 5)} ${y(Math.max(30, p))}`).join(' ')} stroke={PALETTE[i % PALETTE.length]} strokeWidth={1.8} fill="none" opacity={0.95} />
        ))}
        {(subs ?? []).map((s, i) => <Circle key={i} cx={x(s.minute)} cy={T + 6} r={4} fill={C.gold} />)}
      </Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {curves.map((c, i) => <Text key={c.nameRu} style={{ color: PALETTE[i % PALETTE.length], fontSize: 15, fontWeight: '600' }}>{c.nameRu} {c.points[18]}%</Text>)}
      </View>
    </View>
  );
}

export function LaneBars({ title, d, color }: { title: string; d: { L: number; C: number; R: number }; color: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>{title}</Text>
      <View style={{ flexDirection: 'row', height: 32, borderRadius: 10, overflow: 'hidden' }}>
        {(['L', 'C', 'R'] as const).map((k, i) => (
          <View key={k} style={{ flex: Math.max(d[k], 8), backgroundColor: color, opacity: 0.45 + (d[k] / 100) * 1.2, alignItems: 'center', justifyContent: 'center', borderLeftWidth: i ? 1 : 0, borderColor: C.bg }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{k === 'L' ? 'Лев' : k === 'C' ? 'Центр' : 'Прав'} {d[k]}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
