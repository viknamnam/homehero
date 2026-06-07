import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { categoryByKey } from '../constants/categories';
import { copy } from '../copy/strings';
import { heroLineRandom } from '../lib/heroVoice';
import { ParsedTask, parseQuickLog } from '../lib/quickLog';
import { useHousehold } from '../store/HouseholdStore';
import { Card, IconBadge, PrimaryButton } from '../components/ui';
import { useInsets } from '../lib/insets';
import { colors, spacing, type } from '../theme/tokens';

// Quick Log (P4a): "Tell HeroNest what happened. We'll turn it into tasks."
// Mandatory review step — AI output is never saved without the person's OK.
export default function QuickLogScreen({ onDone }: { onDone: (toast: string) => void }) {
  const { state, addTask, taskValue } = useHousehold();
  const insets = useInsets();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState<ParsedTask[] | null>(null);
  const [unreachable, setUnreachable] = useState(false);

  const parse = async () => {
    setBusy(true); setUnreachable(false);
    const tasks = await parseQuickLog(text.trim());
    setBusy(false);
    if (!tasks) { setUnreachable(true); return; }
    setCards(tasks);
  };

  const saveAll = () => {
    if (!cards || !state.meId) return;
    cards.forEach((c) => addTask({
      categoryKey: c.categoryKey, title: c.title, durationMin: c.minutes, memberId: state.meId!,
    }));
    onDone(heroLineRandom('saved', state.heroStyle));
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.warmWhite }}
      contentContainerStyle={{ padding: spacing.l, paddingBottom: insets.bottom + spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[type.serifTitle, { fontSize: 26 }]}>{copy.quickLog.title}</Text>
      <Text style={[type.caption, { marginTop: spacing.xs }]}>{copy.quickLog.sub}</Text>

      <TextInput
        style={{
          backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: colors.mist,
          padding: spacing.m, marginTop: spacing.m, minHeight: 88, textAlignVertical: 'top',
          fontSize: 16, color: colors.charcoal,
        }}
        multiline
        placeholder={copy.quickLog.placeholder}
        placeholderTextColor={colors.charcoalSoft}
        value={text}
        onChangeText={setText}
      />
      <View style={{ marginTop: spacing.m }}>
        <PrimaryButton label={busy ? copy.quickLog.parsing : copy.quickLog.parseCta}
          onPress={parse} disabled={busy || text.trim().length < 3} />
      </View>
      {busy && <ActivityIndicator style={{ marginTop: spacing.m }} color={colors.coralDeep} />}
      {unreachable && <Text style={[type.caption, { marginTop: spacing.m, color: colors.coralDeep }]}>{copy.quickLog.unreachable}</Text>}

      {cards && (
        <View style={{ marginTop: spacing.l }}>
          <Text style={type.h2}>{cards.length > 0 ? copy.quickLog.found(cards.length) : copy.quickLog.none}</Text>
          {cards.map((c, i) => {
            const cat = categoryByKey(c.categoryKey);
            const value = taskValue(c.categoryKey, c.minutes);
            return (
              <Card key={i} style={{ marginTop: spacing.s }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconBadge icon={cat.icon} tint={colors.peachTint} size={34} />
                  <View style={{ flex: 1, marginLeft: spacing.m }}>
                    <Text style={type.body} numberOfLines={1}>{c.title}</Text>
                    <Text style={type.caption}>
                      {cat.name} · {c.minutes} min
                      {!state.hideMoney && (cat.mentalLoad
                        ? ` · ${copy.addTask.valueInvaluable}`
                        : ` · ${value}`)}
                    </Text>
                  </View>
                  <Pressable onPress={() => setCards(cards.filter((_, j) => j !== i))} hitSlop={10}>
                    <Text style={type.caption}>✕</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
          {cards.length > 0 && (
            <View style={{ marginTop: spacing.m }}>
              <PrimaryButton label={copy.quickLog.saveAll(cards.length)} onPress={saveAll} />
              <Text style={[type.caption, { marginTop: spacing.s, textAlign: 'center' }]}>{copy.quickLog.editHint}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
