import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { copy } from '../copy/strings';
import { useHousehold } from '../store/HouseholdStore';
import { useSync } from '../lib/sync';
import { Avatar, BusyButton } from './ui';
import { colors, radius, shadow, spacing, type } from '../theme/tokens';

// Family switcher (founder feedback): after creating a child, there was no
// obvious way to add another or to enter their world. Tapping your NAME on
// Today opens this sheet — every family member listed, kids tappable into
// Kids Mode, and "＋ Add a child" always one tap away. The Settings entry
// points remain; this is the intuitive front door.
export function FamilySwitcherSheet({ visible, onClose, onOpenKidMode }: {
  visible: boolean; onClose: () => void; onOpenKidMode: (childId: string) => void;
}) {
  const { state } = useHousehold();
  const sync = useSync();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState(false);

  const saveChild = async () => {
    setError(false);
    const ok = await sync.addChildMember(name);
    if (!ok) { setError(true); return; }
    setName(''); setAdding(false);
  };

  const adults = state.members.filter((m) => m.role !== 'child');
  const kids = state.members.filter((m) => m.role === 'child');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.photo.cancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={[type.h2, { textAlign: 'center' }]}>{copy.family.title}</Text>
          <ScrollView style={{ maxHeight: 380 }}>
            {adults.map((m) => (
              <View key={m.id} style={styles.row}>
                <Avatar name={m.name} colour={m.colour} size={40} avatarUrl={m.avatarUrl} memberId={m.id} />
                <Text style={[type.body, { marginLeft: spacing.m, flex: 1 }]}>
                  {m.name}{m.id === state.meId ? copy.family.youSuffix : ''}
                </Text>
              </View>
            ))}
            {kids.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => { onClose(); onOpenKidMode(m.id); }}
                accessibilityRole="button"
                accessibilityLabel={copy.family.openKid(m.name)}
                style={({ pressed }) => [styles.row, styles.kidRow, pressed && { opacity: 0.7 }]}
              >
                <Avatar name={m.name} colour={m.colour} size={40} avatarUrl={m.avatarUrl} memberId={m.id} />
                <View style={{ marginLeft: spacing.m, flex: 1 }}>
                  <Text style={type.body}>{m.name}</Text>
                  <Text style={[type.caption, { fontSize: 11 }]}>{copy.settings.kidBadge}</Text>
                </View>
                <Text style={[type.label, { color: colors.sageDeep }]}>{copy.family.kidModeCta}</Text>
              </Pressable>
            ))}

            {!adding ? (
              <Pressable onPress={() => setAdding(true)} style={styles.addRow} accessibilityRole="button">
                <Text style={[type.label, { color: colors.sageDeep }]}>{copy.settings.addChildCta}</Text>
              </Pressable>
            ) : (
              <View style={{ marginTop: spacing.m }}>
                <Text style={type.caption}>{copy.settings.addChildHint}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Ava"
                  placeholderTextColor={colors.charcoalSoft}
                />
                {error && (
                  <Text style={[type.caption, { color: colors.coralDeep, marginTop: spacing.xs }]}>
                    {copy.settings.addChildOffline}
                  </Text>
                )}
                <View style={{ marginTop: spacing.s }}>
                  <BusyButton
                    label={copy.settings.addChildSave}
                    busyLabel={copy.settings.addChildBusy}
                    onPress={saveChild}
                    disabled={!name.trim()}
                  />
                </View>
              </View>
            )}
          </ScrollView>
          <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
            <Text style={[type.label, { color: colors.charcoalSoft }]}>{copy.photo.cancel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(46, 53, 72, 0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.warmWhite,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: spacing.xl, paddingHorizontal: spacing.l, paddingBottom: spacing.xl,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.m, minHeight: 48 },
  kidRow: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    paddingHorizontal: spacing.m, ...shadow.card,
  },
  addRow: { marginTop: spacing.m, minHeight: 44, justifyContent: 'center' },
  input: {
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: colors.mist, padding: spacing.m, marginTop: spacing.s,
    fontSize: 16, color: colors.charcoal,
  },
  cancel: { alignItems: 'center', paddingVertical: spacing.m, minHeight: 44, justifyContent: 'center' },
});
