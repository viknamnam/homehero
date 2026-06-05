import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius, shadow, spacing, type } from '../theme/tokens';

const shadowCardCompat = shadow.card;

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// Pastel circle behind an emoji icon — the mockup's signature card element
export function IconBadge({ icon, tint, size = 40 }: { icon: string; tint: string; size?: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: tint, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
    </View>
  );
}

export function Chip({ label, icon, selected, onPress, tint }: {
  label: string; icon?: string; selected?: boolean; onPress?: () => void; tint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.chip,
        { backgroundColor: selected ? (tint ?? colors.peach) : colors.surface },
        selected && styles.chipSelected,
      ]}
    >
      <Text style={[type.label, { color: colors.charcoal }]}>
        {icon ? `${icon} ` : ''}{label}
      </Text>
    </Pressable>
  );
}

export function PrimaryButton({ label, sub, onPress, disabled }: {
  label: string; sub?: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[styles.primaryBtn, disabled && { opacity: 0.4 }]}
    >
      <Text style={[type.h2, { color: '#FFFFFF' }]}>{label}</Text>
      {sub ? (
        <Text style={[type.caption, { color: '#FFFFFF', opacity: 0.9, marginTop: 2 }]}>{sub}</Text>
      ) : null}
    </Pressable>
  );
}

export function Avatar({ name, colour, size = 40, selected }: {
  name: string; colour: string; size?: number; selected?: boolean;
}) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colour, alignItems: 'center', justifyContent: 'center',
      borderWidth: selected ? 3 : 0, borderColor: colors.charcoal,
    }}>
      <Text style={[type.h2, { color: colors.charcoal }]}>{initial}</Text>
    </View>
  );
}

// Mockup-style stat card: icon badge + label, big number, small caption underneath
export function StatCard({ icon, iconTint, label, value, sub, style }: {
  icon: string; iconTint: string; label: string; value: string; sub?: string; style?: ViewStyle;
}) {
  return (
    <Card style={StyleSheet.flatten([{ paddingVertical: spacing.l }, style])}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconBadge icon={icon} tint={iconTint} size={38} />
        <Text style={[type.label, { marginLeft: spacing.m, flexShrink: 1, color: colors.charcoalSoft }]}>
          {label}
        </Text>
      </View>
      <Text style={[type.display, { marginTop: spacing.s }]}>{value}</Text>
      {sub ? <Text style={[type.caption, { marginTop: 2 }]}>{sub}</Text> : null}
    </Card>
  );
}

// Compact variant — the refined mockup's 4-up row: icon top, tiny label, number.
// Density rules: shrink the CARD, never the tap target or below 13px text.
export function StatCardCompact({ icon, iconTint, label, value, sub, tint }: {
  icon: string; iconTint: string; label: string; value: string; sub?: string; tint?: string;
}) {
  return (
    <View style={[compactStyles.card, tint ? { backgroundColor: tint } : null]}>
      <IconBadge icon={icon} tint={iconTint} size={30} />
      <Text style={[type.caption, { marginTop: spacing.xs, textAlign: 'center' }]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={compactStyles.value}>{value}</Text>
      {sub ? <Text style={[type.caption, { fontSize: 11 }]} numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}

const compactStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    ...shadowCardCompat,
  },
  value: { fontSize: 20, fontFamily: fonts.extrabold, color: colors.charcoal, marginTop: 2 },
});

// Warm affirmation banner ("Small shifts. Big impact.")
export function AffirmationCard({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={styles.affirm}>
      <Text style={{ fontSize: 28, marginRight: spacing.m }}>💛</Text>
      <View style={{ flex: 1 }}>
        <Text style={type.h2}>{title}</Text>
        <Text style={[type.caption, { marginTop: 2 }]}>{sub}</Text>
      </View>
      <Text style={{ fontSize: 14 }}>♥</Text>
    </View>
  );
}

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true,
    }).start();
  }, [visible, opacity]);
  if (!message) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { opacity }]}>
      <Text style={[type.label, { color: '#FFFFFF' }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.l,
    ...shadow.card,
  },
  chip: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s + 2,
    borderRadius: radius.chip,
    marginRight: spacing.s,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.mist,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: { borderColor: colors.charcoal },
  primaryBtn: {
    backgroundColor: colors.coralDeep,       // design doc §1.2: white text passes AA on coral-deep only
    borderRadius: radius.button + 4,
    paddingVertical: spacing.l,
    alignItems: 'center',
    minHeight: 56,
    ...shadow.card,
  },
  affirm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.peachSoft,
    borderRadius: radius.card,
    padding: spacing.l,
  },
  toast: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: colors.charcoal,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderRadius: radius.button,
  },
});
