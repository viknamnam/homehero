import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, type } from '../theme/tokens';

export interface DonutSlice { value: number; color: string }

// Donut via the stroke-dasharray trick: radius chosen so circumference = 100,
// making slice percentages map 1:1 to dash lengths. Offset 25 starts at 12 o'clock.
export function DonutChart({ slices, size = 120, strokeWidth = 7, centerTitle, centerSub }: {
  slices: DonutSlice[]; size?: number; strokeWidth?: number;
  centerTitle?: string; centerSub?: string;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const R = 15.915; // 2πR = 100
  let cursor = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 42 42">
        <Circle cx={21} cy={21} r={R} fill="none" stroke={colors.mist} strokeWidth={strokeWidth} />
        {total > 0 && slices.map((s, i) => {
          const pct = (s.value / total) * 100;
          const offset = 25 - cursor;
          cursor += pct;
          return (
            <Circle
              key={i} cx={21} cy={21} r={R} fill="none"
              stroke={s.color} strokeWidth={strokeWidth}
              strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset}
            />
          );
        })}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        {centerTitle ? (
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 16, color: colors.charcoal }}>
            {centerTitle}
          </Text>
        ) : null}
        {centerSub ? <Text style={[type.caption, { fontSize: 11 }]}>{centerSub}</Text> : null}
      </View>
    </View>
  );
}
