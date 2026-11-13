import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/state';
import { PitchScreen } from './src/screens/PitchScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { CounterPlusScreen } from './src/screens/CounterPlusScreen';
import { CounterMinusScreen } from './src/screens/CounterMinusScreen';
import { RatingScreen } from './src/screens/RatingScreen';
import { SubsScreen } from './src/screens/SubsScreen';
import { WhyModal } from './src/screens/WhyModal';
import { haptic } from './src/ui/haptics';
import { TAB_ICONS, UndoIcon, type IconProps } from './src/ui/icons';
import { C, nums, scoreColor, type as typo } from './src/ui/theme';

type Tab = 'pitch' | 'summary' | 'cplus' | 'cminus' | 'rating' | 'subs';
const TABS: { id: Tab; label: string; Icon: React.ComponentType<IconProps> }[] = [
  { id: 'pitch', label: 'Поле', Icon: TAB_ICONS.pitch },
  { id: 'summary', label: 'Сводка', Icon: TAB_ICONS.summary },
  { id: 'cplus', label: 'Контра +', Icon: TAB_ICONS.cplus },
  { id: 'cminus', label: 'Контра −', Icon: TAB_ICONS.cminus },
  { id: 'rating', label: 'Рейтинг', Icon: TAB_ICONS.rating },
  { id: 'subs', label: 'Замены', Icon: TAB_ICONS.subs },
];

function Main() {
  const { ev, undo, history, reset, ready } = useStore();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('pitch');
  const [why, setWhy] = useState(false);
  const [scroll, setScroll] = useState(true);
  const sv = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const W = Math.min(width, 560) - 24;
  const go = (t: Tab) => { setTab(t); sv.current?.scrollTo({ y: 0, animated: false }); };
  const ratingColor = scoreColor(ev.rating);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.mark} accessibilityLabel="Blaugrana">
          <View style={[styles.markBar, { backgroundColor: C.garnet }]} />
          <View style={[styles.markBar, { backgroundColor: C.blue }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Барса · тактик-лаб</Text>
          <Text style={styles.subtitle}>EA FC 26 · эвристика, не движок игры</Text>
        </View>
        <Pressable
          onPress={() => { if (history.length) { haptic('selection'); undo(); } }}
          disabled={!history.length}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Отменить"
          style={({ pressed }) => [styles.iconBtn, { opacity: history.length ? (pressed ? 0.6 : 1) : 0.3 }]}
        >
          <UndoIcon size={20} color={C.text} />
        </Pressable>
        <Pressable
          onPress={() => { haptic('selection'); go('rating'); }}
          accessibilityRole="button"
          accessibilityLabel={`Опасность ${ev.rating}`}
          style={({ pressed }) => [styles.badge, { backgroundColor: ratingColor + '22', borderColor: ratingColor + '59' }, pressed && { opacity: 0.8 }]}
        >
          <Text style={[styles.badgeValue, { color: ratingColor }]}>{ev.rating}</Text>
          <Text style={styles.badgeLabel}>опасность</Text>
        </Pressable>
      </View>
      <ScrollView ref={sv} scrollEnabled={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        {!ready ? null : tab === 'pitch' ? <PitchScreen W={W} onWhy={() => setWhy(true)} setScroll={setScroll} />
          : tab === 'summary' ? <SummaryScreen W={W} />
          : tab === 'cplus' ? <CounterPlusScreen W={W} />
          : tab === 'cminus' ? <CounterMinusScreen W={W} />
          : tab === 'rating' ? <RatingScreen W={W} />
          : <SubsScreen W={W} />}
        {tab === 'pitch' ? (
          <Pressable onPress={() => { haptic('light'); reset(); }} hitSlop={8} style={{ alignSelf: 'center', marginTop: 8, minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: C.dim, fontSize: 13 }}>Сбросить к стартовому составу</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={styles.tabBar}>
        <View style={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.Icon;
            const color = active ? C.garnetL : C.dim;
            return (
              <Pressable
                key={t.id}
                testID={`tab-${t.id}`}
                onPress={() => { haptic('selection'); go(t.id); }}
                style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t.label}
              >
                <View style={[styles.tabIconWell, active && styles.tabIconWellActive]}>
                  <Icon size={22} color={color} focused={active} />
                </View>
                <Text style={[styles.tabLabel, { color: active ? C.text : C.sub, fontWeight: active ? '600' : '500' }]} numberOfLines={1}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
      <WhyModal visible={why} onClose={() => setWhy(false)} W={W} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Main />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
    gap: 10,
  },
  mark: {
    width: 18,
    height: 22,
    flexDirection: 'row',
    gap: 3,
  },
  markBar: {
    flex: 1,
    borderRadius: 2,
  },
  title: typo.title,
  subtitle: typo.subtitle,
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 56,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    ...nums,
  },
  badgeLabel: {
    color: C.sub,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  tabBar: {
    backgroundColor: 'rgba(12,16,24,0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.hairline,
  },
  tabs: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 4,
  },
  tabIconWell: {
    width: 44,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWellActive: {
    backgroundColor: 'rgba(224,48,110,0.16)',
  },
  tabLabel: {
    ...typo.tab,
    marginTop: 1,
  },
});
