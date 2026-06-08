import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { copy } from '../copy/strings';
import { useHousehold } from '../store/HouseholdStore';
import { useSync } from '../lib/sync';
import { Chip, PrimaryButton, BusyButton } from '../components/ui';
import { useInsets } from '../lib/insets';
import { Linking } from 'react-native';
import { codeFromUrl } from '../lib/joinLink';
import { Logo, Wordmark } from '../components/brand';
import { colors, spacing, type } from '../theme/tokens';

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP'];

function JoinFlow({ initialCode }: { initialCode?: string | null }) {
  const sync = useSync();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  React.useEffect(() => {
    if (initialCode) setInviteCode(initialCode);
  }, [initialCode]);
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
              <BusyButton
                label={copy.sync.sendCode}
                busyLabel={copy.sync.sendingCode}
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
              <BusyButton
                label={copy.sync.verify}
                busyLabel={copy.sync.verifying}
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

function ChoiceCard({ emoji, title, sub, onPress }: { emoji: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.choice} accessibilityRole="button">
      <Text style={{ fontSize: 30, marginRight: spacing.m }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={type.h2}>{title}</Text>
        <Text style={[type.caption, { marginTop: 2 }]}>{sub}</Text>
      </View>
      <Text style={{ fontSize: 22, color: colors.charcoalSoft }}>›</Text>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const insets = useInsets();
  const { createHousehold } = useHousehold();
  const { cloudEnabled } = useSync();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [deepCode, setDeepCode] = useState<string | null>(null);

  // Deep-linked invite (#65): scanned QR or tapped heronest.app/join/CODE —
  // jump to the join path with the code prefilled. Email sign-in still happens
  // first; the link only removes the typing.
  React.useEffect(() => {
    const apply = (url: string | null) => {
      const code = url ? codeFromUrl(url) : null;
      if (code) { setDeepCode(code); setMode('join'); }
    };
    void Linking.getInitialURL().then(apply);
    const sub = Linking.addEventListener('url', (e) => apply(e.url));
    return () => sub.remove();
  }, []);
  const [householdName, setHouseholdName] = useState('');
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [currency, setCurrency] = useState('AED');

  const canStart = householdName.trim().length > 0 && myName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl }]}>
        {/* Brand hero */}
        <View style={{ alignItems: 'center', marginBottom: spacing.l }}>
          <Logo size={64} />
          <View style={{ height: spacing.m }} />
          <Wordmark size={32} />
          <Text style={[type.body, { color: colors.charcoalSoft, marginTop: spacing.s }]}>
            {copy.onboarding.welcomeSub}
          </Text>
        </View>

        {mode === 'choose' ? (
          <View style={{ marginTop: spacing.l }}>
            <ChoiceCard emoji="🏡" title={copy.onboarding.chooseCreate} sub={copy.onboarding.chooseCreateSub} onPress={() => setMode('create')} />
            {cloudEnabled && (
              <ChoiceCard emoji="💌" title={copy.onboarding.chooseJoin} sub={copy.onboarding.chooseJoinSub} onPress={() => setMode('join')} />
            )}
            <Text style={[type.caption, { marginTop: spacing.l, textAlign: 'center' }]}>{copy.onboarding.chooseSignInNote}</Text>
          </View>
        ) : (
        <View>
          <Pressable onPress={() => setMode('choose')} style={{ marginTop: spacing.m, minHeight: 40, justifyContent: 'center' }} accessibilityRole="button">
            <Text style={[type.label, { color: colors.charcoalSoft }]}>‹ {copy.onboarding.back}</Text>
          </Pressable>
        {mode === 'join' ? (
          <JoinFlow initialCode={deepCode} />
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
        <Text style={[type.caption, { marginTop: spacing.m, textAlign: 'center' }]}>{copy.onboarding.createSignInHint}</Text>
        </View>
        )}
        </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.l, paddingTop: spacing.xxl, paddingBottom: spacing.l },
  section: { marginTop: spacing.l },
  choice: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: colors.mist,
    padding: spacing.l, marginBottom: spacing.m,
  },
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
