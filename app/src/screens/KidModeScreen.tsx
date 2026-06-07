import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, CategoryKey, categoryByKey } from '../constants/categories';
import { copy } from '../copy/strings';
import { isSameDay, startOfWeek, useHousehold, PlannedTask } from '../store/HouseholdStore';
import { Avatar, Card, IconBadge } from '../components/ui';
import { HeroAvatarPicker } from '../components/HeroAvatars';
import { useSync } from '../lib/sync';
import { useInsets } from '../lib/insets';
import DoodleBackground from '../components/DoodleBackground';
import { FLAGS } from '../constants/flags';
import { Icon } from '../components/icons';
import { colors, fonts, radius, shadow, spacing, type } from '../theme/tokens';

// KIDS MODE (P3) — §10 guardrails, enforced by design:
// - NO money, value, percentages, or member comparisons ANYWHERE on this screen
//   (not even when hideMoney is off — kids never see adult metrics)
// - Effort/consistency framing only: missions, hero points, streaks, badges
// - Avatar: hero faces ONLY — no camera, no photo library (founder security
//   decision; also the COPPA-safe default)
// - Exit is adult-gated by a hold-to-exit control (quick taps do nothing)
// - Tasks logged here use a fixed friendly duration; they flow into the adult
//   views like any task, but the kid-facing surface never ranks anyone.

const KID_TASK_MINUTES = 10;
const POINTS_PER_TASK = 25;
// Kid-friendly category subset: concrete, doable jobs (no Planning/Admin etc.)
const KID_CATEGORIES: CategoryKey[] = [
  'cleaning', 'cooking', 'laundry', 'pets', 'waste', 'homework',
].filter((k) => CATEGORIES.some((c) => c.key === k)) as CategoryKey[];

type Badge = { key: string; icon: ReturnType<typeof categoryByKey>['icon'] | 'sparkles'; tint: string; title: string; earned: boolean };

function planIsForToday(p: PlannedTask, today: Date): boolean {
  const iso = today.toISOString().slice(0, 10);
  if (p.completedDates.includes(iso)) return false;
  if (p.repeat === 'daily') return true;
  if (p.repeat === 'weekly') return p.weekday === today.getDay();
  return isSameDay(p.date, today);
}

