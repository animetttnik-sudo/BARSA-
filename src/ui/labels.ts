import { getPlayer, getRole } from '../model/data';
import type { Player } from '../model/types';

export function shortName(p?: Player | null): string {
  if (!p) return '—';
  const w = p.nameRu.split(' ');
  if (w.length === 1) return p.nameRu;
  if (w[0] === 'тер') return 'тер Штеген';
  return `${w[0][0]}. ${w[w.length - 1]}`;
}
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
export const BUILDUP_RU: Record<string, string> = { Short: 'Короткий пас', Balanced: 'Сбалансированный', Counter: 'Контратака' };
export const APPROACH_RU: Record<string, string> = { Deep: 'Глубокий блок', Balanced: 'Сбалансированный', High: 'Высокий', Aggressive: 'Агрессивный' };
