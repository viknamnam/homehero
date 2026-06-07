import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme/tokens';

// "Bold Home" mark (launcher icon, miniaturized): coral-deep tile, white house, coral heart.
export function Logo({ size = 34 }: { size?: number }) {
  const s = size;
  return (
    <View style={{
      width: s, height: s, borderRadius: s * 0.26, backgroundColor: colors.coralDeep,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      <View style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* roof */}
        <View style={{
          width: 0, height: 0,
          borderLeftWidth: s * 0.36, borderRightWidth: s * 0.36, borderBottomWidth: s * 0.25,
          borderLeftColor: 'transparent', borderRightColor: 'transparent',
          borderBottomColor: '#FFFFFF',
          marginBottom: -1,
        }} />
        {/* body */}
        <View style={{
          width: s * 0.56, height: s * 0.36,
          backgroundColor: '#FFFFFF',
          borderBottomLeftRadius: s * 0.12, borderBottomRightRadius: s * 0.12,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: colors.coralDeep, fontSize: s * 0.26, lineHeight: s * 0.3 }}>♥</Text>
        </View>
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
      HeroNest
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
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.m },
});
