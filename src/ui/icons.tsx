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

function stroke(p: IconProps, base = 1.7) {
  if (p.strokeWidth != null) return p.strokeWidth;
  return p.focused || p.active ? 1.85 : base;
}

function Frame({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

/** Поле / тактика — схема футбольного поля. */
export function PitchIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest);
  const on = rest.focused || rest.active;
  return (
    <Frame size={size}>
      <Rect x="3.5" y="4.25" width="17" height="15.5" rx="2" stroke={color} strokeWidth={s} fill={on ? color : 'none'} fillOpacity={on ? 0.12 : 0} />
      <Line x1="12" y1="4.25" x2="12" y2="19.75" stroke={color} strokeWidth={s} />
      <Circle cx="12" cy="12" r="2.35" stroke={color} strokeWidth={s} />
      <Rect x="7.75" y="4.25" width="8.5" height="3.1" stroke={color} strokeWidth={s} />
      <Rect x="7.75" y="16.65" width="8.5" height="3.1" stroke={color} strokeWidth={s} />
    </Frame>
  );
}

/** Сводка — планшет / список. */
export function ClipboardIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest);
  const on = rest.focused || rest.active;
  return (
    <Frame size={size}>
      <Path
        d="M8 5.25 H7.2 C6.2 5.25 5.4 6.05 5.4 7.05 V19.2 C5.4 20.2 6.2 21 7.2 21 H16.8 C17.8 21 18.6 20.2 18.6 19.2 V7.05 C18.6 6.05 17.8 5.25 16.8 5.25 H16"
        stroke={color}
        strokeWidth={s}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={on ? color : 'none'}
        fillOpacity={on ? 0.12 : 0}
      />
      <Rect x="8.2" y="3" width="7.6" height="3.6" rx="1.3" stroke={color} strokeWidth={s} fill={on ? color : 'none'} fillOpacity={on ? 0.22 : 0} />
      <Line x1="8.7" y1="10.4" x2="15.3" y2="10.4" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Line x1="8.7" y1="13.6" x2="15.3" y2="13.6" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Line x1="8.7" y1="16.8" x2="13.2" y2="16.8" stroke={color} strokeWidth={s} strokeLinecap="round" />
    </Frame>
  );
}

/** Контра + / атака — молния. */
export function BoltIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.65);
  const on = rest.focused || rest.active;
  return (
    <Frame size={size}>
      <Path
        d="M13.6 3.2 L6.3 13.15 H11.55 L10.25 20.8 L17.7 10.7 H12.35 Z"
        stroke={color}
        strokeWidth={s}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={on ? color : 'none'}
        fillOpacity={on ? 0.92 : 0}
      />
    </Frame>
  );
}

/** Контра − / оборона — щит. */
export function ShieldIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest);
  const on = rest.focused || rest.active;
  return (
    <Frame size={size}>
      <Path
        d="M12 3.4 L19.4 6.35 V12.15 C19.4 16.45 16.25 19.85 12 20.85 C7.75 19.85 4.6 16.45 4.6 12.15 V6.35 Z"
        stroke={color}
        strokeWidth={s}
        strokeLinejoin="round"
        fill={on ? color : 'none'}
        fillOpacity={on ? 0.92 : 0}
      />
    </Frame>
  );
}

/** Рейтинг — тренд / график. */
export function ChartIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest);
  const on = rest.focused || rest.active;
  return (
    <Frame size={size}>
      <Path d="M4 18.5 V6.5" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Path d="M4 18.5 H20" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Polyline
        points="6.5,14.5 10.2,10.2 13.1,12.8 19.2,6.6"
        stroke={color}
        strokeWidth={s}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M15.7 6.6 H19.2 V10.1" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
      {on ? <Circle cx="19.2" cy="6.6" r="1.05" fill={color} /> : null}
    </Frame>
  );
}

