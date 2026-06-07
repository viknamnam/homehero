import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { HERO_STYLES } from '../lib/heroVoice';
import { copy } from '../copy/strings';
import { useHousehold } from '../store/HouseholdStore';
import { useSync } from '../lib/sync';
import { usePhotoPicker } from '../lib/usePhotoPicker';
import { FLAGS } from '../constants/flags';
import { HeroAvatarPicker } from '../components/HeroAvatars';
import * as Clipboard from 'expo-clipboard';
import { Avatar, Card, Chip, PrimaryButton } from '../components/ui';
import { Icon } from '../components/icons';
import { Header, LogoLoader } from '../components/brand';
import { colors, spacing, type } from '../theme/tokens';

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP'];

function SyncCard() {
  const { state } = useHousehold();
  const sync = useSync();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  if (!sync.cloudEnabled) return null;
  const linked = !!state.cloud.householdId;
  const pendingCount = state.cloud.pendingOps.length;

  return (
    <Card style={{ marginTop: spacing.m }}>
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
                {sending ? (
                  <View style={{ alignItems: 'center', minHeight: 48, justifyContent: 'center' }}>
                    <LogoLoader label={copy.sync.sendingCode} />
                  </View>
                ) : (
                  <PrimaryButton
                    label={copy.sync.sendCode}
                    disabled={!email.includes('@')}
                    onPress={async () => {
                      setSending(true);
                      const ok = await sync.sendCode(email);
                      setSending(false);
                      if (ok) setCodeSent(true);
                    }}
                  />
                )}
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
                {verifying ? (
                  <View style={{ alignItems: 'center', minHeight: 48, justifyContent: 'center' }}>
                    <LogoLoader label={copy.sync.verifying} />
                  </View>
                ) : (
                  <PrimaryButton
                    label={copy.sync.verify}
                    disabled={code.trim().length < 6}
                    onPress={async () => {
                      setVerifying(true);
                      const ok = await sync.verifyCode(email, code);
                      if (ok) {
                        setCodeSent(false); setCode('');
                        await sync.pullMyHousehold();
                      }
                      setVerifying(false);
                    }}
                  />
                )}
              </View>
            </View>
          )}
        </View>
      ) : !linked ? (
        <View style={{ marginTop: spacing.m }}>
          <Text style={type.caption}>{copy.sync.uploadPrompt}</Text>
          <View style={{ marginTop: spacing.m }}>
            {sync.busy ? (
              <View style={{ alignItems: 'center', minHeight: 48, justifyContent: 'center' }}>
                <LogoLoader label={copy.sync.working} />
              </View>
            ) : (
              <PrimaryButton label={copy.sync.uploadCta} onPress={() => sync.uploadHousehold()} />
            )}
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
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync(inviteCode);
                  setInviteCopied(true);
                }}
                style={{ marginTop: spacing.s }}
                accessibilityRole="button"
              >
                <Text style={[type.label, { color: colors.coralDeep, textAlign: 'center' }]}>
                  {inviteCopied ? copy.sync.inviteCopied : copy.sync.inviteCopy}
                </Text>
              </Pressable>
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

