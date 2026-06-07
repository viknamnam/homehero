import React, { useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, CategoryKey, categoryByKey } from '../constants/categories';
import { copy, currencySymbol } from '../copy/strings';
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
// Starter missions (founder request): standard jobs every kid can do TODAY,
// no adult assignment needed. Adults add more via Plan the Day; these are the
// always-there floor. Done-state = a matching task logged by this kid today.
const STARTER_CATEGORIES: CategoryKey[] = ['cleaning', 'pets', 'cooking', 'cleaning'];
const POINTS_PER_TASK = 25;
// Kid-friendly category subset: concrete, doable jobs (no Planning/Admin etc.)
const KID_CATEGORIES: CategoryKey[] = [
  'cleaning', 'cooking', 'laundry', 'pets', 'waste', 'homework',
].filter((k) => CATEGORIES.some((c) => c.key === k)) as CategoryKey[];

type Badge = { key: string; icon: ReturnType<typeof categoryByKey>['icon'] | 'sparkles'; tint: string; title: string; earned: boolean; progress: number; need: number };

function planIsForToday(p: PlannedTask, today: Date): boolean {
  const iso = today.toISOString().slice(0, 10);
  if (p.completedDates.includes(iso)) return false;
  if (p.repeat === 'daily') return true;
  if (p.repeat === 'weekly') return p.weekday === today.getDay();
  return isSameDay(p.date, today);
}

// Hold-to-exit with VISIBLE progress: a sage fill sweeps across while held,
// completing at 1.5s. Release early -> resets. (Founder feedback: a silent
// hold felt like nothing was happening.)
function HoldToExit({ label, onComplete, style }: {
  label: string; onComplete: () => void; style?: object;
}) {
  const progress = React.useRef(new Animated.Value(0)).current;
  const begin = () => {
    Animated.timing(progress, { toValue: 1, duration: 1500, useNativeDriver: false }).start(({ finished }) => {
      if (finished) { progress.setValue(0); onComplete(); }
    });
  };
  const cancel = () => { progress.stopAnimation(); progress.setValue(0); };
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <Pressable onPressIn={begin} onPressOut={cancel} style={[holdStyles.pill, style]} accessibilityLabel={label}>
      <Animated.View style={[holdStyles.fill, { width }]} />
      <Text style={[type.caption, { fontSize: 11 }]}>{label}</Text>
    </Pressable>
  );
}

const holdStyles = StyleSheet.create({
  pill: {
    backgroundColor: colors.surface, borderRadius: radius.chip,
    paddingHorizontal: spacing.m, minHeight: 32, justifyContent: 'center',
    overflow: 'hidden', ...shadow.card,
  },
  fill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: colors.sageTint,
  },
});

