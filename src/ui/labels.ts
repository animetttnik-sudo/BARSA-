import { getPlayer, getRole } from '../model/data';
import type { Player } from '../model/types';
import { C } from './theme';

export function shortName(p?: Player | null): string {
  if (!p) return '—';
  const w = p.nameRu.split(' ');
  if (w.length === 1) return p.nameRu;
  if (w[0] === 'тер') return 'тер Штеген';
  return `${w[0][0]}. ${w[w.length - 1]}`;
}

const PARTICLES = new Set(['де', 'тер', 'ван', 'ди', 'да', 'дос', 'дель', 'фон', 'аль']);

/** Фамилия целиком — для фишки на поле, без инициала и без обрезки. */
export function surname(p?: Player | null): string {
  if (!p) return '—';
  const w = p.nameRu.split(/\s+/).filter(Boolean);
  if (w.length <= 1) return p.nameRu;
  const i = w.findIndex((x) => PARTICLES.has(x.toLowerCase()));
  if (i >= 0) return w.slice(i).join(' ');
  return w[w.length - 1];
}

/** Кольцо фишки: золото только у role++, голубой у role+, светлый у своей позиции. */
export const FAM_COLOR: Record<string, string> = {
  'role++': C.gold,
  'role+': '#7FB6FF',
  natural: '#FFFFFF',
  related: C.warn,
  oop: C.bad,
};
const ABBR: Record<string, string> = {
  goalkeeper: 'GK', sweeper_keeper: 'SK', ball_playing_keeper: 'BPK', fullback: 'FB', wingback: 'WB', falseback: 'FaB', attacking_wingback: 'AWB',
  inverted_wingback: 'IWB', defender: 'D', stopper: 'STP', ball_playing_defender: 'BPD', wide_back: 'WiB', holding: 'HLD', deep_lying_playmaker: 'DLP',
  centre_half: 'CH', wide_half: 'WH', box_crasher: 'BC', box_to_box: 'B2B', playmaker: 'PM', half_winger: 'HW', shadow_striker: 'SS', classic_10: 'C10',
  winger: 'W', wide_midfielder: 'WM', wide_playmaker: 'WP', inside_forward: 'IF', advanced_forward: 'AF', poacher: 'P', false_9: 'F9', target_forward: 'TF',
};
const FOCUS_ABBR: Record<string, string> = { Defend: 'Защ', Balanced: 'Бал', Attack: 'Атк', 'Build-Up': 'Роз', Support: 'Подд', Roaming: 'Своб', 'Ball-Winning': 'Отб', Aggressive: 'Агр', Versatile: 'Унив', Wide: 'Фл' };
export const roleAbbr = (id: string) => ABBR[id] ?? id.slice(0, 3).toUpperCase();
export const focusAbbr = (f: string) => FOCUS_ABBR[f] ?? f;
export const focusRu = (roleId: string, f: string) => getRole(roleId)?.focuses.find((x) => x.id === f)?.nameRu ?? f;
export const roleRu = (roleId: string) => getRole(roleId)?.nameRu ?? roleId;
export const playerRu = (id?: string | null) => getPlayer(id)?.nameRu ?? '—';
export const POS_RU: Record<string, string> = {
  GK: 'ВРТ', LB: 'ЛЗ', RB: 'ПЗ', LWB: 'ЛФЗ', RWB: 'ПФЗ', CB: 'ЦЗ', CDM: 'ЦОП', CM: 'ЦП', CAM: 'ЦАП', LM: 'ЛП', RM: 'ПП', LW: 'ЛВ', RW: 'ПВ', ST: 'ФРВ',
};
export const POS_FULL_RU: Record<string, string> = {
  GK: 'Вратарь', LB: 'Левый защитник', RB: 'Правый защитник', LWB: 'Левый фланговый защитник', RWB: 'Правый фланговый защитник',
  CB: 'Центральный защитник', CDM: 'Опорный полузащитник', CM: 'Центральный полузащитник', CAM: 'Атакующий полузащитник',
  LM: 'Левый полузащитник', RM: 'Правый полузащитник', LW: 'Левый вингер', RW: 'Правый вингер', ST: 'Нападающий',
};
export const BUILDUP_RU: Record<string, string> = { Short: 'Короткий пас', Balanced: 'Сбалансированный', Counter: 'Контратака' };
export const APPROACH_RU: Record<string, string> = { Deep: 'Глубокий блок', Balanced: 'Сбалансированный', High: 'Высокий', Aggressive: 'Агрессивный' };