export default function SettingsScreen({ onOpenKidMode }: { onOpenKidMode?: (childId: string) => void } = {}) {
  const { state, setHideMoney, setCurrency, setRate, reset, resetLogMetric, setHeroStyle } = useHousehold();
  const [confirmingReset, setConfirmingReset] = useState(false);
  // Photo avatars: shared flow (camera or library) — see lib/usePhotoPicker
  const { canEditPhoto, changeMyPhoto, avatarPickerVisible, closeAvatarPicker, pickHeroAvatar } = usePhotoPicker();
  const sync = useSync();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Kids Mode: add-child form + child-avatar picker target (avatars ONLY for kids — no camera)
  const [addingChild, setAddingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childError, setChildError] = useState(false);
  const [childAvatarFor, setChildAvatarFor] = useState<string | null>(null);

  const saveChild = async () => {
    setChildError(false);
    const ok = await sync.addChildMember(childName);
    if (!ok) { setChildError(true); return; }
    setChildName(''); setAddingChild(false);
  };

  // Trust layer (build plan §13): your data is yours — take it or remove it.
  const exportData = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      household: state.householdName,
      currency: state.currency,
      members: state.members.map((m) => ({ name: m.name, colour: m.colour })),
      rates: state.rates,
      tasks: state.tasks,
      thanks: state.thanks,
    };
    const json = JSON.stringify(payload, null, 2);
    try {
      await Share.share({ message: json, title: 'HeroNest export' });
    } catch {
      await Clipboard.setStringAsync(json);
      Alert.alert(copy.settings.exportCopiedTitle, copy.settings.exportCopiedBody);
    }
  };

  const confirmDelete = async () => {
    if (!confirmingDelete) { setConfirmingDelete(true); return; }
    setConfirmingDelete(false);
    await sync.deleteHousehold();
  };

  const logTimes = state.logDurationsMs;
  const median = logTimes.length
    ? [...logTimes].sort((a, b) => a - b)[Math.floor(logTimes.length / 2)]
    : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'transparent' }} contentContainerStyle={styles.container}>
      <Header />
      <Text style={[type.serifTitle, { fontSize: 26 }]}>{state.householdName}</Text>

      <SyncCard />

      <Card style={{ marginTop: spacing.m }}>
        <Text style={type.h2}>{copy.settings.membersTitle}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.m }}>
          {state.members.map((m) => {
            const mine = m.id === state.meId;
            const isChild = m.role === 'child';
            return (
              <View key={m.id} style={{ alignItems: 'center', marginRight: spacing.l, marginBottom: spacing.m }}>
                <Pressable
                  disabled={!(mine && canEditPhoto) && !isChild}
                  // Children: hero-avatar picker ONLY — never the camera/photo sheet
                  onPress={isChild ? () => setChildAvatarFor(m.id) : changeMyPhoto}
                  style={{ alignItems: 'center' }}
                  accessibilityLabel={isChild ? copy.photo.heroTitle : mine && canEditPhoto ? copy.settings.editPhoto : m.name}
                >
                  <Avatar name={m.name} colour={m.colour} size={48} avatarUrl={m.avatarUrl} />
                  <Text style={[type.caption, { marginTop: spacing.xs }]}>
                    {m.name}{isChild ? ` · ${copy.settings.kidBadge}` : ''}
                  </Text>
                  {mine && canEditPhoto && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                      <Icon name="camera" size={11} color={colors.charcoalSoft} />
                      <Text style={[type.caption, { fontSize: 11, marginLeft: 3 }]}>{copy.settings.editPhoto}</Text>
                    </View>
                  )}
                </Pressable>
                {isChild && onOpenKidMode && (
                  <Pressable onPress={() => onOpenKidMode(m.id)} hitSlop={8} style={{ marginTop: 2, minHeight: 28, justifyContent: 'center' }}>
                    <Text style={[type.caption, { fontSize: 11, color: colors.sageDeep }]}>{copy.settings.openKidMode}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
        {FLAGS.kidsMode && (
          !addingChild ? (
            <Pressable onPress={() => setAddingChild(true)} style={{ marginTop: spacing.xs, minHeight: 36, justifyContent: 'center' }}>
              <Text style={[type.label, { color: colors.sageDeep }]}>{copy.settings.addChildCta}</Text>
            </Pressable>
          ) : (
            <View style={{ marginTop: spacing.s }}>
              <Text style={type.caption}>{copy.settings.addChildHint}</Text>
              <TextInput
                style={styles.syncInput}
                value={childName}
                onChangeText={setChildName}
                placeholder="e.g. Ava"
                placeholderTextColor={colors.charcoalSoft}
              />
              {childError && (
                <Text style={[type.caption, { color: colors.coralDeep, marginTop: spacing.xs }]}>
                  {copy.settings.addChildOffline}
                </Text>
              )}
              <View style={{ flexDirection: 'row', marginTop: spacing.s, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label={copy.settings.addChildSave} onPress={() => void saveChild()} disabled={!childName.trim()} />
                </View>
                <Pressable onPress={() => { setAddingChild(false); setChildError(false); }} style={{ marginLeft: spacing.m, minHeight: 44, justifyContent: 'center' }}>
                  <Text style={[type.label, { color: colors.charcoalSoft }]}>{copy.photo.cancel}</Text>
                </Pressable>
              </View>
            </View>
          )
        )}
      </Card>

      <Card style={{ marginTop: spacing.m }}>
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

      <Card style={{ marginTop: spacing.m }}>
        <Text style={type.h2}>{copy.settings.currencyTitle}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.m }}>
          {CURRENCIES.map((c) => (
            <Chip key={c} label={c} selected={state.currency === c} onPress={() => setCurrency(c)} />
          ))}
        </View>
      </Card>

      {!state.hideMoney && (
        <Card style={{ marginTop: spacing.m }}>
          <Text style={type.h2}>{copy.settings.ratesTitle}</Text>
          <Text style={[type.caption, { marginBottom: spacing.m }]}>{copy.settings.ratesSub}</Text>
          {CATEGORIES.map((c) => (
            <View key={c.key} style={styles.rateRow}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Icon name={c.icon} size={14} color={colors.charcoalSoft} />
                <Text style={[type.label, { marginLeft: 6 }]}>{c.name}</Text>
              </View>
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

      <Card style={{ marginTop: spacing.m }}>
        <Text style={type.h2}>{copy.settings.voiceTitle}</Text>
        <Text style={[type.caption, { marginTop: spacing.xs, marginBottom: spacing.s }]}>{copy.settings.voiceSub}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {HERO_STYLES.map((st) => (
            <Chip key={st.key} label={st.label}
              selected={state.heroStyle === st.key}
              onPress={() => setHeroStyle(st.key)} />
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.m }}>
        <Text style={type.h2}>{copy.settings.dataTitle}</Text>
        <Text style={[type.caption, { marginTop: spacing.xs }]}>{copy.settings.dataSub}</Text>
        <Pressable onPress={exportData} style={{ marginTop: spacing.m }} accessibilityRole="button">
          <Text style={[type.label, { color: colors.sageDeep }]}>{copy.settings.exportCta}</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} style={{ marginTop: spacing.m }} accessibilityRole="button">
          <Text style={[type.label, { color: colors.coralDeep }]}>
            {confirmingDelete ? copy.settings.deleteConfirm : copy.settings.deleteCta}
          </Text>
        </Pressable>
      </Card>

      <Card style={{ marginTop: spacing.m }}>
        <Text style={type.h2}>{copy.settings.metricsTitle}</Text>
        <Text style={[type.caption, { marginTop: spacing.xs }]}>
          {median !== null
            ? `Median time to log (last ${logTimes.length}): ${(median / 1000).toFixed(1)}s — target <10s`
            : 'Log a task to start measuring.'}
        </Text>
        {median !== null && (
          <Pressable onPress={resetLogMetric} style={{ marginTop: spacing.s }}>
            <Text style={[type.label, { color: colors.charcoalSoft }]}>Reset timing data</Text>
          </Pressable>
        )}
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
      <HeroAvatarPicker visible={avatarPickerVisible} onPick={pickHeroAvatar} onClose={closeAvatarPicker} />
      <HeroAvatarPicker
        visible={childAvatarFor !== null}
        onPick={(key) => { const id = childAvatarFor; setChildAvatarFor(null); if (id) void sync.setHeroAvatar(key, id); }}
        onClose={() => setChildAvatarFor(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.l, paddingTop: spacing.xl, paddingBottom: spacing.l },
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
