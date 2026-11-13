import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { C } from './theme';

export type IconProps = {
  size?: number;
  color?: string;
  focused?: boolean;
  active?: boolean;
  strokeWidth?: number;
};

function stroke(p: IconProps, base = 1.8) {
  if (p.strokeWidth != null) return p.strokeWidth;
  return p.focused || p.active ? 2 : base;
}

function Frame({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

/** Тактическая доска: поле, дуги, X/O и стрелки перемещений. */
export function TacticsBoardIcon({ size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <Rect x="2.6" y="2.6" width="18.8" height="18.8" rx="2.2" stroke="#F4F7FF" strokeWidth="1.5" />
      <Path d="M2.6 7.4 A4.6 4.6 0 0 0 7.4 2.6" stroke="#F4F7FF" strokeWidth="1.25" />
      <Path d="M16.6 2.6 A4.6 4.6 0 0 0 21.4 7.4" stroke="#F4F7FF" strokeWidth="1.25" />
      <Path d="M2.6 16.6 A4.6 4.6 0 0 1 7.4 21.4" stroke="#F4F7FF" strokeWidth="1.25" />
      <Path d="M21.4 16.6 A4.6 4.6 0 0 1 16.6 21.4" stroke="#F4F7FF" strokeWidth="1.25" />
      <Circle cx="12" cy="12" r="2.15" stroke="#F4F7FF" strokeWidth="1.3" />
      <Circle cx="7.1" cy="8.1" r="1.2" fill="#7EB6FF" />
      <Circle cx="16.5" cy="15.7" r="1.2" fill="#7EB6FF" />
      <Path d="M8.3 8.5 C11.2 6.4 14.2 7.3 15.5 9.1" stroke="#F4F7FF" strokeWidth="1.25" strokeLinecap="round" />
      <Path d="M14.6 8.15 L15.65 9.15 L14.45 9.55" stroke="#F4F7FF" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.6 15.7 C12.2 17.6 15.1 16.7 16.3 14.9" stroke="#F4F7FF" strokeWidth="1.25" strokeLinecap="round" />
      <Path d="M6.3 14.7 L8.1 16.5 M8.1 14.7 L6.3 16.5" stroke="#E4456A" strokeWidth="1.45" strokeLinecap="round" />
      <Path d="M15.4 6.2 L17.2 8 M17.2 6.2 L15.4 8" stroke="#E4456A" strokeWidth="1.45" strokeLinecap="round" />
    </Frame>
  );
}

/** Три стопки ромбов: гранат, синий, голубой. */
export function LayersIcon({ size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M12 2.4 L19.2 6.4 L12 10.4 L4.8 6.4 Z" fill="#A50044" />
      <Path d="M12 7.6 L19.2 11.6 L12 15.6 L4.8 11.6 Z" fill="#004D98" />
      <Path d="M12 12.8 L19.2 16.8 L12 20.8 L4.8 16.8 Z" fill="#7EB6FF" />
    </Frame>
  );
}

/** Столбики: синий, голубой, гранат. */
export function BarsIcon({ size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <Rect x="3" y="13.2" width="4.4" height="7.4" rx="1.1" fill="#2F7BD8" />
      <Rect x="9.8" y="8.2" width="4.4" height="12.4" rx="1.1" fill="#7EB6FF" />
      <Rect x="16.6" y="3.4" width="4.4" height="17.2" rx="1.1" fill="#A50044" />
    </Frame>
  );
}

export function PitchIcon({ size = 24, color = '#F4F7FF', ...rest }: IconProps) {
  const s = stroke(rest);
  return (
    <Frame size={size}>
      <Rect x="3.2" y="3.2" width="17.6" height="17.6" rx="2" stroke={color} strokeWidth={s} />
      <Line x1="3.2" y1="12" x2="20.8" y2="12" stroke={color} strokeWidth={s} />
      <Circle cx="12" cy="12" r="2.3" stroke={color} strokeWidth={s} />
      <Rect x="7.4" y="3.2" width="9.2" height="3.5" stroke={color} strokeWidth={s} />
      <Rect x="7.4" y="17.3" width="9.2" height="3.5" stroke={color} strokeWidth={s} />
    </Frame>
  );
}

export function TargetIcon({ size = 24, color = '#F4F7FF' }: IconProps) {
  return (
    <Frame size={size}>
      <Circle cx="12" cy="12" r="7.2" stroke={color} strokeWidth="1.7" />
      <Circle cx="12" cy="12" r="3.1" stroke={color} strokeWidth="1.7" />
      <Circle cx="12" cy="12" r="1.15" fill="#E4456A" />
      <Path d="M12 2.2 V5.1 M12 18.9 V21.8 M2.2 12 H5.1 M18.9 12 H21.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </Frame>
  );
}

export function ShieldCheckIcon({ size = 24, color = '#F4F7FF' }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M12 2.8 L19.6 6 V12.2 C19.6 16.5 16.3 19.7 12 21.2 C7.7 19.7 4.4 16.5 4.4 12.2 V6 Z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <Path d="M8.3 12.1 L11 14.7 L15.8 9.4" stroke="#36C98E" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function SwapArrowsIcon({ size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M4 8.2 H15.2" stroke="#7EB6FF" strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M12.2 4.8 L16.4 8.2 L12.2 11.6" stroke="#7EB6FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 15.8 H8.8" stroke="#F4F7FF" strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M11.8 12.4 L7.6 15.8 L11.8 19.2" stroke="#F4F7FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function FlagIcon({ size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M6.5 21.2 V3.4" stroke="#7EB6FF" strokeWidth="1.9" strokeLinecap="round" />
      <Path d="M6.5 4.2 H18.4 L15.2 8.6 L18.4 13 H6.5 Z" fill="#E4456A" />
    </Frame>
  );
}

export function ArrowUpIcon({ size = 24, color = '#2F7BD8' }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M12 19.5 V6.2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M6.4 11.2 L12 5.2 L17.6 11.2" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function ArrowUpRightIcon({ size = 24, color = '#2F7BD8' }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M7 17 L17 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M9.2 7 H17 V14.8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function ArrowLeftIcon({ size = 24, color = '#2F7BD8' }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M19 12 H6.2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M11 6.6 L5.2 12 L11 17.4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function ArrowCurveIcon({ size = 24, color = '#E4456A' }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M16.5 6.2 C10 6.2 6.2 10 6.2 15.2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M6.2 11.4 V15.6 H10.4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function GearIcon({ size = 24, color = '#F4F7FF' }: IconProps) {
  return (
    <Frame size={size}>
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.7" />
      <Path
        d="M12 3.2 L13.1 5.4 L15.5 5.1 L15.2 7.5 L17.4 8.6 L16.2 10.6 L17.6 12.4 L15.6 13.6 L15.4 16 L13.1 16.4 L12 18.8 L10.9 16.4 L8.6 16 L8.4 13.6 L6.4 12.4 L7.8 10.6 L6.6 8.6 L8.8 7.5 L8.5 5.1 L10.9 5.4 Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </Frame>
  );
}

export function ClipboardIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest);
  return (
    <Frame size={size}>
      <Path d="M8 5.4 H7.2 C6.2 5.4 5.5 6.1 5.5 7.1 V19.2 C5.5 20.2 6.2 20.9 7.2 20.9 H16.8 C17.8 20.9 18.5 20.2 18.5 19.2 V7.1 C18.5 6.1 17.8 5.4 16.8 5.4 H16" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Rect x="8.2" y="3.1" width="7.6" height="3.6" rx="1.2" stroke={color} strokeWidth={s} />
      <Line x1="8.6" y1="11" x2="15.4" y2="11" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Line x1="8.6" y1="14.2" x2="15.4" y2="14.2" stroke={color} strokeWidth={s} strokeLinecap="round" />
    </Frame>
  );
}

export function BoltIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.7);
  const on = rest.focused || rest.active;
  return (
    <Frame size={size}>
      <Path d="M13.6 3.2 L6.3 13.15 H11.55 L10.25 20.8 L17.7 10.7 H12.35 Z" stroke={color} strokeWidth={s} strokeLinejoin="round" fill={on ? color : 'none'} fillOpacity={on ? 0.9 : 0} />
    </Frame>
  );
}

