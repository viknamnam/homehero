import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
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


// LogoLoader — the HeroNest mark assembling itself, piece by piece, on loop.
// Used wherever the app is talking to the cloud (founder feedback: button
// taps gave no feedback, so people tapped again and got duplicate code emails).
// Stages: 1 tile -> 2 roof -> 3 walls -> 4 heart, then a beat, then again.
export function LogoLoader({ size = 28, label }: { size?: number; label?: string }) {
  const stage = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(stage, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(stage, { toValue: 2, duration: 260, useNativeDriver: true }),
        Animated.timing(stage, { toValue: 3, duration: 260, useNativeDriver: true }),
        Animated.delay(420),
        Animated.timing(stage, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [stage]);

  const at = (n: number) => stage.interpolate({
    inputRange: [Math.max(0, n - 1), n], outputRange: [0, 1], extrapolate: 'clamp',
  });
  const s = size;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        width: s, height: s, borderRadius: s * 0.26, backgroundColor: colors.coralDeep,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <View style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
          <Animated.View style={{
            opacity: at(1),
            width: 0, height: 0,
            borderLeftWidth: s * 0.36, borderRightWidth: s * 0.36, borderBottomWidth: s * 0.25,
            borderLeftColor: 'transparent', borderRightColor: 'transparent',
            borderBottomColor: '#FFFFFF',
            marginBottom: -1,
          }} />
          <Animated.View style={{
            opacity: at(2),
            width: s * 0.56, height: s * 0.36,
            backgroundColor: '#FFFFFF',
            borderBottomLeftRadius: s * 0.12, borderBottomRightRadius: s * 0.12,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Animated.Text style={{ opacity: at(3), color: colors.coralDeep, fontSize: s * 0.26, lineHeight: s * 0.3 }}>
              ♥
            </Animated.Text>
          </Animated.View>
        </View>
      </View>
      {label ? <Text style={[{ marginLeft: spacing.s }, typeLabel]}>{label}</Text> : null}
    </View>
  );
}

const typeLabel = { fontSize: 14, fontFamily: fonts.semibold, color: colors.charcoalSoft } as const;
