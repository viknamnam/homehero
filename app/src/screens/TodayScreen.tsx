import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryByKey } from '../constants/categories';
import { copy, currencySymbol } from '../copy/strings';
import { fmtHM, isSameDay, useHousehold, Task } from '../store/HouseholdStore';
import { AffirmationCard, Avatar, Card, IconBadge, PrimaryButton, StatCard } from '../components/ui';
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

            {/* Greeting block — avatar + serif name, mockup style */}
            <View style={styles.greetRow}>
              <Avatar name={me?.name ?? ''} colour={me?.colour ?? colors.peach} size={56} />
              <View style={{ marginLeft: spacing.l, flex: 1 }}>
                <Text style={type.body}>{greetingWord()}</Text>
                <Text style={[type.serifTitle, { marginTop: -2 }]}>{me?.name} <Text style={{ fontSize: 22 }}>💛</Text></Text>
                <Text style={[type.caption, { marginTop: 2 }]}>{greetSub}</Text>
              </View>
            </View>

            {/* Stat grid — 2 columns like the mockup */}
            <View style={styles.grid}>
              <StatCard
                icon="📋" iconTint={colors.sageTint}
                label={copy.today.statTasks}
                value={String(todayTasks.length)}
                style={styles.gridCard}
              />
              <StatCard
                icon="🕐" iconTint={colors.skyTint}
                label={copy.today.statTime}
                value={fmtHM(totalMin)}
                sub={copy.today.statTimeSub}
                style={styles.gridCard}
              />
              {!state.hideMoney && (
                <StatCard
                  icon="💛" iconTint={colors.butterTint}
                  label={copy.today.statValue}
                  value={`≈ ${cur}${totalValue}`}
                  sub={copy.today.statValueSub}
                  style={styles.gridCard}
                />
              )}
            </View>

            {todayTasks.length === 0 ? (
              <Card style={{ marginTop: spacing.s, alignItems: 'center' }}>
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
          todayTasks.length > 0 ? (
            <View style={{ marginTop: spacing.m }}>
              <AffirmationCard title={copy.today.affirmTitle} sub={copy.today.affirmSub} />
            </View>
          ) : null
        }
      />

      {/* Full-width two-line CTA above the tab bar, mockup style */}
      <View style={styles.ctaWrap}>
        <PrimaryButton
          label={`＋ ${copy.today.addTaskCta}`}
          sub={copy.today.addTaskSub}
          onPress={onAdd}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, paddingTop: spacing.xxl, paddingBottom: 190 },
  greetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.l },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48.5%', marginBottom: spacing.m },
  taskRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.m, marginBottom: spacing.s,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  ctaWrap: {
    position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 96,
  },
});