export function ShieldIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest);
  const on = rest.focused || rest.active;
  return (
    <Frame size={size}>
      <Path d="M12 3.2 L19.4 6.2 V12.1 C19.4 16.4 16.2 19.8 12 20.9 C7.8 19.8 4.6 16.4 4.6 12.1 V6.2 Z" stroke={color} strokeWidth={s} strokeLinejoin="round" fill={on ? color : 'none'} fillOpacity={on ? 0.9 : 0} />
    </Frame>
  );
}

export function ChartIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest);
  return (
    <Frame size={size}>
      <Path d="M4 18.5 V5.5 M4 18.5 H20" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Polyline points="6.2,14.6 10,10.2 13.1,12.8 19.2,6.4" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function RepeatIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest);
  return (
    <Frame size={size}>
      <Path d="M7.2 7.2 C8.5 5.7 10.2 4.9 12 4.9 C16 4.9 19.1 8 19.1 12" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Path d="M16.3 9.2 L19.1 12 L21.6 9.5" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.8 16.8 C15.5 18.3 13.8 19.1 12 19.1 C8 19.1 4.9 16 4.9 12" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Path d="M7.7 14.8 L4.9 12 L2.4 14.5" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function DiagnoseIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.8);
  return (
    <Frame size={size}>
      <Path d="M3.2 12.2 H7.1 L8.9 6.6 L12.1 17.5 L14.4 9.8 L15.8 12.2 H20.8" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function InfoIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.7);
  return (
    <Frame size={size}>
      <Circle cx="12" cy="12" r="8.2" stroke={color} strokeWidth={s} />
      <Line x1="12" y1="11" x2="12" y2="16.4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Circle cx="12" cy="8.1" r="1.05" fill={color} />
    </Frame>
  );
}