/** Замены / цикл. */
export function RepeatIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest);
  return (
    <Frame size={size}>
      <Path
        d="M7.2 7.15 C8.45 5.7 10.15 4.85 12 4.85 C16.05 4.85 19.15 7.95 19.15 12"
        stroke={color}
        strokeWidth={s}
        strokeLinecap="round"
      />
      <Path d="M16.35 9.35 L19.15 12 L21.7 9.55" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M16.8 16.85 C15.55 18.3 13.85 19.15 12 19.15 C7.95 19.15 4.85 16.05 4.85 12"
        stroke={color}
        strokeWidth={s}
        strokeLinecap="round"
      />
      <Path d="M7.65 14.65 L4.85 12 L2.3 14.45" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

/** Диагностика («Почему не работает?») — пульс / ECG. */
export function DiagnoseIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.75);
  return (
    <Frame size={size}>
      <Path
        d="M3.2 12.2 H7.05 L8.85 6.7 L12.05 17.4 L14.35 9.9 L15.7 12.2 H20.8"
        stroke={color}
        strokeWidth={s}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Frame>
  );
}

/** Дисклеймер — info. */
export function InfoIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.7);
  return (
    <Frame size={size}>
      <Circle cx="12" cy="12" r="8.2" stroke={color} strokeWidth={s} />
      <Line x1="12" y1="11.05" x2="12" y2="16.35" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Circle cx="12" cy="8.15" r="1.05" fill={color} />
    </Frame>
  );
}

export function UndoIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.7);
  return (
    <Frame size={size}>
      <Path d="M5 8.4 H13.1 A5.4 5.4 0 1 1 8.55 16.6" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Path d="M5 8.4 L8.15 5.25 M5 8.4 L8.15 11.55" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

export function CloseIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.75);
  return (
    <Frame size={size}>
      <Line x1="6.4" y1="6.4" x2="17.6" y2="17.6" stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Line x1="17.6" y1="6.4" x2="6.4" y2="17.6" stroke={color} strokeWidth={s} strokeLinecap="round" />
    </Frame>
  );
}

export function ChevronIcon({
  size = 24,
  color = C.text,
  direction = 'right',
  ...rest
}: IconProps & { direction?: 'left' | 'right' | 'up' | 'down' }) {
  const s = stroke(rest, 1.75);
  const points =
    direction === 'left' ? '15 6 9 12 15 18'
      : direction === 'up' ? '6 15 12 9 18 15'
        : direction === 'down' ? '6 9 12 15 18 9'
          : '9 6 15 12 9 18';
  return (
    <Frame size={size}>
      <Polyline points={points} stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Frame>
  );
}

/** Мяч — атака в списках и категориях. */
export function BallIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.65);
  return (
    <Frame size={size}>
      <Circle cx="12" cy="12" r="8.15" stroke={color} strokeWidth={s} />
      <Path d="M12 3.85 C10.2 7.1 10.2 16.9 12 20.15" stroke={color} strokeWidth={s} />
      <Path d="M5.05 8.15 C8.8 9.3 15.2 9.3 18.95 8.15" stroke={color} strokeWidth={s} />
      <Path d="M5.05 15.85 C8.8 14.7 15.2 14.7 18.95 15.85" stroke={color} strokeWidth={s} />
    </Frame>
  );
}

/** «Всё сразу» — вспышка / баланс. */
export function SparkIcon({ size = 24, color = C.text, ...rest }: IconProps) {
  const s = stroke(rest, 1.7);
  const on = rest.focused || rest.active;
  return (
    <Frame size={size}>
      <Path
        d="M12 3.2 L13.35 9.15 L19.5 8.4 L14.55 12 L19.5 15.6 L13.35 14.85 L12 20.8 L10.65 14.85 L4.5 15.6 L9.45 12 L4.5 8.4 L10.65 9.15 Z"
        stroke={color}
        strokeWidth={s}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={on ? color : 'none'}
        fillOpacity={on ? 0.92 : 0}
      />
    </Frame>
  );
}

export const TAB_ICONS = {
  pitch: PitchIcon,
  summary: ClipboardIcon,
  cplus: BoltIcon,
  cminus: ShieldIcon,
  rating: ChartIcon,
  subs: RepeatIcon,
} as const;
