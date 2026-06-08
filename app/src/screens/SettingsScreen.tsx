import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { HERO_STYLES } from '../lib/heroVoice';
import { copy, currencySymbol } from '../copy/strings';
import { useHousehold } from '../store/HouseholdStore';
import { useSync } from '../lib/sync';
import { usePhotoPicker } from '../lib/usePhotoPicker';
import { FLAGS } from '../constants/flags';
import { cancelWeeklyDigest, disableThanksPush, enableThanksPush, notificationsAvailable, scheduleWeeklyDigest } from '../lib/notifications';
import QRCode from 'react-native-qrcode-svg';
import { joinUrlFor, kidUrlFor } from '../lib/joinLink';
import { HeroAvatarPicker } from '../components/HeroAvatars';
import { AvatarMenuSheet } from '../components/AvatarMenu';
import * as Clipboard from 'expo-clipboard';
import { Avatar, BusyButton, Card, Chip, PrimaryButton } from '../components/ui';
import { Icon } from '../components/icons';
import { Header, LogoLoader } from '../components/brand';
import { colors, spacing, type, radius, shadow } from '../theme/tokens';

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP'];

function SyncCard() {
  const { state, reset } = useHousehold();
  const sync = useSync();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

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

          {/* Invite section (founder UX pass): collapsed = ONE row, title +
              button, no redundant sub-line. Expanded = QR/code with a clear
              one-code-per-person rule, "New code" for the next person, and a
              Done to put it away without leaving Settings. */}
          {!inviteCode ? (
            <View style={{ marginTop: spacing.l }}>
              {inviteBusy ? (
                <View style={{ alignItems: 'center', minHeight: 48, justifyContent: 'center' }}>
                  <LogoLoader label={copy.sync.inviteBusy} />
                </View>
              ) : (
                <PrimaryButton
                  label={copy.sync.inviteTitle}
                  onPress={async () => {
                    setInviteBusy(true);
                    setInviteCode(await sync.createInvite());
                    setInviteCopied(false);
                    setInviteBusy(false);
                  }}
                />
              )}
            </View>
          ) : (
            <View style={styles.inviteBox}>
              <View style={{ alignItems: 'center', marginBottom: spacing.m }}>
                <View style={{ backgroundColor: '#FFFFFF', padding: spacing.m, borderRadius: 12 }}>
                  <QRCode value={joinUrlFor(inviteCode)} size={132} color={colors.charcoal} backgroundColor="#FFFFFF" />
                </View>
                <Text style={[type.caption, { marginTop: spacing.s }]}>{copy.sync.inviteScanHint}</Text>
              </View>
              <Text style={[type.display, { letterSpacing: 4, textAlign: 'center' }]}>{inviteCode}</Text>
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync(copy.sync.inviteShareText(inviteCode, joinUrlFor(inviteCode)));
                  setInviteCopied(true);
                }}
                style={{ marginTop: spacing.s, minHeight: 36, justifyContent: 'center' }}
                accessibilityRole="button"
              >
                <Text style={[type.label, { color: colors.coralDeep, textAlign: 'center' }]}>
                  {inviteCopied ? copy.sync.inviteCopied : copy.sync.inviteCopy}
                </Text>
              </Pressable>
              <Text style={[type.caption, { marginTop: spacing.s, textAlign: 'center' }]}>
                {copy.sync.inviteOnePer}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.m }}>
                <Pressable
                  onPress={async () => {
                    setInviteBusy(true);
                    setInviteCode(await sync.createInvite());
                    setInviteCopied(false);
                    setInviteBusy(false);
                  }}
                  accessibilityRole="button"
                  style={{ minHeight: 44, justifyContent: 'center', marginRight: spacing.xl }}
                >
                  {inviteBusy
                    ? <LogoLoader size={20} label={copy.sync.inviteBusy} />
                    : <Text style={[type.label, { color: colors.coralDeep }]}>{copy.sync.inviteNext}</Text>}
                </Pressable>
                <Pressable
                  onPress={() => { setInviteCode(null); setInviteCopied(false); }}
                  accessibilityRole="button"
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={[type.label, { color: colors.charcoalSoft }]}>{copy.sync.inviteDone}</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', marginTop: spacing.l }}>
            <Pressable onPress={() => sync.syncNow()} disabled={sync.busy} style={{ marginRight: spacing.xl, minHeight: 28, justifyContent: 'center' }}>
              <Text style={[type.label, { color: colors.sageDeep }]}>
                {sync.busy ? copy.sync.syncing : copy.sync.syncNow}
              </Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                if (!confirmingSignOut) { setConfirmingSignOut(true); return; }
                try { await sync.syncNow(); } catch {}
                await sync.signOut();
                reset();
                setConfirmingSignOut(false);
              }}
              style={{ minHeight: 28, justifyContent: 'center' }}
            >
              <Text style={[type.label, { color: confirmingSignOut ? colors.coralDeep : colors.charcoalSoft }]}>
                {confirmingSignOut ? copy.sync.signOutConfirm : copy.sync.signOut}
              </Text>
            </Pressable>
          </View>
          {confirmingSignOut && (
            <Text style={[type.caption, { marginTop: spacing.s }]}>{copy.sync.signOutNote}</Text>
          )}
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
  const { state, dispatch, setHideMoney, setCurrency, setRate, reset, resetLogMetric, setHeroStyle, setPocketMoney } = useHousehold();

  const toggleThanksPush = async (v: boolean) => {
    if (v && state.meId) {
      const ok = await enableThanksPush(state.meId);
      dispatch({ type: 'SET_NOTIFY_PREFS', thanksPush: ok });
    } else {
      if (state.meId) await disableThanksPush(state.meId);
      dispatch({ type: 'SET_NOTIFY_PREFS', thanksPush: false });
    }
  };
  const toggleDigest = async (v: boolean) => {
    if (v) {
      const ok = await scheduleWeeklyDigest(copy.notify.digestTitle, copy.notify.digestBody);
      dispatch({ type: 'SET_NOTIFY_PREFS', weeklyDigest: ok });
    } else {
      await cancelWeeklyDigest();
      dispatch({ type: 'SET_NOTIFY_PREFS', weeklyDigest: false });
    }
  };
  const [confirmingReset, setConfirmingReset] = useState(false);
  // Photo avatars: shared flow (camera or library) — see lib/usePhotoPicker
  const { canEditPhoto, canUploadPhoto, changeMyPhoto, avatarPickerVisible, closeAvatarPicker, pickHeroAvatar, menuVisible, closeMenu, menuHeroFace, menuCamera, menuLibrary } = usePhotoPicker();
  const sync = useSync();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Kids Mode: add-child form + child-avatar picker target (avatars ONLY for kids — no camera)
  const [addingChild, setAddingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childError, setChildError] = useState(false);
  const [childAvatarFor, setChildAvatarFor] = useState<string | null>(null);
  const [kidLinkFor, setKidLinkFor] = useState<{ name: string; token: string } | null>(null);

  const makeKidLink = async (childId: string, name: string) => {
    const token = await sync.createKidLink(childId);
    if (token) setKidLinkFor({ name, token });
  };
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const removeRenaming = async () => {
    if (!renaming) return;
    const ok = await sync.removeMember(renaming.id);
    if (ok) { setRenaming(null); setConfirmingRemove(false); }
  };

  const saveRename = async () => {
    if (!renaming) return;
    const ok = await sync.renameMember(renaming.id, renaming.name);
    if (ok) { setRenaming(null); setConfirmingRemove(false); }
  };

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
                  <Avatar name={m.name} colour={m.colour} size={48} avatarUrl={m.avatarUrl} memberId={m.id} />
                </Pressable>
                <Pressable
                  disabled={!(mine || isChild)}
                  onPress={() => setRenaming({ id: m.id, name: m.name })}
                  hitSlop={6}
                  accessibilityRole={mine || isChild ? 'button' : undefined}
                  accessibilityLabel={mine || isChild ? copy.settings.renameTitle : undefined}
                >
                  <Text style={[type.caption, { marginTop: spacing.xs }]}>
                    {m.name}{isChild ? ` · ${copy.settings.kidBadge}` : ''}{(mine || isChild) ? ' ✎' : ''}
                  </Text>
                  {mine && canEditPhoto && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                      <Icon name="camera" size={11} color={colors.charcoalSoft} />
                      <Text style={[type.caption, { fontSize: 11, marginLeft: 3 }]}>{copy.settings.editPhoto}</Text>
                    </View>
                  )}
                </Pressable>
                {isChild && onOpenKidMode && (
                  <>
                    <Pressable onPress={() => onOpenKidMode(m.id)} style={styles.kidModeBtn} accessibilityRole="button">
                      <Text style={[type.label, { fontSize: 12, color: colors.surface }]}>{copy.settings.openKidMode}</Text>
                    </Pressable>
                    {FLAGS.kidDeviceLink && (
                      <Pressable onPress={() => void makeKidLink(m.id, m.name)} style={styles.kidDeviceBtn} accessibilityRole="button">
                        <Text style={[type.label, { fontSize: 12, color: colors.sageDeep }]}>{copy.settings.kidDeviceCta}</Text>
                      </Pressable>
                    )}
                  </>
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
                  <BusyButton label={copy.settings.addChildSave} busyLabel={copy.settings.addChildBusy} onPress={saveChild} disabled={!childName.trim()} />
                </View>
                <Pressable onPress={() => { setAddingChild(false); setChildError(false); }} style={{ marginLeft: spacing.m, minHeight: 44, justifyContent: 'center' }}>
                  <Text style={[type.label, { color: colors.charcoalSoft }]}>{copy.photo.cancel}</Text>
                </Pressable>
              </View>
            </View>
          )
        )}
      </Card>

      {FLAGS.kidsMode && (
        <Card style={{ marginTop: spacing.m }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: spacing.m }}>
              <Text style={type.h2}>{copy.settings.pocketTitle}</Text>
              <Text style={[type.caption, { marginTop: 2 }]}>{copy.settings.pocketSub}</Text>
            </View>
            <Switch
              value={!!state.pocketMoneyEnabled}
              onValueChange={(v) => setPocketMoney(v, state.pocketPointsPerUnit ?? 70)}
              trackColor={{ true: colors.sage, false: colors.mist }}
              thumbColor={colors.surface}
            />
          </View>
          {state.pocketMoneyEnabled && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.m }}>
              <TextInput
                style={[styles.rateInput, { width: 76 }]}
                keyboardType="number-pad"
                value={String(state.pocketPointsPerUnit ?? 70)}
                onChangeText={(t) => setPocketMoney(true, Number(t.replace(/[^0-9]/g, '')) || 70)}
              />
              <Text style={[type.body, { marginLeft: spacing.m, flex: 1 }]}>
                {copy.settings.pocketRate(currencySymbol[state.currency] ?? state.currency)}
              </Text>
            </View>
          )}
        </Card>
      )}

      {FLAGS.notifications && notificationsAvailable() && (
        <Card style={{ marginTop: spacing.m }}>
          <Text style={type.h2}>{copy.notify.cardTitle}</Text>
          <Text style={[type.caption, { marginTop: 2 }]}>{copy.notify.cardSub}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.m }}>
            <Text style={[type.body, { flex: 1, marginRight: spacing.m }]}>{copy.notify.thanksLabel}</Text>
            <Switch
              value={!!state.thanksPushEnabled}
              onValueChange={(v) => void toggleThanksPush(v)}
              trackColor={{ true: colors.sage, false: colors.mist }}
              thumbColor={colors.surface}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.m }}>
            <Text style={[type.body, { flex: 1, marginRight: spacing.m }]}>{copy.notify.digestLabel}</Text>
            <Switch
              value={!!state.weeklyDigestEnabled}
              onValueChange={(v) => void toggleDigest(v)}
              trackColor={{ true: colors.sage, false: colors.mist }}
              thumbColor={colors.surface}
            />
          </View>
        </Card>
      )}

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
      <AvatarMenuSheet
        visible={menuVisible}
        onClose={closeMenu}
        onHeroFace={menuHeroFace}
        onCamera={menuCamera}
        onLibrary={menuLibrary}
        photosAvailable={canUploadPhoto}
      />
      <HeroAvatarPicker visible={avatarPickerVisible} onPick={pickHeroAvatar} onClose={closeAvatarPicker} />
      <Modal visible={renaming !== null} transparent animationType="fade" onRequestClose={() => setRenaming(null)}>
        <Pressable style={styles.renameBackdrop} onPress={() => { setRenaming(null); setConfirmingRemove(false); }}>
          <Pressable style={styles.renameSheet} onPress={() => {}}>
            <Text style={[type.h2, { textAlign: 'center' }]}>{copy.settings.renameTitle}</Text>
            <TextInput
              style={styles.syncInput}
              value={renaming?.name ?? ''}
              onChangeText={(v) => setRenaming((r) => r ? { ...r, name: v } : r)}
              autoFocus
            />
            <View style={{ marginTop: spacing.m }}>
              <BusyButton
                label={copy.settings.renameSave}
                busyLabel={copy.settings.renameBusy}
                onPress={saveRename}
                disabled={!renaming?.name.trim()}
              />
            </View>
            <Pressable onPress={() => { setRenaming(null); setConfirmingRemove(false); }} style={{ alignItems: 'center', marginTop: spacing.s, minHeight: 44, justifyContent: 'center' }}>
              <Text style={[type.label, { color: colors.charcoalSoft }]}>{copy.photo.cancel}</Text>
            </Pressable>
            {renaming && renaming.id !== state.meId && !state.members.find((m) => m.id === renaming.id)?.linked && (
              <Pressable
                onPress={() => (confirmingRemove ? void removeRenaming() : setConfirmingRemove(true))}
                style={[styles.removeBtn, confirmingRemove && { backgroundColor: colors.coral }]}
                accessibilityRole="button"
              >
                <Text style={[type.label, { color: confirmingRemove ? colors.surface : colors.coralDeep, textAlign: 'center' }]}>
                  {confirmingRemove ? copy.settings.removeConfirm : copy.settings.removeCta(renaming?.name.trim() || '')}
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={kidLinkFor !== null} transparent animationType="fade" onRequestClose={() => setKidLinkFor(null)}>
        <Pressable style={styles.renameBackdrop} onPress={() => setKidLinkFor(null)}>
          <Pressable style={styles.renameSheet} onPress={() => {}}>
            <Text style={[type.h2, { textAlign: 'center' }]}>{copy.settings.kidDeviceTitle(kidLinkFor?.name ?? '')}</Text>
            <Text style={[type.caption, { textAlign: 'center', marginTop: spacing.xs }]}>{copy.settings.kidDeviceSub}</Text>
            {kidLinkFor && (
              <View style={{ alignItems: 'center', marginTop: spacing.l }}>
                <View style={{ backgroundColor: '#FFFFFF', padding: spacing.m, borderRadius: 12 }}>
                  <QRCode value={kidUrlFor(kidLinkFor.token)} size={150} color={colors.charcoal} backgroundColor="#FFFFFF" />
                </View>
              </View>
            )}
            <Pressable onPress={() => setKidLinkFor(null)} style={{ alignItems: 'center', marginTop: spacing.l, minHeight: 44, justifyContent: 'center' }}>
              <Text style={[type.label, { color: colors.charcoalSoft }]}>{copy.photo.cancel}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
  removeBtn: {
    marginTop: spacing.m, minHeight: 44, borderRadius: radius.button, justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.coral, paddingHorizontal: spacing.l,
  },
  kidDeviceBtn: {
    marginTop: spacing.xs, borderWidth: 1, borderColor: colors.sage, borderRadius: radius.chip,
    paddingHorizontal: spacing.m, paddingVertical: spacing.xs, minHeight: 30, justifyContent: 'center',
  },
  kidModeBtn: {
    marginTop: spacing.xs, backgroundColor: colors.sage, borderRadius: radius.chip,
    paddingHorizontal: spacing.m, paddingVertical: spacing.xs, minHeight: 30, justifyContent: 'center',
  },
  renameBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(46, 53, 72, 0.35)', justifyContent: 'center', paddingHorizontal: spacing.xl,
  },
  renameSheet: {
    backgroundColor: colors.warmWhite, borderRadius: 20,
    padding: spacing.xl, ...shadow.card,
  },
  invitePill: {
    backgroundColor: colors.coral, borderRadius: radius.chip,
    paddingHorizontal: spacing.l, minHeight: 38, justifyContent: 'center', ...shadow.card,
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
