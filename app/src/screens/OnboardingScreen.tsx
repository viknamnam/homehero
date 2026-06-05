import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { copy } from '../copy/strings';
import { useHousehold } from '../store/HouseholdStore';
import { useSync } from '../lib/sync';
import { Chip, PrimaryButton } from '../components/ui';
import { Logo, Wordmark } from '../components/brand';
import { colors, spacing, type } from '../theme/tokens';

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP'];

function JoinFlow() {
  const sync = useSync();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [myName, setMyName] = useState('');

  return (
    <View>
      <Text style={[type.caption, { marginTop: spacing.s }]}>{copy.sync.joinIntro}</Text>

      {!sync.session ? (
        !codeSent ? (
          <View>
            <TextInput
              style={styles.input}
              placeholder={copy.sync.emailPrompt}
              placeholderTextColor={colors.charcoalSoft}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <View style={{ marginTop: spacing.l }}>
              <PrimaryButton
                label={copy.sync.sendCode}
                disabled={!email.includes('@')}
                onPress={async () => { if (await sync.sendCode(email)) setCodeSent(true); }}
              />
            </View>
          </View>
        ) : (
          <View>
            <Text style={[type.label, styles.section]}>{copy.sync.codeSent}</Text>
            <TextInput
              style={styles.input}
              placeholder={copy.sync.codePrompt}
              placeholderTextColor={colors.charcoalSoft}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />
            <View style={{ marginTop: spacing.l }}>
              <PrimaryButton
                label={copy.sync.verify}
                disabled={code.trim().length < 6}
                onPress={async () => {
                  if (await sync.verifyCode(email, code)) {
                    // if they already belong to a household this pulls it and
                    // App leaves onboarding automatically; otherwise the invite form shows
                    await sync.pullMyHousehold();
                  }
                }}
              />
            </View>
          </View>
        )
      ) : (
        <View>
          <TextInput
            style={styles.input}
            placeholder={copy.sync.inviteCodePrompt}
            placeholderTextColor={colors.charcoalSoft}
            autoCapitalize="characters"
            value={inviteCode}
            onChangeText={setInviteCode}
          />
          <TextInput
            style={styles.input}
            placeholder={copy.sync.yourNamePrompt}
            placeholderTextColor={colors.charcoalSoft}
            value={myName}
            onChangeText={setMyName}
          />
          <View style={{ marginTop: spacing.l }}>
            <PrimaryButton
              label={sync.busy ? '…' : copy.sync.joinCta}
              disabled={sync.busy || inviteCode.trim().length < 4 || myName.trim().length === 0}
              onPress={() => sync.joinWithInvite(inviteCode, myName)}
            />
          </View>
        </View>
      )}

      {sync.lastError ? (
        <Text style={[type.caption, { color: colors.coralDeep, marginTop: spacing.m }]}>
          {copy.errors.generic} ({sync.lastError})
        </Text>
      ) : null}
    </View>
  );
}

export default function OnboardingScreen() {
  const { createHousehold } = useHousehold();
  const { cloudEnabled } = useSync();
  const [mode, setMode] = useState<'create' | 'join'>('create');
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
        <View style={{ alignItems: 'center', marginBottom: spacing.l }}>
          <Logo size={64} />
          <View style={{ height: spacing.m }} />
          <Wordmark size={32} />
          <Text style={[type.body, { color: colors.charcoalSoft, marginTop: spacing.s }]}>
            {copy.onboarding.welcomeSub}
          </Text>
        </View>

        {cloudEnabled && (
          <View style={{ flexDirection: 'row', marginTop: spacing.l }}>
            <Chip label={copy.sync.createTab} selected={mode === 'create'} onPress={() => setMode('create')} />
            <Chip label={copy.sync.signInTab} selected={mode === 'join'} onPress={() => setMode('join')} />
          </View>
        )}

        {mode === 'join' ? (
          <JoinFlow />
        ) : (
        <View>
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
        </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.l, paddingTop: spacing.xxl, paddingBottom: spacing.l },
  section: { marginTop: spacing.l },
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