export function UndoIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.8);
  return (
    <Frame size={size}>
      <Path d="M5 8.5 H13.2 A5.5 5.5 0 1 1 8.4 16.8" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Path d="M5 8.5 L8.3 5.2 M5 8.5 L8.3 11.8" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function CloseIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.9);
  return (
    <Frame size={size}>
      <Line x1="6.2" y1="6.2" x2="17.8" y2="17.8" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Line x1="17.8" y1="6.2" x2="6.2" y2="17.8" stroke={color} strokeWidth={s} strokeLinecap="round" />
    </Frame>
  );
}

export function ChevronIcon({
  size = 24,
  color = C.text,
  direction = 'right',
  ...rest
}: IconProps & { direction?: 'left' | 'right' | 'up' | 'down' }) {
  const s = stroke(rest, 1.9);
  const points = direction === 'left' ? '15 6 9 12 15 18' : direction === 'up' ? '6 15 12 9 18 15' : direction === 'down' ? '6 9 12 15 18 9' : '9 6 15 12 9 18';
  return (
    <Frame size={size}>
      <Polyline points={points} stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function BallIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.7);
  return (
    <Frame size={size}>
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={s} />
      <Path d="M12 4 C10.3 7.2 10.3 16.8 12 20" stroke={color} strokeWidth={s} />
      <Path d="M5.2 8.2 C8.8 9.4 15.2 9.4 18.8 8.2" stroke={color} strokeWidth={s} />
      <Path d="M5.2 15.8 C8.8 14.6 15.2 14.6 18.8 15.8" stroke={color} strokeWidth={s} />
    </Frame>
  );
}

export function SparkIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.7);
  const on = rest.focused || rest.active;
  return (
    <Frame size={size}>
      <Path d="M12 3 L13.4 9.2 L19.6 8.4 L14.6 12 L19.6 15.6 L13.4 14.8 L12 21 L10.6 14.8 L4.4 15.6 L9.4 12 L4.4 8.4 L10.6 9.2 Z" stroke={color} strokeWidth={s} strokeLinejoin="round" fill={on ? color : 'none'} fillOpacity={on ? 0.9 : 0} />
    </Frame>
  );
}

export const TAB_ICONS = {
  pitch: TacticsBoardIcon,
  summary: LayersIcon,
  cplus: ArrowUpRightIcon,
  cminus: ShieldCheckIcon,
  rating: BarsIcon,
  subs: SwapArrowsIcon,
} as const;