export default function KidModeScreen({ childId, onExit }: { childId: string; onExit: () => void }) {
  const { state, addTask, completePlan } = useHousehold();
  const sync = useSync();
  const insets = useInsets();
  const [helping, setHelping] = useState(false);
  const [avatarPicker, setAvatarPicker] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);

  const kid = state.members.find((m) => m.id === childId);
  const today = new Date();

  const myTasks = useMemo(
    () => state.tasks.filter((t) => t.memberId === childId),
    [state.tasks, childId],
  );
  const weekTasks = useMemo(() => {
    const ws = startOfWeek(new Date());
    return myTasks.filter((t) => new Date(t.occurredAt) >= ws);
  }, [myTasks]);

  const missions = useMemo(
    () => state.plans.filter((p) => p.assignedMemberId === childId && planIsForToday(p, today)),
    [state.plans, childId],
  );

  const heroPoints = weekTasks.length * POINTS_PER_TASK;

  const streak = useMemo(() => {
    let days = 0;
    const d = new Date(); d.setHours(0, 0, 0, 0);
    // today counts if something is logged; otherwise streak counts back from yesterday
    if (!myTasks.some((t) => isSameDay(t.occurredAt, d))) d.setDate(d.getDate() - 1);
    while (myTasks.some((t) => isSameDay(t.occurredAt, d))) {
      days += 1; d.setDate(d.getDate() - 1);
    }
    return days;
  }, [myTasks]);

  const badges: Badge[] = useMemo(() => {
    const countFor = (key: CategoryKey) => myTasks.filter((t) => t.categoryKey === key).length;
    const defs = [
      { key: 'kitchen', cat: 'cooking' as CategoryKey, title: copy.kids.badgeKitchen, need: 3 },
      { key: 'pet', cat: 'pets' as CategoryKey, title: copy.kids.badgePet, need: 3 },
      { key: 'laundry', cat: 'laundry' as CategoryKey, title: copy.kids.badgeLaundry, need: 3 },
      { key: 'tidy', cat: 'cleaning' as CategoryKey, title: copy.kids.badgeTidy, need: 3 },
    ].filter((b) => CATEGORIES.some((c) => c.key === b.cat));
    const catBadges: Badge[] = defs.map((b) => {
      const cat = categoryByKey(b.cat);
      return { key: b.key, icon: cat.icon, tint: colors.sageTint, title: b.title, earned: countFor(b.cat) >= b.need };
    });
    return [
      ...catBadges,
      { key: 'team', icon: 'sparkles', tint: colors.butterTint, title: copy.kids.badgeTeam, earned: myTasks.length >= 10 },
    ];
  }, [myTasks]);

  if (!kid) return null;

  const celebrate = (points: number) => {
    setCelebration(copy.kids.earned(points));
    setTimeout(() => setCelebration(null), 2200);
  };

  const completeMission = (p: PlannedTask) => {
    completePlan(p.id);
    addTask({ categoryKey: p.categoryKey, title: p.title, durationMin: KID_TASK_MINUTES, memberId: childId });
    celebrate(POINTS_PER_TASK);
  };

  const logHelp = (categoryKey: CategoryKey) => {
    addTask({ categoryKey, durationMin: KID_TASK_MINUTES, memberId: childId });
    setHelping(false);
    celebrate(POINTS_PER_TASK);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.warmWhite }]}>
      {FLAGS.doodles && <DoodleBackground density="playful" />}
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.l }]}>
        {/* Hold-to-exit: quick taps do nothing — a light adult gate */}
        <Pressable
          onLongPress={onExit}
          delayLongPress={1500}
          style={styles.exitPill}
          accessibilityLabel={copy.kids.exitHint}
        >
          <Text style={[type.caption, { fontSize: 11 }]}>{copy.kids.exitHint}</Text>
        </Pressable>

        <View style={styles.greetRow}>
          <Pressable onPress={() => setAvatarPicker(true)} accessibilityLabel={copy.photo.heroTitle} hitSlop={6}>
            <Avatar name={kid.name} colour={kid.colour} size={56} avatarUrl={kid.avatarUrl} />
          </Pressable>
          <View style={{ marginLeft: spacing.m, flex: 1 }}>
            <Text style={[type.serifTitle, { fontSize: 28 }]}>{copy.kids.greeting(kid.name)}</Text>
            <Text style={[type.caption, { marginTop: 1 }]}>{copy.kids.greetingSub}</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <KidStat tint={colors.sageTint} icon="clipboard-check" label={copy.kids.statMissions} value={String(missions.length)} sub={copy.kids.statMissionsSub} />
          <KidStat tint={colors.butterTint} icon="sparkles" label={copy.kids.statPoints} value={String(heroPoints)} sub="pts" />
          <KidStat tint={colors.peachTint} icon="clock" label={copy.kids.statStreak} value={String(streak)} sub={copy.kids.statStreakSub} />
        </View>

        <Card style={{ marginTop: spacing.l }}>
          <Text style={type.h2}>{copy.kids.missionsTitle}</Text>
          {missions.length === 0 ? (
            <Text style={[type.caption, { marginTop: spacing.s }]}>{copy.kids.missionsEmpty}</Text>
          ) : (
            missions.map((p) => {
              const cat = categoryByKey(p.categoryKey);
              return (
                <View key={p.id} style={styles.missionRow}>
                  <IconBadge icon={cat.icon} tint={colors.skyTint} size={36} />
                  <View style={{ flex: 1, marginLeft: spacing.m }}>
                    <Text style={type.body}>{p.title ?? cat.name}</Text>
                    <Text style={[type.caption, { fontSize: 12 }]}>⭐ {POINTS_PER_TASK} pts</Text>
                  </View>
                  <Pressable
                    onPress={() => completeMission(p)}
                    style={styles.doneCircle}
                    accessibilityRole="button"
                    accessibilityLabel={copy.kids.missionDone}
                  />
                </View>
              );
            })
          )}
        </Card>

        <Card style={{ marginTop: spacing.l }}>
          <Text style={type.h2}>{copy.kids.badgesTitle}</Text>
          <View style={styles.badgeRow}>
            {badges.map((b) => (
              <View key={b.key} style={[styles.badgeCell, !b.earned && { opacity: 0.35 }]}>
                <IconBadge icon={b.icon} tint={b.tint} size={44} />
                <Text style={[type.caption, { fontSize: 10, textAlign: 'center', marginTop: 2 }]} numberOfLines={2}>
                  {b.earned ? b.title : copy.kids.badgeNext}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.affirm}>
          <Text style={{ fontSize: 24, marginRight: spacing.m }}>💛</Text>
          <View style={{ flex: 1 }}>
            <Text style={type.h2}>{copy.kids.affirmTitle(weekTasks.length)}</Text>
            <Text style={[type.caption, { marginTop: 2 }]}>{copy.kids.affirmSub}</Text>
          </View>
        </View>

        {helping ? (
          <Card style={{ marginTop: spacing.l }}>
            <Text style={[type.h2, { textAlign: 'center' }]}>{copy.kids.helpPrompt}</Text>
            <View style={styles.helpGrid}>
              {KID_CATEGORIES.map((key) => {
                const cat = categoryByKey(key);
                return (
                  <Pressable key={key} onPress={() => logHelp(key)} style={styles.helpCell} accessibilityRole="button">
                    <IconBadge icon={cat.icon} tint={colors.peachTint} size={44} />
                    <Text style={[type.caption, { fontSize: 11, textAlign: 'center', marginTop: 4 }]} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={() => setHelping(false)} style={{ alignItems: 'center', marginTop: spacing.s, minHeight: 44, justifyContent: 'center' }}>
              <Text style={[type.label, { color: colors.charcoalSoft }]}>{copy.photo.cancel}</Text>
            </Pressable>
          </Card>
        ) : (
          <Pressable onPress={() => setHelping(true)} style={styles.helpedBtn} accessibilityRole="button">
            <Icon name="sparkles" size={20} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={[type.h2, { color: '#FFFFFF', marginLeft: spacing.s }]}>{copy.kids.helpedCta}</Text>
          </Pressable>
        )}
        <View style={{ height: insets.bottom + spacing.xxl }} />
      </ScrollView>

      {celebration && (
        <View style={[styles.celebration, { bottom: insets.bottom + 90 }]} pointerEvents="none">
          <Text style={[type.h2, { color: '#FFFFFF' }]}>{celebration}</Text>
        </View>
      )}

      <HeroAvatarPicker
        visible={avatarPicker}
        onPick={(key) => { setAvatarPicker(false); void sync.setHeroAvatar(key, childId); }}
        onClose={() => setAvatarPicker(false)}
      />
    </View>
  );
}

function KidStat({ tint, icon, label, value, sub }: {
  tint: string; icon: 'clipboard-check' | 'sparkles' | 'clock'; label: string; value: string; sub: string;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: tint }]}>
      <IconBadge icon={icon} tint={colors.surface} size={30} />
      <Text style={[type.caption, { marginTop: spacing.xs, textAlign: 'center', fontSize: 11 }]} numberOfLines={1}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[type.caption, { fontSize: 10 }]} numberOfLines={1}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.l, paddingBottom: spacing.l },
  exitPill: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface, borderRadius: radius.chip,
    paddingHorizontal: spacing.m, minHeight: 32, justifyContent: 'center',
    marginBottom: spacing.s, ...shadow.card,
  },
  greetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.l },
  statRow: { flexDirection: 'row', gap: spacing.s },
  stat: {
    flex: 1, borderRadius: radius.card, paddingVertical: spacing.m,
    paddingHorizontal: spacing.xs, alignItems: 'center', ...shadow.card,
  },
  statValue: { fontSize: 22, fontFamily: fonts.extrabold, color: colors.charcoal, marginTop: 2 },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.m },
  doneCircle: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2.5, borderColor: colors.sage, backgroundColor: colors.surface,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.m, gap: spacing.s },
  badgeCell: { width: 64, alignItems: 'center' },
  affirm: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.peachSoft, borderRadius: radius.card,
    padding: spacing.l, marginTop: spacing.l,
  },
  helpedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.coral, borderRadius: radius.button,
    minHeight: 56, marginTop: spacing.l, ...shadow.card,
  },
  helpGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.m, gap: spacing.m },
  helpCell: { width: 76, alignItems: 'center' },
  celebration: {
    position: 'absolute', alignSelf: 'center',
    backgroundColor: colors.sageDeep, borderRadius: radius.button,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.m, ...shadow.card,
  },
});
