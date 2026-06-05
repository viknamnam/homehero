import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { copy } from '../copy/strings';
import { useHousehold } from '../store/HouseholdStore';
import { Chip, PrimaryButton } from '../components/ui';
import { Logo, Wordmark } from '../components/brand';
import { colors, spacing, type } from '../theme/tokens';

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP'];

export default function OnboardingScreen() {
  const { createHousehold } = useHousehold();
  const [householdName, setHouseholdName] = useState('');
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [currency, setCurrency] = useState('AED');

  const canStart = householdName.trim().length > 0 && myName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.warmWhite }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Brand hero */}
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <Logo size={72} />
          <View style={{ height: spacing.m }} />
          <Wordmark size={32} />
          <Text style={[type.body, { color: colors.charcoalSoft, marginTop: spacing.s }]}>
            {copy.onboarding.welcomeSub}
          </Text>
        </View>

        <Text style={[type.h2, styles.section]}>{copy.onboarding.createHousehold}</Text>
        <TextInput
          style={styles.input}
          placeholder={copy.onboarding.householdHint}
          placeholderTextColor={colors.charcoalSoft}
          value={householdName}
          onChangeText={setHouseholdName}
        />

        <Text style={[type.h2, styles.section]}>{copy.onboarding.yourName}</Text>
        <TextInput
          style={styles.input}
          placeholder="Maria"
          placeholderTextColor={colors.charcoalSoft}
          value={myName}
          onChangeText={setMyName}
        />

        <Text style={[type.label, styles.section, { color: colors.charcoalSoft }]}>
          {copy.onboarding.addPartner}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="James"
          placeholderTextColor={colors.charcoalSoft}
          value={partnerName}
          onChangeText={setPartnerName}
        />

        <Text style={[type.h2, styles.section]}>{copy.onboarding.currencyTitle}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.s }}>
          {CURRENCIES.map((c) => (
            <Chip key={c} label={c} selected={currency === c} onPress={() => setCurrency(c)} />
          ))}
        </View>

        <Text style={[type.caption, { marginTop: spacing.l }]}>
          {copy.onboarding.valueIntro}
        </Text>

        <View style={{ marginTop: spacing.xl }}>
          <PrimaryButton
            label={copy.onboarding.startCta}
            disabled={!canStart}
            onPress={() => createHousehold(householdName, currency, [myName, partnerName])}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, paddingTop: spacing.xxl * 2 },
  section: { marginTop: spacing.xl },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.mist,
    padding: spacing.l,
    marginTop: spacing.s,
    fontSize: 16,
    color: colors.charcoal,
  },
});
