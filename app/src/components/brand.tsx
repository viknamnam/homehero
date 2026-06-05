import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme/tokens';

// House-with-heart mark, drawn with Views — no image asset, scales with `size`.
export function Logo({ size = 34 }: { size?: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* roof */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: s * 0.52, borderRightWidth: s * 0.52, borderBottomWidth: s * 0.36,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: colors.sky,
        marginBottom: -1,
      }} />
      {/* body */}
      <View style={{
        width: s * 0.74, height: s * 0.56,
        backgroundColor: colors.surface,
        borderWidth: Math.max(2, s * 0.07), borderTopWidth: 0, borderColor: colors.sky,
        borderBottomLeftRadius: s * 0.16, borderBottomRightRadius: s * 0.16,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: colors.coral, fontSize: s * 0.34, lineHeight: s * 0.42 }}>♥</Text>
      </View>
    </View>
  );
}

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <Text style={{
      fontFamily: fonts.serif, fontWeight: '700',
      fontSize: size, color: colors.charcoal, letterSpacing: 0.2,
    }}>
      HomeHero
    </Text>
  );
}

// Top header row used on Today / Week / Settings
export function Header() {
  return (
    <View style={styles.header}>
      <Logo size={30} />
      <View style={{ width: spacing.s }} />
      <Wordmark />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.l },
});
