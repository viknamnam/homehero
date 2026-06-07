import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, CategoryKey, categoryByKey } from '../constants/categories';
import { heroLine } from '../lib/heroVoice';
import { copy, currencySymbol } from '../copy/strings';
import { fmtHM, inWeekOf, startOfWeek, useHousehold } from '../store/HouseholdStore';
import { Avatar, Card, PrimaryButton } from '../components/ui';
import { DonutChart } from '../components/DonutChart';
import { Header } from '../components/brand';
import { colors, spacing, type } from '../theme/tokens';

// HOME VALUE — a planning view, never a scoreboard (build plan §Family Balance):
// appreciation appears ABOVE the numbers, contribution is framed as teamwork,
// there is no "lowest contributor", and every suggestion is observation + option.
export default function HomeValueScreen({ onPlan }: { onPlan?: () => void }) {
  const { state } = useHousehold();
  const cur = currencySymbol[state.currency] ?? '';

  const wk = useMemo(() => {
    const ws = startOfWeek(new Date());
    const tasks = state.tasks.filter((t) => inWeekOf(t.occurredAt, ws));
    const totalMin = tasks.reduce((s, t) => s + t.durationMin, 0);

    const byMember = state.members.map((m) => {
      const mine = tasks.filter((t) => t.memberId === m.id);
      return {
        member: m,
        min: mine.reduce((s, t) => s + t.durationMin, 0),
        value: mine.reduce((s, t) => s + t.valueAmount, 0),
      };
    }).sort((a, b) => b.min - a.min);

    const byCat = new Map<CategoryKey, number>();
    tasks.forEach((t) => byCat.set(t.categoryKey, (byCat.get(t.categoryKey) ?? 0) + t.durationMin));
    const topCat = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];

    return { totalMin, totalValue: tasks.reduce((s, t) => s + t.valueAmount, 0), byMember, topCat, count: tasks.length };
  }, [state.tasks, state.members]);

  if (wk.count === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.warmWhite }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Header />
          <Text style={[type.serifTitle, { fontSize: 26 }]}>{copy.homeValue.title}</Text>
          <Card style={{ marginTop: spacing.l, alignItems: 'center' }}>
            <Text style={[type.body, { textAlign: 'center', color: colors.charcoalSoft }]}>
              {copy.homeValue.empty}
            </Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  // Gentle, non-blaming rebalancing built from the heaviest category (spec §9)
  const suggestion = wk.topCat
    ? copy.homeValue.rebalance(categoryByKey(wk.topCat[0]).name)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.warmWhite }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header />
        <Text style={[type.serifTitle, { fontSize: 26 }]}>{copy.homeValue.title}</Text>

        {/* Appreciation FIRST — before any numbers */}
        <Card style={{ marginTop: spacing.m, backgroundColor: colors.peachTint }}>
          <Text style={[type.h2, { color: colors.charcoal }]}>{heroLine('teamBanner', state.heroStyle)}</Text>
          <Text style={[type.body, { marginTop: spacing.xs }]}>
            {copy.homeValue.teamBody(fmtHM(wk.totalMin), state.members.length)}
          </Text>
        </Card>

        {/* Contribution by time — teamwork framing, share bars, no ranking language */}
        <Card style={{ marginTop: spacing.m }}>
          <Text style={type.h2}>{copy.homeValue.sharingTitle}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.m }}>
            <DonutChart
              slices={wk.byMember.map((b) => ({ value: b.min, color: b.member.colour }))}
              size={108}
              centerTitle={fmtHM(wk.totalMin)}
              centerSub={copy.homeValue.donutSub}
            />
            <View style={{ flex: 1, marginLeft: spacing.l }}>
              {wk.byMember.map((b) => {
                const pct = Math.round((b.min / Math.max(wk.totalMin, 1)) * 100);
                return (
                  <View key={b.member.id} style={{ marginBottom: spacing.s }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar name={b.member.name} colour={b.member.colour} size={24} avatarUrl={b.member.avatarUrl} />
                      <Text style={[type.label, { flex: 1, marginLeft: spacing.s }]} numberOfLines={1}>{b.member.name}</Text>
                      <Text style={type.caption}>{fmtHM(b.min)}</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: b.member.colour }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Value by member — with the Invaluable reminder so it never reads transactional */}
        {!state.hideMoney && (
          <Card style={{ marginTop: spacing.m }}>
            <Text style={type.h2}>{copy.homeValue.valueTitle}</Text>
            {wk.byMember.map((b) => (
              <View key={b.member.id} style={styles.valueRow}>
                <Avatar name={b.member.name} colour={b.member.colour} size={28} avatarUrl={b.member.avatarUrl} />
                <Text style={[type.body, { flex: 1, marginLeft: spacing.s }]}>{b.member.name}</Text>
                <Text style={[type.body, { fontWeight: '700' }]}>{cur}{b.value}</Text>
              </View>
            ))}
            <Text style={[type.caption, { color: colors.sageDeep, marginTop: spacing.s }]}>
              {heroLine('invaluable', state.heroStyle)}
            </Text>
          </Card>
        )}

        {/* One gentle, practical suggestion — observation + option, never blame */}
        {suggestion && (
          <Card style={{ marginTop: spacing.m, backgroundColor: colors.skyTint }}>
            <Text style={type.h2}>{copy.homeValue.planTitle}</Text>
            <Text style={[type.body, { marginTop: spacing.xs }]}>{suggestion}</Text>
          </Card>
        )}

        <View style={{ marginTop: spacing.l }}>
          <PrimaryButton label={copy.homeValue.planCta} onPress={() => onPlan?.()} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.l, paddingTop: spacing.xl, paddingBottom: 110 },
  track: { height: 7, borderRadius: 4, backgroundColor: colors.mist, marginTop: 5, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.s },
});
