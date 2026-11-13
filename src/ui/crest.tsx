import React from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

const OUTER = 'M40 1.5 L75 13.5 V45.5 C75 69 59 85.5 40 91.5 C21 85.5 5 69 5 45.5 V13.5 Z';
const INNER = 'M40 5.8 L70.5 16.2 V45.6 C70.5 66.2 56.6 80.6 40 86.6 C23.4 80.6 9.5 66.2 9.5 45.6 V16.2 Z';

/** Векторный герб в стиле Blaugrana: золотая кайма, крест, сеньера, полосы и мяч. */
export function BarcaCrest({ size = 40 }: { size?: number }) {
  const raw = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const clip = `crest${raw}`;
  const h = Math.round(size * (92 / 80));
  const senyera = Array.from({ length: 9 }, (_, i) => i);
  return (
    <Svg width={size} height={h} viewBox="0 0 80 92" accessibilityLabel="Эмблема Барселоны">
      <Defs>
        <ClipPath id={clip}>
          <Path d={INNER} />
        </ClipPath>
      </Defs>
      <Path d={OUTER} fill="#E2B423" />
      <G clipPath={`url(#${clip})`}>
        <Rect x="9" y="6" width="31.5" height="28" fill="#F7F4EE" />
        <Rect x="21.6" y="9" width="6.4" height="22" fill="#C8102E" />
        <Rect x="13" y="16.6" width="24" height="6.2" fill="#C8102E" />
        <Rect x="40" y="6" width="31" height="28" fill="#F6C700" />
        {senyera.map((i) => (i % 2 === 1 ? <Rect key={i} x="40" y={6 + i * (28 / 9)} width="31" height={28 / 9 + 0.4} fill="#C8102E" /> : null))}
        <Rect x="9" y="34" width="62" height="9" fill="#004D98" />
        <Rect x="9" y="34" width="62" height="1.3" fill="#E8C547" />
        <Rect x="9" y="41.7" width="62" height="1.3" fill="#E8C547" />
        {Array.from({ length: 6 }, (_, i) => (
          <Rect key={i} x={9.5 + i * (61 / 6)} y="43" width={61 / 6 + 0.4} height="46" fill={i % 2 ? '#A50044' : '#004D98'} />
        ))}
        <Circle cx="40" cy="64" r="8.2" fill="#F6E2A0" stroke="#A6842A" strokeWidth="1.1" />
        <Path d="M40 57.2 L42.6 62.2 L40 63.4 L37.4 62.2 Z" fill="#2A2418" />
        <Path d="M33.4 66.2 Q40 61.6 46.6 66.2" stroke="#2A2418" strokeWidth="0.9" fill="none" />
        <Path d="M34.2 61.2 Q40 67.4 45.8 61.2" stroke="#2A2418" strokeWidth="0.8" fill="none" />
      </G>
      <Path d={INNER} fill="none" stroke="#F0D36A" strokeWidth="1.2" />
    </Svg>
  );
}
