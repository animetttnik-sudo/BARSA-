import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { C, signed } from './theme';

export function Card({ children, style, accent }: { children: React.ReactNode; style?: ViewStyle; accent?: string }) {
  return <View style={[s.card, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null, style]}>{children}</View>;
}
export function H({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[s.h, style]}>{children}</Text>;
}
export function T({ children, style, dim, small, b }: { children: React.ReactNode; style?: TextStyle | TextStyle[]; dim?: boolean; small?: boolean; b?: boolean }) {
  return <Text style={[s.t, dim && { color: C.sub }, small && { fontSize: 12, lineHeight: 16 }, b && { fontWeight: '700' }, style as any]}>{children}</Text>;
}
export function Chip({ label, active, onPress, color, small, testID }: { label: string; active?: boolean; onPress?: () => void; color?: string; small?: boolean; testID?: string }) {
  const c = color ?? C.blueL;
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [s.chip, small && s.chipSm, active && { backgroundColor: c, borderColor: c }, pressed && { opacity: 0.7 }]}>
      <Text style={[s.chipT, small && { fontSize: 11 }, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}
export function Btn({ label, onPress, kind = 'primary', disabled, style, icon, testID }: { label: string; onPress?: () => void; kind?: 'primary' | 'garnet' | 'ghost' | 'gold'; disabled?: boolean; style?: ViewStyle; icon?: string; testID?: string }) {
  const bg = kind === 'primary' ? C.blue : kind === 'garnet' ? C.garnet : kind === 'gold' ? C.gold : 'transparent';
  return (
    <Pressable testID={testID} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.btn, { backgroundColor: bg }, kind === 'ghost' && { borderWidth: 1, borderColor: C.line }, disabled && { opacity: 0.4 }, pressed && { opacity: 0.75 }, style]}>
      <Text style={[s.btnT, kind === 'gold' && { color: '#1a1300' }]}>{icon ? icon + '  ' : ''}{label}</Text>
    </Pressable>
  );
}
export function Bar({ value, color, max = 100, height = 6, bg = C.line }: { value: number; color: string; max?: number; height?: number; bg?: string }) {
  return (
    <View style={{ height, backgroundColor: bg, borderRadius: height / 2, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, height, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}
export function Delta({ v, invert, suffix = '' }: { v: number; invert?: boolean; suffix?: string }) {
  if (!v) return <Text style={[s.t, { color: C.dim, fontSize: 12 }]}>±0{suffix}</Text>;
  const good = invert ? v < 0 : v > 0;
  return <Text style={[s.t, { color: good ? C.good : C.bad, fontSize: 12, fontWeight: '700' }]}>{signed(v)}{suffix}</Text>;
}
export function Row({ children, style, gap = 8 }: { children: React.ReactNode; style?: ViewStyle; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}
export function Badge({ label, color }: { label: string; color: string }) {
  return <View style={[s.badge, { backgroundColor: color + '33', borderColor: color }]}><Text style={[s.badgeT, { color }]}>{label}</Text></View>;
}
export function Disclaimer({ compact }: { compact?: boolean }) {
  return (
    <View style={s.disc}>
      <Text style={s.discT}>
        {compact
          ? 'ℹ️ Это эвристическая модель, а не движок EA FC 26. Цифры — оценка, а не предсказание матча.'
          : 'ℹ️ Важно: это эвристика. Код движка EA FC 26 закрыт, поэтому позиции, риски и рейтинг считаются по упрощённой модели: атрибуты игроков, PlayStyles, описания ролей и фокусов из игры и правила, которые я вывел сам. Модель показывает тенденции («что станет лучше/хуже»), а не точный результат матча. Проверяй выводы в игре.'}
      </Text>
    </View>
  );
}
export function Sheet({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={s.sheet}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[s.h, { flex: 1, marginBottom: 0 }]} numberOfLines={2}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}><Text style={{ color: C.sub, fontSize: 22 }}>✕</Text></Pressable>
          </Row>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 12 }}>{children}</ScrollView>
          {footer}
        </View>
      </View>
    </Modal>
  );
}
export function Spinner({ label }: { label: string }) {
  return <View style={{ padding: 24, alignItems: 'center', gap: 10 }}><ActivityIndicator color={C.gold} size="large" /><T dim>{label}</T></View>;
}
export function Metric({ label, value, color, delta, invert }: { label: string; value: number | string; color?: string; delta?: number; invert?: boolean }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricL}>{label}</Text>
      <Text style={[s.metricV, color ? { color } : null]}>{value}</Text>
      {delta !== undefined ? <Delta v={delta} invert={invert} /> : null}
    </View>
  );
}

export const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  h: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  t: { color: C.text, fontSize: 13.5, lineHeight: 19 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.card2, marginRight: 6, marginBottom: 6 },
  chipSm: { paddingHorizontal: 8, paddingVertical: 4 },
  chipT: { color: C.sub, fontSize: 12.5, fontWeight: '600' },
  btn: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnT: { color: '#fff', fontWeight: '800', fontSize: 14 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  badgeT: { fontSize: 11, fontWeight: '800' },
  disc: { backgroundColor: '#1d1630', borderColor: '#4a3470', borderWidth: 1, borderRadius: 12, padding: 10, marginVertical: 8 },
  discT: { color: '#cfc3ea', fontSize: 12, lineHeight: 17 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg2, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '88%', borderTopWidth: 2, borderColor: C.garnet },
  metric: { flex: 1, backgroundColor: C.card2, borderRadius: 10, padding: 8, alignItems: 'center' },
  metricL: { color: C.sub, fontSize: 11, textAlign: 'center' },
  metricV: { color: C.text, fontSize: 20, fontWeight: '800' },
});
