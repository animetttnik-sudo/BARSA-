import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect, Text as SvgText } from 'react-native-svg';

/** Майка: плечи, рукава, вырез. Координаты 0..100. */
const SHIRT = 'M32 26 L16 34 L24 50 L34 42 V90 C34 96 42 100 50 100 C58 100 66 96 66 90 V42 L76 50 L84 34 L68 26 C62 36 38 36 32 26 Z';

const STRIPES: Record<string, [string, string]> = {
  home: ['#004D98', '#A50044'],
  gk: ['#1AAA62', '#0B6E40'],
  gold: ['#F4D56A', '#D4A017'],
  dark: ['#2C354C', '#171D2C'],
  bib: ['#D6FF4A', '#A6D41A'],
};

export type JerseyVariant = 'home' | 'gk' | 'gold' | 'dark' | 'bib';

export function Jersey({
  width = 42,
  variant = 'home',
  number,
  trim = 'rgba(255,255,255,0.75)',
  emphasized = false,
}: {
  width?: number;
  variant?: JerseyVariant;
  number?: string | number | null;
  trim?: string;
  emphasized?: boolean;
}) {
  const clip = `jersey${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const height = Math.round(width * 1.05);
  const [a, b] = STRIPES[variant];
  const ink = variant === 'gold' || variant === 'bib' ? '#1A1300' : '#FFFFFF';
  const ring = emphasized ? (variant === 'gold' || variant === 'bib' ? '#FFFFFF' : '#EDBB00') : trim;
  const showNumber = number != null && number !== '' && width >= 32;
  return (
    <Svg width={width} height={height} viewBox="0 0 100 104">
      <Defs>
        <ClipPath id={clip}>
          <Path d={SHIRT} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clip})`}>
        {Array.from({ length: 8 }, (_, i) => (
          <Rect key={i} x={12 + i * 10} y="20" width="10.4" height="84" fill={i % 2 ? b : a} />
        ))}
      </G>
      <Path d={SHIRT} fill="none" stroke={ring} strokeWidth={emphasized ? 3.6 : 2.2} />
      {showNumber ? (
        <SvgText x="50" y="74" fill={ink} fontSize="26" fontWeight="800" textAnchor="middle">
          {String(number)}
        </SvgText>
      ) : null}
    </Svg>
  );
}
