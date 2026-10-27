import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { evaluate, Evaluation } from './model/engine';
import { defaultSetup } from './model/setup';
import { getFormation, getPlayer, getRole } from './model/data';
import type { Setup } from './model/types';

export interface HistEntry { setup: Setup; labelRu: string; at: number }
interface Store {
  setup: Setup; ev: Evaluation; prev: HistEntry | null; prevEv: Evaluation | null; history: HistEntry[];
  commit: (s: Setup, labelRu: string) => void; undo: () => void; reset: () => void; ready: boolean;
}
const Ctx = createContext<Store>(null as any);
const KEY = 'barca-lab-v1';

function valid(s: any): s is Setup {
  try {
    if (!s || !s.slots || !s.formationId) return false;
    const f = getFormation(s.formationId);
    if (f.id !== s.formationId) return false;
    for (const sl of f.slots) { const a = s.slots[sl.id]; if (!a || !getRole(a.roleId) || (a.playerId && !getPlayer(a.playerId))) return false; }
    return true;
  } catch { return false; }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [setup, setSetup] = useState<Setup>(() => defaultSetup('fc26'));
  const [history, setHistory] = useState<HistEntry[]>([]);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const d = JSON.parse(raw);
          if (valid(d.setup)) { setSetup(d.setup); setHistory((d.history ?? []).filter((h: HistEntry) => valid(h.setup)).slice(-30)); }
        } catch {}
      }
    }).finally(() => { loaded.current = true; setReady(true); });
  }, []);
  useEffect(() => { if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify({ setup, history })).catch(() => {}); }, [setup, history]);
  const cur = useRef(setup); cur.current = setup;
  const hist = useRef(history); hist.current = history;
  const commit = useCallback((s: Setup, labelRu: string) => {
    if (JSON.stringify(s) === JSON.stringify(cur.current)) return;
    setHistory([...hist.current, { setup: cur.current, labelRu, at: Date.now() }].slice(-30));
    setSetup(s);
  }, []);
  const undo = useCallback(() => {
    const h = hist.current; if (!h.length) return;
    setSetup(h[h.length - 1].setup); setHistory(h.slice(0, -1));
  }, []);
  const reset = useCallback(() => commit(defaultSetup(setup.squadMode), 'Сброс к стартовому составу'), [commit, setup.squadMode]);
  const ev = useMemo(() => evaluate(setup), [setup]);
  const prev = history.length ? history[history.length - 1] : null;
  const prevEv = useMemo(() => (prev ? evaluate(prev.setup) : null), [prev]);
  return <Ctx.Provider value={{ setup, ev, prev, prevEv, history, commit, undo, reset, ready }}>{children}</Ctx.Provider>;
}
export const useStore = () => useContext(Ctx);
