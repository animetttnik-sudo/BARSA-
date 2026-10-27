import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
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
import { C, scoreColor } from './src/ui/theme';

type Tab = 'pitch' | 'summary' | 'cplus' | 'cminus' | 'rating' | 'subs';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'pitch', label: 'Поле', icon: '⚽' },
  { id: 'summary', label: 'Сводка', icon: '📋' },
  { id: 'cplus', label: 'Контра +', icon: '⚡' },
  { id: 'cminus', label: 'Контра −', icon: '🛡' },
  { id: 'rating', label: 'Рейтинг', icon: '📈' },
  { id: 'subs', label: 'Замены', icon: '🔁' },
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
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: C.line, gap: 8 }}>
        <View style={{ width: 6, height: 30, borderRadius: 3, backgroundColor: C.garnet }} />
        <View style={{ width: 6, height: 30, borderRadius: 3, backgroundColor: C.blue, marginLeft: -6 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontWeight: '900', fontSize: 16 }}>Барса · тактик-лаб</Text>
          <Text style={{ color: C.sub, fontSize: 10.5 }}>EA FC 26 · эвристика, не движок игры</Text>
        </View>
        <Pressable onPress={undo} disabled={!history.length} hitSlop={8} style={{ opacity: history.length ? 1 : 0.3, paddingHorizontal: 6 }}>
          <Text style={{ color: C.text, fontSize: 20 }}>↶</Text>
        </Pressable>
        <Pressable onPress={() => go('rating')} style={{ backgroundColor: C.card2, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: scoreColor(ev.rating), alignItems: 'center' }}>
          <Text style={{ color: scoreColor(ev.rating), fontWeight: '900', fontSize: 18 }}>{ev.rating}</Text>
          <Text style={{ color: C.sub, fontSize: 8.5 }}>опасность</Text>
        </Pressable>
      </View>
      <ScrollView ref={sv} scrollEnabled={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        {!ready ? null : tab === 'pitch' ? <PitchScreen W={W} onWhy={() => setWhy(true)} setScroll={setScroll} />
          : tab === 'summary' ? <SummaryScreen W={W} />
          : tab === 'cplus' ? <CounterPlusScreen W={W} />
          : tab === 'cminus' ? <CounterMinusScreen W={W} />
          : tab === 'rating' ? <RatingScreen W={W} />
          : <SubsScreen W={W} />}
        {tab === 'pitch' ? <Pressable onPress={reset} style={{ alignSelf: 'center', marginTop: 8 }}><Text style={{ color: C.dim, fontSize: 12 }}>Сбросить к стартовому составу</Text></Pressable> : null}
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: C.bg2, borderTopWidth: 1, borderColor: C.line }}>
        <View style={{ flexDirection: 'row' }}>
          {TABS.map((t) => (
            <Pressable key={t.id} testID={`tab-${t.id}`} onPress={() => go(t.id)} style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderTopWidth: 2, borderColor: tab === t.id ? C.garnetL : 'transparent' }}>
              <Text style={{ fontSize: 16, opacity: tab === t.id ? 1 : 0.6 }}>{t.icon}</Text>
              <Text style={{ color: tab === t.id ? C.text : C.sub, fontSize: 10, fontWeight: tab === t.id ? '800' : '500' }} numberOfLines={1}>{t.label}</Text>
            </Pressable>
          ))}
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
