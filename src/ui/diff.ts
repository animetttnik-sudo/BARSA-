import type { Setup } from '../model/types';
import { getFormation } from '../model/data';
import { APPROACH_RU, BUILDUP_RU, focusRu, playerRu, roleRu } from './labels';

/** Человекочитаемые отличия между двумя расстановками. */
export function diffSetups(a: Setup, b: Setup): string[] {
  const out: string[] = [];
  if (a.squadMode !== b.squadMode) out.push(`База состава: ${a.squadMode === 'fc26' ? 'FC 26' : 'Реальный 2026/27'} → ${b.squadMode === 'fc26' ? 'FC 26' : 'Реальный 2026/27'}`);
  if (a.formationId !== b.formationId) out.push(`Схема: ${getFormation(a.formationId).name} → ${getFormation(b.formationId).name}`);
  if (a.buildUp !== b.buildUp) out.push(`Стиль розыгрыша: ${BUILDUP_RU[a.buildUp]} → ${BUILDUP_RU[b.buildUp]}`);
  if (a.defApproach !== b.defApproach) out.push(`Подход в обороне: ${APPROACH_RU[a.defApproach]} → ${APPROACH_RU[b.defApproach]}`);
  if (a.lineHeight !== b.lineHeight) out.push(`Высота линии: ${a.lineHeight} → ${b.lineHeight}`);
  if (a.matchMode !== b.matchMode) out.push(`Режим: ${a.matchMode === 'authentic' ? 'Authentic' : 'Competitive'} → ${b.matchMode === 'authentic' ? 'Authentic' : 'Competitive'}`);
  const fb = getFormation(b.formationId);
  const posOfA = new Map(Object.entries(a.slots).map(([k, v]) => [v.playerId, { slot: k, ...v }]));
  const inB = new Set(Object.values(b.slots).map((v) => v.playerId));
  for (const sl of fb.slots) {
    const nb = b.slots[sl.id];
    if (!nb?.playerId) continue;
    const pa = posOfA.get(nb.playerId);
    if (!pa) { out.push(`Вышел ${playerRu(nb.playerId)} (${sl.id}: ${roleRu(nb.roleId)} / ${focusRu(nb.roleId, nb.focus)})`); continue; }
    if (a.formationId === b.formationId && pa.slot !== sl.id) out.push(`${playerRu(nb.playerId)}: ${pa.slot} → ${sl.id}`);
    if (pa.roleId !== nb.roleId || pa.focus !== nb.focus) out.push(`${playerRu(nb.playerId)}: ${roleRu(pa.roleId)} / ${focusRu(pa.roleId, pa.focus)} → ${roleRu(nb.roleId)} / ${focusRu(nb.roleId, nb.focus)}`);
  }
  for (const v of Object.values(a.slots)) if (v.playerId && !inB.has(v.playerId)) out.push(`Ушёл из состава: ${playerRu(v.playerId)}`);
  return out;
}
