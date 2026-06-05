import React, { useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { copy } from '../copy/strings';
import { useHousehold } from '../store/HouseholdStore';
import { useSync } from '../lib/sync';
import { Avatar, Card, Chip, PrimaryButton } from '../components/ui';
import { Header } from '../components/brand';
import { colors, spacing, type } from '../theme/tokens';

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP'];

function SyncCard() {
  const { state } = useHousehold();
  const sync = useSync();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  if (!sync.cloudEnabled) return null;
  const linked = !!state.cloud.householdId;
  const pendingCount = state.cloud.pendingOps.length;

  return (
    <Card style={{ marginTop: spacing.l }}>
      <Text style={type.h2}>{copy.sync.cardTitle}</Text>

      {!sync.session ? (
        <View style={{ marginTop: spacing.m }}>
          <Text style={type.caption}>{copy.sync.introLocal}</Text>
          {!codeSent ? (
            <View>
              <TextInput
                style={styles.syncInput}
                placeholder={copy.sync.emailPrompt}
                placeholderTextColor={colors.charcoalSoft}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <View style={{ marginTop: spacing.m }}>
                <PrimaryButton
                  label={copy.sync.sendCode}
                  disabled={!email.includes('@')}
                  onPress={async () => { if (await sync.sendCode(email)) setCodeSent(true); }}
                />
              </View>
            </View>
          ) : (
            <View>
              <Text style={[type.label, { marginTop: spacing.m }]}>{copy.sync.codeSent}</Text>
              <TextInput
                style={styles.syncInput}
                placeholder={copy.sync.codePrompt}
                placeholderTextColor={colors.charcoalSoft}
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />
              <View style={{ marginTop: spacing.m }}>
                <PrimaryButton
                  label={copy.sync.verify}
                  disabled={code.trim().length < 6}
                  onPress={async () => {
                    if (await sync.verifyCode(email, code)) {
                      setCodeSent(false); setCode('');
                      await sync.pullMyHousehold();
                    }
                  }}
                />
              </View>
            </View>
          )}
        </View>
      ) : !linked ? (
        <View style={{ marginTop: spacing.m }}>
          <Text style={type.caption}>{copy.sync.uploadPrompt}</Text>
          <View style={{ marginTop: spacing.m }}>
            <PrimaryButton
              label={sync.busy ? '…' : copy.sync.uploadCta}
              disabled={sync.busy}
              onPress={() => sync.uploadHousehold()}
            />
          </View>
        </View>
      ) : (
        <View style={{ marginTop: spacing.m }}>
          <Text style={type.caption}>
            {pendingCount > 0 ? copy.sync.pending(pendingCount) : copy.sync.allSynced}
            {state.cloud.lastSyncAt
              ? `  ·  ${copy.sync.lastSync(new Date(state.cloud.lastSyncAt).toLocaleTimeString())}`
              : ''}
          </Text>

          <Text style={[type.label, { marginTop: spacing.l }]}>{copy.sync.inviteTitle}</Text>
          {inviteCode ? (
            <View style={styles.inviteBox}>
              <Text style={[type.display, { letterSpacing: 4 }]}>{inviteCode}</Text>
              <Text style={[type.caption, { marginTop: spacing.s, textAlign: 'center' }]}>
                {copy.sync.inviteShare(inviteCode)}
              </Text>
            </View>
          ) : (
            <Pressable
              style={{ marginTop: spacing.s }}
              onPress={async () => setInviteCode(await sync.createInvite())}
            >
              <Text style={[type.label, { color: colors.coralDeep }]}>{copy.sync.inviteCta}</Text>
            </Pressable>
          )}

          <View style={{ flexDirection: 'row', marginTop: spacing.l }}>
            <Pressable onPress={() => sync.syncNow()} disabled={sync.busy} style={{ marginRight: spacing.xl }}>
              <Text style={[type.label, { color: colors.sageDeep }]}>
                {sync.busy ? '…' : copy.sync.syncNow}
              </Text>
            </Pressable>
            <Pressable onPress={() => sync.signOut()}>
              <Text style={[type.label, { color: colors.charcoalSoft }]}>{copy.sync.signOut}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {sync.lastError ? (
        <Text style={[type.caption, { color: colors.coralDeep, marginTop: spacing.m }]}>
          {copy.errors.generic} ({sync.lastError})
        </Text>
      ) : null}
    </Card>
  );
}

export default function SettingsScreen() {
  const { state, setHideMoney, setCurrency, setRate, reset } = useHousehold();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const logTimes = state.logDurationsMs;
  const median = logTimes.length
    ? [...logTimes].sort((a, b) => a - b)[Math.floor(logTimes.length / 2)]
    : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.warmWhite }} contentContainerStyle={styles.container}>
      <Header />
      <Text style={type.serifTitle}>{state.householdName}</Text>

      <SyncCard />

      <Card style={{ marginTop: spacing.l }}>
        <Text style={type.h2}>{copy.settings.membersTitle}</Text>
        <View style={{ flexDirection: 'row', marginTop: spacing.m }}>
          {state.members.map((m) => (
            <View key={m.id} style={{ alignItems: 'center', marginRight: spacing.l }}>
              <Avatar name={m.name} colour={m.colour} size={48} />
              <Text style={[type.caption, { marginTop: spacing.xs }]}>{m.name}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.l }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.m }}>
            <Text style={type.h2}>{copy.settings.hideMoneyLabel}</Text>
            <Text style={[type.caption, { marginTop: spacing.xs }]}>{copy.settings.hideMoneySub}</Text>
          </View>
          <Switch
            value={state.hideMoney}
            onValueChange={setHideMoney}
            trackColor={{ true: colors.sage, false: colors.mist }}
          />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.l }}>
        <Text style={type.h2}>{copy.settings.currencyTitle}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.m }}>
          {CURRENCIES.map((c) => (
            <Chip key={c} label={c} selected={state.currency === c} onPress={() => setCurrency(c)} />
          ))}
        </View>
      </Card>

      {!state.hideMoney && (
        <Card style={{ marginTop: spacing.l }}>
          <Text style={type.h2}>{copy.settings.ratesTitle}</Text>
          <Text style={[type.caption, { marginBottom: spacing.m }]}>{copy.settings.ratesSub}</Text>
          {CATEGORIES.map((c) => (
            <View key={c.key} style={styles.rateRow}>
              <Text style={[type.label, { flex: 1 }]}>{c.icon} {c.name}</Text>
              <TextInput
                style={styles.rateInput}
                keyboardType="numeric"
                value={String(state.rates[c.key] ?? '')}
                onChangeText={(v) => {
                  const n = parseFloat(v);
                  if (!isNaN(n) && n >= 0) setRate(c.key, n);
                }}
              />
              <Text style={type.caption}>/h</Text>
            </View>
          ))}
        </Card>
      )}

      <Card style={{ marginTop: spacing.l }}>
        <Text style={type.h2}>{copy.settings.metricsTitle}</Text>
        <Text style={[type.caption, { marginTop: spacing.xs }]}>
          {median !== null
            ? `Median time to log (last ${logTimes.length}): ${(median / 1000).toFixed(1)}s — target <10s`
            : 'Log a task to start measuring.'}
        </Text>
      </Card>

      <Pressable
        style={{ marginTop: spacing.xl, alignItems: 'center' }}
        onPress={() => {
          if (confirmingReset) { reset(); setConfirmingReset(false); }
          else setConfirmingReset(true);
        }}
      >
        <Text style={[type.label, { color: colors.coralDeep }]}>
          {confirmingReset ? copy.settings.resetConfirm : copy.settings.resetCta}
        </Text>
      </Pressable>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, paddingTop: spacing.xxl },
  syncInput: {
    backgroundColor: colors.warmWhite, borderRadius: 12, borderWidth: 1,
    borderColor: colors.mist, padding: spacing.m, marginTop: spacing.m,
    fontSize: 16, color: colors.charcoal,
  },
  inviteBox: {
    backgroundColor: colors.sageTint, borderRadius: 12,
    padding: spacing.l, marginTop: spacing.s, alignItems: 'center',
  },
  rateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s },
  rateInput: {
    backgroundColor: colors.warmWhite, borderRadius: 8, borderWidth: 1,
    borderColor: colors.mist, paddingHorizontal: spacing.m, paddingVertical: spacing.xs,
    width: 70, textAlign: 'right', marginRight: spacing.xs,
    fontSize: 16, color: colors.charcoal,
  },
});
