import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseIcon, InfoIcon } from './icons';
import { GlassTile } from './glass';
import { haptic } from './haptics';
import { C, nums, radius, signed, type as typo } from './theme';

export function Card({ children, style, accent }: { children: React.ReactNode; style?: ViewStyle; accent?: string }) {
  return (
    <View style={[s.card, accent ? { borderLeftWidth: 2, borderLeftColor: accent } : null, style]}>
      {children}
    </View>
  );
}

export function H({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[s.h, style]}>{children}</Text>;
}

export function T({ children, style, dim, small, b }: { children: React.ReactNode; style?: TextStyle | TextStyle[]; dim?: boolean; small?: boolean; b?: boolean }) {
  return <Text style={[s.t, dim && { color: C.sub }, small && { fontSize: 15, lineHeight: 20 }, b && { fontWeight: '700' }, style as any]}>{children}</Text>;
}

export function SectionTitle({ children, onExplain }: { children: React.ReactNode; onExplain?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Text style={[s.h, { flex: 1, marginBottom: 0 }]}>{children}</Text>
      {onExplain ? <ExplainButton onPress={onExplain} /> : null}
    </View>
  );
}

export function ExplainButton({ onPress, label = 'Пояснения' }: { onPress: () => void; label?: string }) {
  return (
    <GlassTile size={34} onPress={onPress} accessibilityLabel={label}>
      <Text style={{ color: C.gold, fontSize: 18, fontWeight: '800', marginTop: -1 }}>?</Text>
    </GlassTile>
  );
}

export function useExplain() {
  const [item, setItem] = useState<{ title: string; body: string } | null>(null);
  const sheet = (
    <Sheet visible={!!item} onClose={() => setItem(null)} title={item?.title ?? 'Пояснение'}>
      {item ? <Text style={{ color: C.text, fontSize: 17, lineHeight: 24 }}>{item.body}</Text> : null}
    </Sheet>
  );
  return { open: (title: string, body: string) => setItem({ title, body }), sheet };
}

export function Chip({ label, active, onPress, color, small, testID }: { label: string; active?: boolean; onPress?: () => void; color?: string; small?: boolean; testID?: string }) {
  const c = color ?? C.blueL;
  return (
    <Pressable
      testID={testID}
      onPress={onPress ? () => { haptic('selection'); onPress(); } : undefined}
      hitSlop={4}
      style={({ pressed }) => [
        s.chip,
        small && s.chipSm,
        active && { backgroundColor: c, borderColor: c },
        pressed && { opacity: 0.72, transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={[s.chipT, small && { fontSize: 14, lineHeight: 18 }, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Btn({
  label, onPress, kind = 'primary', disabled, style, icon, testID,
}: {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'garnet' | 'ghost' | 'gold';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  testID?: string;
}) {
  const bg = kind === 'primary' ? C.blue : kind === 'garnet' ? C.garnet : kind === 'gold' ? C.gold : 'transparent';
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={onPress && !disabled ? () => { haptic(kind === 'ghost' ? 'selection' : 'light'); onPress(); } : undefined}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg },
        kind === 'ghost' && { borderWidth: StyleSheet.hairlineWidth, borderColor: C.line },
        disabled && { opacity: 0.4 },
        pressed && !disabled && { opacity: 0.72, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <View style={s.btnInner}>
        {icon}
        <Text style={[s.btnT, kind === 'gold' && { color: '#1a1300' }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function Bar({ value, color, max = 100, height = 6, bg = C.grid }: { value: number; color: string; max?: number; height?: number; bg?: string }) {
  return (
    <View style={{ height, backgroundColor: bg, borderRadius: height / 2, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, height, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

export function Delta({ v, invert, suffix = '' }: { v: number; invert?: boolean; suffix?: string }) {
  if (!v) return <Text style={[s.t, s.num, { color: C.dim, fontSize: 16 }]}>±0{suffix}</Text>;
  const good = invert ? v < 0 : v > 0;
  return <Text style={[s.t, s.num, { color: good ? C.good : C.bad, fontSize: 16, fontWeight: '700' }]}>{signed(v)}{suffix}</Text>;
}

export function Row({ children, style, gap = 8 }: { children: React.ReactNode; style?: ViewStyle; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.badge, { backgroundColor: color + '33', borderColor: color }]}>
      <Text style={[s.badgeT, { color }]}>{label}</Text>
    </View>
  );
}

export function Disclaimer({ compact }: { compact?: boolean }) {
  return (
    <View style={s.disc}>
      <View style={{ marginTop: 1 }}>
        <InfoIcon size={16} color={C.blueL} />
      </View>
      <Text style={s.discT}>
        {compact
          ? 'Это эвристическая модель, а не движок EA FC 26. Цифры — оценка, а не предсказание матча.'
          : 'Важно: это эвристика. Код движка EA FC 26 закрыт, поэтому позиции, риски и рейтинг считаются по упрощённой модели: атрибуты игроков, PlayStyles, описания ролей и фокусов из игры и правила, которые я вывел сам. Модель показывает тенденции («что станет лучше/хуже»), а не точный результат матча. Проверяй выводы в игре.'}
      </Text>
    </View>
  );
}

export function Sheet({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[s.sheet, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          <View style={s.handle} />
          <View style={s.sheetHead}>
            <Text style={[s.h, { flex: 1, marginBottom: 0, paddingRight: 8 }]} numberOfLines={2}>{title}</Text>
            <Pressable
              onPress={() => { haptic('selection'); onClose(); }}
              hitSlop={4}
              style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
            >
              <CloseIcon size={18} color={C.sub} />
            </Pressable>
          </View>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 12 }}>{children}</ScrollView>
          {footer}
        </View>
      </View>
    </Modal>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <View style={{ padding: 24, alignItems: 'center', gap: 10 }}>
      <ActivityIndicator color={C.gold} size="large" />
      <T dim>{label}</T>
    </View>
  );
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
  card: {
    backgroundColor: C.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
  },
  h: { ...typo.title, marginBottom: 8 },
  t: typo.callout,
  num: nums,
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 32,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
    backgroundColor: C.card2,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSm: { paddingHorizontal: 8, paddingVertical: 4, minHeight: 28 },
  chipT: { color: C.sub, fontSize: 15, fontWeight: '600' },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 17, letterSpacing: -0.2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  badgeT: { fontSize: 13, fontWeight: '700' },
  disc: {
    backgroundColor: 'rgba(47,123,216,0.10)',
    borderColor: 'rgba(47,123,216,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  discT: { color: C.sub, fontSize: 16, lineHeight: 22, flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.bg2,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '88%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginBottom: 8,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 44,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metric: {
    flex: 1,
    backgroundColor: C.card2,
    borderRadius: radius.sm,
    padding: 10,
    alignItems: 'center',
  },
  metricL: { ...typo.caption, textAlign: 'center' },
  metricV: typo.metric,
});
