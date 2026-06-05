import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { CATEGORIES, Category, CategoryKey } from '../constants/categories';
import { copy, currencySymbol } from '../copy/strings';
import { useHousehold, Task } from '../store/HouseholdStore';
import { Avatar, Chip, PrimaryButton } from '../components/ui';
import { colors, spacing, type } from '../theme/tokens';

const DURATIONS = [5, 10, 15, 30, 45, 60];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const daysAgo = (iso: string) => {
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - d.getTime()) / 86400000);
};

// THE <10s SCREEN. Speed principles (post phone-test redesign):
// - Save is sticky at the bottom: never scroll to finish a log
// - Categories are a 2-row horizontal scroll, most-used sorted to front (per design spec §4)
// - Defaults do the work: 15 min, me, today — the happy path is 3 taps
export default function AddTaskScreen({ onDone, editTask }: {
  onDone: (toast: string) => void;
  editTask?: Task | null;
}) {
  const { state, addTask, updateTask, recordLogMs, taskValue } = useHousehold();
  const openedAt = useRef(Date.now());
  const isEdit = !!editTask;

  const [categoryKey, setCategoryKey] = useState<CategoryKey | null>(editTask?.categoryKey ?? null);
  const [title, setTitle] = useState(editTask?.title ?? '');
  const [durationMin, setDurationMin] = useState(editTask?.durationMin ?? 15);
  const [customMode, setCustomMode] = useState(
    editTask ? !DURATIONS.includes(editTask.durationMin) : false,
  );
  const [memberId, setMemberId] = useState(editTask?.memberId ?? state.meId);
  const [dayOffset, setDayOffset] = useState(
    editTask ? Math.min(Math.max(daysAgo(editTask.occurredAt), 0), 6) : 0,
  );
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(editTask?.notes ?? '');

  // Most-used categories float to the front (household learns your patterns)
  const categoryRows = useMemo(() => {
    const counts = new Map<CategoryKey, number>();
    state.tasks.forEach((t) => counts.set(t.categoryKey, (counts.get(t.categoryKey) ?? 0) + 1));
    const sorted = [...CATEGORIES].sort(
      (a, b) => (counts.get(b.key) ?? 0) - (counts.get(a.key) ?? 0),
    );
    return {
      top: sorted.filter((_, i) => i % 2 === 0),
      bottom: sorted.filter((_, i) => i % 2 === 1),
    };
  }, [state.tasks]);

  const value = useMemo(
    () => (categoryKey ? taskValue(categoryKey, durationMin) : 0),
    [categoryKey, durationMin, taskValue],
  );

  const dayChips = useMemo(() => {
    return Array.from({ length: 7 }, (_, offset) => {
      const d = new Date(); d.setDate(d.getDate() - offset);
      const label = offset === 0 ? copy.addTask.dayToday
        : offset === 1 ? copy.addTask.dayYesterday
        : `${WD[d.getDay()]} ${d.getDate()}`;
      return { offset, label };
    });
  }, []);

  const occurredAt = useMemo(() => {
    const base = editTask ? new Date(editTask.occurredAt) : new Date();
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    d.setHours(base.getHours(), base.getMinutes(), 0, 0);
    return d;
  }, [dayOffset, editTask]);

  const save = () => {
    if (!categoryKey || !memberId) return;
    if (isEdit && editTask) {
      updateTask(editTask.id, {
        categoryKey, title: title || undefined, notes: note || undefined,
        durationMin, memberId, occurredAt,
      });
      onDone(copy.addTask.savedEdit);
      return;
    }
    const firstEver = state.tasks.length === 0;
    addTask({
      categoryKey, title: title || undefined, notes: note || undefined,
      durationMin, memberId, occurredAt,
    });
    recordLogMs(Date.now() - openedAt.current); // the 🔒 metric (new logs only)
    onDone(firstEver ? copy.addTask.savedFirstEver : copy.addTask.savedToast);
  };

  const CatChip = ({ c }: { c: Category }) => (
    <Chip
      label={c.name}
      icon={c.icon}
      tint={c.colour}
      selected={categoryKey === c.key}
      onPress={() => setCategoryKey(c.key)}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.warmWhite }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[type.serifTitle, { fontSize: 26 }]}>
          {isEdit ? copy.addTask.editTitle : copy.addTask.screenTitle}
        </Text>

        <Text style={[type.h2, styles.section]}>{copy.addTask.whatPrompt}</Text>
        {/* 2-row horizontal scroll keeps all 13 reachable without eating vertical space */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.s }}>
          <View>
            <View style={{ flexDirection: 'row' }}>
              {categoryRows.top.map((c) => <CatChip key={c.key} c={c} />)}
            </View>
            <View style={{ flexDirection: 'row' }}>
              {categoryRows.bottom.map((c) => <CatChip key={c.key} c={c} />)}
            </View>
          </View>
        </ScrollView>

        <TextInput
          style={styles.input}
          placeholder={copy.addTask.titleHint}
          placeholderTextColor={colors.charcoalSoft}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[type.h2, styles.section]}>{copy.addTask.durationPrompt}</Text>
        <View style={styles.chipWrap}>
          {DURATIONS.map((d) => (
            <Chip
              key={d}
              label={`${d} min`}
              selected={!customMode && durationMin === d}
              onPress={() => { setCustomMode(false); setDurationMin(d); }}
            />
          ))}
          <Chip
            label={copy.addTask.custom}
            selected={customMode}
            onPress={() => setCustomMode(true)}
          />
        </View>
        {customMode && (
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => setDurationMin((m) => Math.max(5, m - 5))}>
              <Text style={type.h1}>−</Text>
            </Pressable>
            <Text style={[type.display, { minWidth: 100, textAlign: 'center' }]}>{durationMin} min</Text>
            <Pressable style={styles.stepBtn} onPress={() => setDurationMin((m) => Math.min(1440, m + 5))}>
              <Text style={type.h1}>＋</Text>
            </Pressable>
          </View>
        )}

        <Text style={[type.h2, styles.section]}>{copy.addTask.whoPrompt}</Text>
        <View style={{ flexDirection: 'row', marginTop: spacing.s }}>
          {state.members.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setMemberId(m.id)}
              style={{ alignItems: 'center', marginRight: spacing.l }}
              accessibilityRole="button"
            >
              <Avatar name={m.name} colour={m.colour} size={44} selected={memberId === m.id} />
              <Text style={[type.caption, { marginTop: spacing.xs }]}>{m.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[type.h2, styles.section]}>{copy.addTask.whenPrompt}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.s }}>
          {dayChips.map((d) => (
            <Chip
              key={d.offset}
              label={d.label}
              selected={dayOffset === d.offset}
              onPress={() => setDayOffset(d.offset)}
            />
          ))}
        </ScrollView>

        {!noteOpen && !note ? (
          <Pressable onPress={() => setNoteOpen(true)} style={{ marginTop: spacing.l }}>
            <Text style={[type.label, { color: colors.charcoalSoft }]}>{copy.addTask.noteLink}</Text>
          </Pressable>
        ) : (
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            placeholder="Just for you"
            placeholderTextColor={colors.charcoalSoft}
            value={note}
            onChangeText={setNote}
            multiline
          />
        )}
      </ScrollView>

      {/* Sticky footer: Save is ALWAYS one thumb-reach away — never scroll to finish */}
      <View style={styles.footer}>
        {!state.hideMoney && categoryKey ? (
          <Text style={[type.caption, { textAlign: 'center', marginBottom: spacing.s }]}>
            {copy.addTask.valuePreview(currencySymbol[state.currency] ?? '', value)}
          </Text>
        ) : null}
        <PrimaryButton
          label={isEdit ? copy.addTask.editCta : copy.addTask.saveCta}
          onPress={save}
          disabled={!categoryKey}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.l, paddingTop: spacing.xl, paddingBottom: spacing.l },
  section: { marginTop: spacing.l },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.s },
  input: {
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: colors.mist, padding: spacing.m, marginTop: spacing.s,
    fontSize: 16, color: colors.charcoal,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.m },
  stepBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.mist, alignItems: 'center', justifyContent: 'center',
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.l,
    paddingTop: spacing.s,
    paddingBottom: 24,
    boxShadow: '0 -3px 12px rgba(46, 53, 72, 0.08)',
  },
});
