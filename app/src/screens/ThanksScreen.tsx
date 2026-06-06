import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATEGORIES, CategoryKey, categoryByKey } from '../constants/categories';
import { copy } from '../copy/strings';
import { inWeekOf, startOfWeek, useHousehold } from '../store/HouseholdStore';
import { Avatar, Card, Chip, PrimaryButton } from '../components/ui';
import { Header } from '../components/brand';
import { colors, spacing, type } from '../theme/tokens';

// THANKS — the emotional counterweight to the numbers. Appreciation is one tap:
// pick a person, optionally the work, optionally a word. Then we celebrate the
// week's wins. No scores, no streaks of guilt — recognition, plainly.
export default function ThanksScreen({ onToast }: { onToast?: (m: string) => void }) {
  const { state, sendThanks } = useHousehold();
  const others = state.members.filter((m) => m.id !== state.meId);

  const [toId, setToId] = useState<string | null>(others[0]?.id ?? null);
  const [catKey, setCatKey] = useState<CategoryKey | null>(null);
  const [note, setNote] = useState('');

  const weekThanks = useMemo(() => {
    const ws = startOfWeek(new Date());
    return state.thanks.filter((t) => inWeekOf(t.createdAt, ws));
  }, [state.thanks]);

  const memberName = (id: string) => state.members.find((m) => m.id === id)?.name ?? '';
  const memberColour = (id: string) => state.members.find((m) => m.id === id)?.colour ?? colors.mist;
  const memberAvatar = (id: string) => state.members.find((m) => m.id === id)?.avatarUrl;

  const send = () => {
    if (!toId) return;
    sendThanks({ toMemberId: toId, categoryKey: catKey ?? undefined, note: note || undefined });
    setNote(''); setCatKey(null);
    onToast?.(copy.thanks.sentToast(memberName(toId)));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.warmWhite }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Header />
        <Text style={[type.serifTitle, { fontSize: 26 }]}>{copy.thanks.title}</Text>

        {others.length === 0 ? (
          <Card style={{ marginTop: spacing.m, alignItems: 'center' }}>
            <Text style={[type.body, { textAlign: 'center', color: colors.charcoalSoft }]}>
              {copy.thanks.soloHint}
            </Text>
          </Card>
        ) : (
          <Card style={{ marginTop: spacing.m }}>
            <Text style={type.h2}>{copy.thanks.whoPrompt}</Text>
            <View style={{ flexDirection: 'row', marginTop: spacing.s }}>
              {others.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setToId(m.id)}
                  style={{ alignItems: 'center', marginRight: spacing.l }}
                  accessibilityRole="button"
                >
                  <Avatar name={m.name} colour={m.colour} size={48} selected={toId === m.id} avatarUrl={m.avatarUrl} />
                  <Text style={[type.caption, { marginTop: spacing.xs }]}>{m.name}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[type.h2, { marginTop: spacing.l }]}>{copy.thanks.forPrompt}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.s }}>
              <View>
                <View style={{ flexDirection: 'row' }}>
                  {CATEGORIES.filter((_, i) => i % 2 === 0).map((c) => (
                    <Chip key={c.key} label={c.name} iconName={c.icon} selected={catKey === c.key}
                      onPress={() => setCatKey(catKey === c.key ? null : c.key)} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row' }}>
                  {CATEGORIES.filter((_, i) => i % 2 === 1).map((c) => (
                    <Chip key={c.key} label={c.name} iconName={c.icon} selected={catKey === c.key}
                      onPress={() => setCatKey(catKey === c.key ? null : c.key)} />
                  ))}
                </View>
              </View>
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder={copy.thanks.notePlaceholder}
              placeholderTextColor={colors.charcoalSoft}
              value={note}
              onChangeText={setNote}
              multiline
            />

            <View style={{ marginTop: spacing.m }}>
              <PrimaryButton label={copy.thanks.sendCta} onPress={send} disabled={!toId} />
            </View>
          </Card>
        )}

        {/* This week's wins */}
        <Text style={[type.h2, { marginTop: spacing.l }]}>{copy.thanks.winsTitle}</Text>
        {weekThanks.length === 0 ? (
          <Card style={{ marginTop: spacing.s, alignItems: 'center' }}>
            <Text style={[type.caption, { textAlign: 'center' }]}>{copy.thanks.winsEmpty}</Text>
          </Card>
        ) : (
          weekThanks.map((t) => (
            <Card key={t.id} style={styles.winRow}>
              <Avatar name={memberName(t.toMemberId)} colour={memberColour(t.toMemberId)} size={36} avatarUrl={memberAvatar(t.toMemberId)} />
              <View style={{ flex: 1, marginLeft: spacing.m }}>
                <Text style={type.body}>
                  {copy.thanks.winLine(memberName(t.fromMemberId), memberName(t.toMemberId))}
                </Text>
                <Text style={type.caption}>
                  {t.categoryKey ? categoryByKey(t.categoryKey).name : copy.thanks.winGeneric}
                  {t.note ? ` · “${t.note}”` : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>💛</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.l, paddingTop: spacing.xl, paddingBottom: 110 },
  input: {
    backgroundColor: colors.warmWhite, borderRadius: 12, borderWidth: 1,
    borderColor: colors.mist, padding: spacing.m, marginTop: spacing.m,
    minHeight: 52, fontSize: 16, color: colors.charcoal,
  },
  winRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.s },
});
