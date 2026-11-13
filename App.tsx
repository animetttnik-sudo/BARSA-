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
import { BarcaCrest } from './src/ui/crest';
import { GlassTile } from './src/ui/glass';
import { HelpBody } from './src/ui/help';
import { haptic } from './src/ui/haptics';
import { TAB_ICONS, UndoIcon, type IconProps } from './src/ui/icons';
import { Sheet } from './src/ui/kit';
import { C, nums, scoreColor } from './src/ui/theme';

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
  const [help, setHelp] = useState(false);
  const [scroll, setScroll] = useState(true);
  const sv = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const W = Math.min(width, 560) - 24;
  const tile = width < 390 ? 36 : 42;
  const go = (t: Tab) => { setTab(t); sv.current?.scrollTo({ y: 0, animated: false }); };
  const ratingColor = scoreColor(ev.rating);
  const tabLabel = TABS.find((t) => t.id === tab)?.label ?? '';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <GlassTile size={52} accessibilityLabel="Барселона">
          <BarcaCrest size={38} />
        </GlassTile>
        <GlassTile testID="btn-help" size={44} onPress={() => setHelp(true)} accessibilityLabel="Пояснения">
          <Text style={styles.q}>?</Text>
        </GlassTile>
        <View style={{ flex: 1 }} />
        <GlassTile
          size={44}
          disabled={!history.length}
          onPress={() => { if (history.length) undo(); }}
          accessibilityLabel="Отменить"
        >
          <UndoIcon size={22} color="#F4F7FF" />
        </GlassTile>
        <GlassTile size={44} onPress={() => go('rating')} accessibilityLabel={`Опасность ${ev.rating}`}>
          <Text style={[styles.rate, { color: ratingColor }]}>{ev.rating}</Text>
        </GlassTile>
      </View>
      <ScrollView ref={sv} scrollEnabled={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 28, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        {!ready ? null : tab === 'pitch' ? <PitchScreen W={W} onWhy={() => setWhy(true)} setScroll={setScroll} />
          : tab === 'summary' ? <SummaryScreen W={W} />
          : tab === 'cplus' ? <CounterPlusScreen W={W} />
          : tab === 'cminus' ? <CounterMinusScreen W={W} />
          : tab === 'rating' ? <RatingScreen W={W} />
          : <SubsScreen W={W} />}
        {tab === 'pitch' ? (
          <Pressable onPress={() => { haptic('light'); reset(); }} hitSlop={8} style={{ alignSelf: 'center', marginTop: 8, minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: C.sub, fontSize: 16, fontWeight: '600' }}>Сбросить состав</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={styles.tabBar}>
        <Text style={styles.tabCurrent}>{tabLabel}</Text>
        <View style={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.Icon;
            return (
              <Pressable
                key={t.id}
                testID={`tab-${t.id}`}
                onPress={() => { haptic('selection'); go(t.id); }}
                style={({ pressed }) => [styles.tab, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t.label}
              >
                <GlassTile size={tile} active={active} style={{ opacity: active ? 1 : 0.72 }}>
                  <Icon size={Math.round(tile * 0.52)} />
                </GlassTile>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
      <WhyModal visible={why} onClose={() => setWhy(false)} W={W} />
      <Sheet visible={help} onClose={() => setHelp(false)} title="Пояснения">
        <HelpBody tab={tab} />
      </Sheet>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 64,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
  },
  q: { color: C.gold, fontSize: 22, fontWeight: '800', marginTop: -1 },
  rate: { fontSize: 16, fontWeight: '800', letterSpacing: -0.4, ...nums },
  tabBar: {
    backgroundColor: 'rgba(9,17,36,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.hairline,
    paddingTop: 6,
  },
  tabCurrent: {
    color: C.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingBottom: 4,
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
