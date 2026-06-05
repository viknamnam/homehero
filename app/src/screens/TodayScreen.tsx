import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryByKey } from '../constants/categories';
import { copy, currencySymbol } from '../copy/strings';
import { fmtHM, isSameDay, useHousehold, Task } from '../store/HouseholdStore';
import { AffirmationCard, Avatar, Card, IconBadge, PrimaryButton, StatCardCompact } from '../components/ui';
import { Header } from '../components/brand';
import { colors, fonts, spacing, type } from '../theme/tokens';

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

const CAT_TINTS: Record<string, string> = {
  // emoji icons sit on these pastel circles in task rows
  default: colors.skyTint,
};

function TaskRow({ task, personColour, personName, onEdit, onDelete }: {
  task: Task; personColour: string; personName: string; onEdit: () => void; onDelete: () => void;
}) {
  const cat = categoryByKey(task.categoryKey);
  return (
    <Card style={styles.taskRow}>
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel="Edit task"
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
      >
        <IconBadge icon={cat.icon} tint={CAT_TINTS.default} size={36} />
        <View style={{ flex: 1, marginLeft: spacing.m }}>
          <Text style={type.body}>{task.title ?? cat.name}</Text>
          <Text style={type.caption}>{personName} · {task.durationMin} min</Text>
        </View>
      </Pressable>
      <View style={[styles.dot, { backgroundColor: personColour }]} />
      <Pressable onPress={onDelete} hitSlop={12} accessibilityLabel="Delete task">
        <Text style={[type.label, { color: colors.charcoalSoft, marginLeft: spacing.m }]}>✕</Text>
      </Pressable>
    </Card>
  );
}

export default function TodayScreen({ onAdd, onEdit }: {
  onAdd: () => void; onEdit: (task: Task) => void;
}) {
  const { state, deleteTask } = useHousehold();
  const me = state.members.find((m) => m.id === state.meId);

  const todayTasks = useMemo(() => {
    const now = new Date();
    return state.tasks.filter((t) => isSameDay(t.occurredAt, now));
  }, [state.tasks]);

  const totalMin = todayTasks.reduce((s, t) => s + t.durationMin, 0);
  const totalValue = todayTasks.reduce((s, t) => s + t.valueAmount, 0);
  const cur = currencySymbol[state.currency] ?? '';
  const greetSub = copy.today.greetingSubs[new Date().getDate() % copy.today.greetingSubs.length];

  const memberById = (id: string) => state.members.find((m) => m.id === id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.warmWhite }}>
      <FlatList
        data={todayTasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View>
            <Header />

            {/* Greeting block — compact: name + subline in one tight unit */}
            <View style={styles.greetRow}>
              <Avatar name={me?.name ?? ''} colour={me?.colour ?? colors.peach} size={48} />
              <View style={{ marginLeft: spacing.m, flex: 1 }}>
                <Text style={type.caption}>{greetingWord()}</Text>
                <Text style={[type.serifTitle, { fontSize: 26, marginTop: -2 }]}>
                  {me?.name} <Text style={{ fontSize: 18 }}>💛</Text>
                </Text>
                <Text style={[type.caption, { marginTop: 1 }]}>{greetSub}</Text>
              </View>
            </View>

            {/* Compact stat row — everything important visible at a glance (refined mockup) */}
            <View style={styles.statRow}>
              <StatCardCompact
                icon="📋" iconTint={colors.sageTint}
                label={copy.today.statTasks}
                value={String(todayTasks.length)}
              />
              <StatCardCompact
                icon="🕐" iconTint={colors.skyTint}
                label={copy.today.statTime}
                value={fmtHM(totalMin)}
                sub={copy.today.statTimeSub}
              />
              {!state.hideMoney && (
                <StatCardCompact
                  icon="💛" iconTint={colors.butterTint}
                  label={copy.today.statValue}
                  value={`${cur}${totalValue}`}
                  sub={copy.today.statValueSub}
                />
              )}
            </View>

            {todayTasks.length === 0 ? (
              <Card style={{ marginTop: spacing.xs, alignItems: 'center' }}>
                <Text style={[type.body, { textAlign: 'center', color: colors.charcoalSoft }]}>
                  {copy.today.emptyToday}
                </Text>
              </Card>
            ) : (
              <Text style={[type.h2, { marginTop: spacing.m, marginBottom: spacing.s }]}>Today</Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const m = memberById(item.memberId);
          return (
            <TaskRow
              task={item}
              personName={m?.name ?? ''}
              personColour={m?.colour ?? colors.mist}
              onEdit={() => onEdit(item)}
              onDelete={() => deleteTask(item.id)}
            />
          );
        }}
        ListFooterComponent={
          <View>
            {todayTasks.length > 0 && (
              <View style={{ marginTop: spacing.m }}>
                <AffirmationCard title={copy.today.affirmTitle} sub={copy.today.affirmSub} />
              </View>
            )}
            {/* CTA lives in the content flow — no overlap with the tab bar; the ＋ tab is always available */}
            <View style={{ marginTop: spacing.l }}>
              <PrimaryButton
                label={`＋ ${copy.today.addTaskCta}`}
                sub={copy.today.addTaskSub}
                onPress={onAdd}
              />
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.l, paddingTop: spacing.xl, paddingBottom: 110 },
  greetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.m },
  statRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.s },
  taskRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.s + 2, marginBottom: spacing.s,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