export default function KidModeScreen({ childId, onExit, onSwitchChild }: {
  childId: string; onExit: () => void; onSwitchChild?: (childId: string) => void;
}) {
  const { state, addTask, completePlan } = useHousehold();
  const sync = useSync();
  const insets = useInsets();
  const [helping, setHelping] = useState(false);
  const [avatarPicker, setAvatarPicker] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const kid = state.members.find((m) => m.id === childId);
  const siblings = state.members.filter((m) => m.role === 'child' && m.id !== childId);
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

  const starters = useMemo(() => copy.kids.starters.map((title, i) => ({
    title,
    categoryKey: STARTER_CATEGORIES[i] ?? ('cleaning' as CategoryKey),
    done: myTasks.some((t) => isSameDay(t.occurredAt, today) && t.title === title),
  })), [myTasks]);
  const startersLeft = starters.filter((st) => !st.done).length;

  const doneToday = myTasks.filter((t) => isSameDay(t.occurredAt, today)).length;
  // Same line all day for everyone (Hero Voice convention: deterministic daily rotation)
  const dayIndex = Math.floor(today.getTime() / 86400000);
  const greetingSub = doneToday > 0
    ? copy.kids.greetingSubActive[dayIndex % copy.kids.greetingSubActive.length]
    : copy.kids.greetingSubFresh[dayIndex % copy.kids.greetingSubFresh.length];

  const heroPoints = weekTasks.length * POINTS_PER_TASK;
  // Pocket money (parent-controlled, OFF by default): whole units only —
  // kid-clear, no decimals. Same weekly window as hero points.
  const pocketOn = !!state.pocketMoneyEnabled;
  const pocketEarned = pocketOn
    ? Math.floor(heroPoints / Math.max(1, state.pocketPointsPerUnit ?? 70))
    : 0;

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

  const badgesFromTasks = (tasks: typeof myTasks): Badge[] => {
    const countFor = (key: CategoryKey) => tasks.filter((t) => t.categoryKey === key).length;
    const defs = [
      { key: 'kitchen', cat: 'cooking' as CategoryKey, title: copy.kids.badgeKitchen, need: 3 },
      { key: 'pet', cat: 'pets' as CategoryKey, title: copy.kids.badgePet, need: 3 },
      { key: 'laundry', cat: 'laundry' as CategoryKey, title: copy.kids.badgeLaundry, need: 3 },
      { key: 'tidy', cat: 'cleaning' as CategoryKey, title: copy.kids.badgeTidy, need: 3 },
    ].filter((b) => CATEGORIES.some((c) => c.key === b.cat));
    const catBadges: Badge[] = defs.map((b) => {
      const cat = categoryByKey(b.cat);
      const n = countFor(b.cat);
      return { key: b.key, icon: cat.icon, tint: colors.sageTint, title: b.title, earned: n >= b.need, progress: Math.min(n, b.need), need: b.need };
    });
    const team = tasks.length;
    return [
      ...catBadges,
      { key: 'team', icon: 'sparkles', tint: colors.butterTint, title: copy.kids.badgeTeam, earned: team >= 10, progress: Math.min(team, 10), need: 10 },
    ];
  };
  const badges: Badge[] = useMemo(() => badgesFromTasks(myTasks), [myTasks]);

  if (!kid) return null;

  const celebrate = (message: string) => {
    setCelebration(message);
    setTimeout(() => setCelebration(null), 2200);
  };

  // Badge unlock detection: if this task crosses a badge threshold, celebrate
  // the BADGE (bigger moment) instead of the points line.
  const badgeKeysFor = (tasks: typeof myTasks): Set<string> =>
    new Set(badgesFromTasks(tasks).filter((b) => b.earned).map((b) => b.key));
  const celebrationFor = (categoryKey: CategoryKey, title?: string): string => {
    const fake = { id: 'x', categoryKey, title, durationMin: KID_TASK_MINUTES, memberId: childId, occurredAt: new Date().toISOString(), valueAmount: 0 } as (typeof myTasks)[number];
    const before = badgeKeysFor(myTasks);
    const after = badgesFromTasks([...myTasks, fake]).filter((b) => b.earned);
    const fresh = after.find((b) => !before.has(b.key));
    return fresh ? copy.kids.badgeLine(fresh.title) : copy.kids.earned(POINTS_PER_TASK);
  };

  const completeMission = (p: PlannedTask) => {
    const msg = celebrationFor(p.categoryKey, p.title);
    completePlan(p.id);
    addTask({ categoryKey: p.categoryKey, title: p.title, durationMin: KID_TASK_MINUTES, memberId: childId });
    celebrate(msg);
  };

  const logHelp = (categoryKey: CategoryKey) => {
    const msg = celebrationFor(categoryKey);
    addTask({ categoryKey, durationMin: KID_TASK_MINUTES, memberId: childId });
    setHelping(false);
    celebrate(msg);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.warmWhite }]}>
      {FLAGS.doodles && <DoodleBackground density="playful" />}
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.l }]}>
        {/* Hold-to-exit: quick taps do nothing — a light adult gate */}
        <HoldToExit label={copy.kids.exitHint} onComplete={onExit} style={{ alignSelf: 'flex-end', marginBottom: spacing.s }} />

        <View style={styles.greetRow}>
          <Pressable onPress={() => setAvatarPicker(true)} accessibilityLabel={copy.photo.heroTitle} hitSlop={6}>
            <Avatar name={kid.name} colour={kid.colour} size={56} avatarUrl={kid.avatarUrl} memberId={kid.id} />
          </Pressable>
          <Pressable
            style={{ marginLeft: spacing.m, flex: 1 }}
            onPress={siblings.length > 0 && onSwitchChild ? () => setSwitcherOpen(true) : undefined}
            accessibilityRole={siblings.length > 0 ? 'button' : undefined}
            accessibilityLabel={siblings.length > 0 ? copy.kids.switchTitle : undefined}
          >
            <Text style={[type.serifTitle, { fontSize: 28 }]}>
              {copy.kids.greeting(kid.name)}
              {siblings.length > 0 && onSwitchChild ? <Text style={{ fontSize: 16, color: colors.charcoalSoft }}>  ▾</Text> : null}
            </Text>
            <Text style={[type.caption, { marginTop: 1 }]}>{greetingSub}</Text>
          </Pressable>
        </View>

        <View style={styles.statRow}>
          <KidStat tint={colors.sageTint} icon="clipboard-check" label={copy.kids.statMissions} value={String(missions.length + startersLeft)} sub={copy.kids.statMissionsSub} />
          <KidStat tint={colors.butterTint} icon="sparkles" label={copy.kids.statPoints} value={String(heroPoints)} sub="pts" />
          <KidStat tint={colors.peachTint} icon="clock" label={copy.kids.statStreak} value={String(streak)} sub={copy.kids.statStreakSub} />
          {pocketOn && (
            <KidStat tint={colors.skyTint} icon="coins" label={copy.kids.statPocket} value={`${currencySymbol[state.currency] ?? ''}${pocketEarned}`} sub={copy.kids.statPocketSub} />
          )}
        </View>

        <Card style={{ marginTop: spacing.l }}>
          <Text style={type.h2}>{copy.kids.missionsTitle}</Text>
          {missions.length === 0 && startersLeft === 0 && (
            <Text style={[type.body, { marginTop: spacing.s, color: colors.sageDeep }]}>
              {copy.kids.allDone[Math.floor(today.getTime() / 86400000) % copy.kids.allDone.length]}
            </Text>
          )}
          {missions.map((p) => {
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
            })}
          {starters.map((st) => {
            const cat = categoryByKey(st.categoryKey);
            return (
              <View key={st.title} style={[styles.missionRow, st.done && { opacity: 0.45 }]}>
                <IconBadge icon={cat.icon} tint={colors.peachTint} size={36} />
                <View style={{ flex: 1, marginLeft: spacing.m }}>
                  <Text style={type.body}>{st.title}</Text>
                  <Text style={[type.caption, { fontSize: 12 }]}>⭐ {POINTS_PER_TASK} pts</Text>
                </View>
                {st.done ? (
                  <View style={[styles.doneCircle, { backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16 }}>✓</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => { const msg = celebrationFor(st.categoryKey, st.title); addTask({ categoryKey: st.categoryKey, title: st.title, durationMin: KID_TASK_MINUTES, memberId: childId }); celebrate(msg); }}
                    style={styles.doneCircle}
                    accessibilityRole="button"
                    accessibilityLabel={copy.kids.missionDone}
                  />
                )}
              </View>
            );
          })}
        </Card>

        <Card style={{ marginTop: spacing.l }}>
          <Text style={type.h2}>{copy.kids.badgesTitle}</Text>
          <View style={styles.badgeRow}>
            {badges.map((b) => (
              <View key={b.key} style={[styles.badgeCell, !b.earned && { opacity: 0.45 }]}>
                <IconBadge icon={b.icon} tint={b.tint} size={44} />
                <Text style={[type.caption, { fontSize: 10, textAlign: 'center', marginTop: 2 }]} numberOfLines={2}>
                  {b.title}
                </Text>
                {!b.earned && (
                  <Text style={[type.caption, { fontSize: 9, color: colors.sageDeep }]}>
                    {copy.kids.badgeProgress(b.progress, b.need)}
                  </Text>
                )}
              </View>
            ))}
            {/* Mystery slot — more badges arrive with Family Quests (Phase 4) */}
            <View style={[styles.badgeCell]}>
              <View style={styles.mysteryBadge}><Text style={[type.h2, { color: colors.charcoalSoft }]}>?</Text></View>
              <Text style={[type.caption, { fontSize: 10, textAlign: 'center', marginTop: 2 }]}>{copy.kids.badgeNext}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.affirm}>
          <Text style={{ fontSize: 24, marginRight: spacing.m }}>💛</Text>
          <View style={{ flex: 1 }}>
            <Text style={type.h2}>{copy.kids.affirmTitle(weekTasks.length)}</Text>
            <Text style={[type.caption, { marginTop: 2 }]}>
              {[3, 7, 14, 30].includes(streak) ? copy.kids.streakLine(streak) : copy.kids.affirmSub}
            </Text>
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

      {switcherOpen && (
        <Pressable style={kidSwitch.backdrop} onPress={() => setSwitcherOpen(false)}>
          <Pressable style={kidSwitch.sheet} onPress={() => {}}>
            <Text style={[type.h2, { textAlign: 'center' }]}>{copy.kids.switchTitle}</Text>
            {siblings.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => { setSwitcherOpen(false); onSwitchChild?.(m.id); }}
                style={kidSwitch.row}
                accessibilityRole="button"
                accessibilityLabel={m.name}
              >
                <Avatar name={m.name} colour={m.colour} size={40} avatarUrl={m.avatarUrl} memberId={m.id} />
                <Text style={[type.body, { marginLeft: spacing.m, flex: 1 }]}>{m.name}</Text>
                <Text style={[type.label, { color: colors.sageDeep }]}>→</Text>
              </Pressable>
            ))}
            {/* Grown-up exit lives here too — but stays HOLD-gated, same as the pill */}
            <HoldToExit
              label={copy.kids.exitHint}
              onComplete={() => { setSwitcherOpen(false); onExit(); }}
              style={{ marginTop: spacing.l, alignItems: 'center' }}
            />
          </Pressable>
        </Pressable>
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
  tint: string; icon: 'clipboard-check' | 'sparkles' | 'clock' | 'coins'; label: string; value: string; sub: string;
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

const kidSwitch = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(46, 53, 72, 0.35)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.warmWhite,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: spacing.xl, paddingHorizontal: spacing.l, paddingBottom: spacing.xl,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', marginTop: spacing.m, minHeight: 52,
    backgroundColor: colors.surface, borderRadius: radius.card,
    paddingHorizontal: spacing.m, ...shadow.card,
  },
  grownUpRow: { marginTop: spacing.l, minHeight: 44, justifyContent: 'center' },
});

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
  mysteryBadge: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: colors.mist, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
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
