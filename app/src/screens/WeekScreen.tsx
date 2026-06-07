import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { heroLine } from '../lib/heroVoice';
import { copy, currencySymbol } from '../copy/strings';
import { fmtHM, inWeekOf, startOfWeek, useHousehold } from '../store/HouseholdStore';
import { Card, IconBadge } from '../components/ui';
import { DonutChart } from '../components/DonutChart';
import { Header } from '../components/brand';
import { colors, spacing, type } from '../theme/tokens';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeekScreen() {
  const { state } = useHousehold();
  const cur = currencySymbol[state.currency] ?? '';

  const weekStart = startOfWeek(new Date());
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 3600 * 1000);

  const weekTasks = useMemo(
    () => state.tasks.filter((t) => inWeekOf(t.occurredAt, weekStart)),
    [state.tasks, weekStart],
  );
  const lastWeekMin = useMemo(
    () => state.tasks.filter((t) => inWeekOf(t.occurredAt, lastWeekStart))
      .reduce((s, t) => s + t.durationMin, 0),
    [state.tasks, lastWeekStart],
  );

  const totalMin = weekTasks.reduce((s, t) => s + t.durationMin, 0);
  const totalValue = weekTasks.reduce((s, t) => s + t.valueAmount, 0);

  const deltaMin = totalMin - lastWeekMin;
  const deltaText =
    Math.abs(deltaMin) < 15 ? copy.week.deltaSame
    : deltaMin > 0 ? copy.week.deltaMore(fmtHM(deltaMin))
    : copy.week.deltaLess(fmtHM(-deltaMin));

  const byDay = useMemo(() => {
    const mins = new Array(7).fill(0) as number[];
    weekTasks.forEach((t) => {
      const idx = (new Date(t.occurredAt).getDay() + 6) % 7;
      mins[idx] += t.durationMin;
    });
    return mins;
  }, [weekTasks]);
  const maxDay = Math.max(...byDay, 1);

  const byCategory = useMemo(() => {
    const map = new Map<string, { min: number; value: number }>();
    weekTasks.forEach((t) => {
      const cell = map.get(t.categoryKey) ?? { min: 0, value: 0 };
      cell.min += t.durationMin;
      cell.value += t.valueAmount;
      map.set(t.categoryKey, cell);
    });
    return map;
  }, [weekTasks]);

  // Donut: top 4 categories by time + an "everything else" slice (mockup's Top categories ring)
  const donut = useMemo(() => {
    const rows = CATEGORIES
      .filter((c) => byCategory.has(c.key))
      .map((c) => ({ name: c.name, color: c.colour, min: byCategory.get(c.key)!.min }))
      .sort((a, b) => b.min - a.min);
    const top = rows.slice(0, 4);
    const restMin = rows.slice(4).reduce((s2, r) => s2 + r.min, 0);
    if (restMin > 0) top.push({ name: copy.week.donutOther, color: colors.mist, min: restMin });
    return top;
  }, [byCategory]);

  const mentalLoadCats = CATEGORIES.filter((c) => c.mentalLoad && byCategory.has(c.key));
  const physicalCats = CATEGORIES.filter((c) => !c.mentalLoad && byCategory.has(c.key));
  const maxCatMin = Math.max(...Array.from(byCategory.values()).map((v) => v.min), 1);

  const CategoryBar = ({ catKey, badgeTint }: { catKey: string; badgeTint: string }) => {
    const cat = CATEGORIES.find((c) => c.key === catKey)!;
    const cell = byCategory.get(catKey)!;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s }}>
        <IconBadge icon={cat.icon} tint={badgeTint} size={34} />
        <View style={{ flex: 1, marginLeft: spacing.m }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={type.label}>{cat.name}</Text>
            <Text style={type.caption}>
              {fmtHM(cell.min)}{!state.hideMoney ? `  ·  ${cur}${cell.value}` : ''}
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, {
              width: `${(cell.min / maxCatMin) * 100}%`,
              backgroundColor: cat.colour,
            }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.warmWhite }} contentContainerStyle={styles.container}>
      <Header />
      <Text style={[type.serifTitle, { fontSize: 26 }]}>{copy.week.header}</Text>

      {/* Hero card — hours ♥ value, like the mockup's "This week at home" */}
      <Card style={{ marginTop: spacing.m }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={type.caption}>Total hours</Text>
            <Text style={[type.display, { marginTop: 2 }]}>{fmtHM(totalMin)}</Text>
          </View>
          {!state.hideMoney && (
            <>
              <Text style={{ fontSize: 18, color: colors.coral, marginHorizontal: spacing.m }}>♥</Text>
              <View style={{ flex: 1 }}>
                <Text style={type.caption}>Home value created</Text>
                <Text style={[type.display, { marginTop: 2 }]}>{cur}{totalValue}</Text>
              </View>
            </>
          )}
        </View>
        <Text style={[type.caption, { marginTop: spacing.s }]}>{deltaText}</Text>
      </Card>

      {totalMin === 0 ? (
        <Card style={{ marginTop: spacing.m }}>
          <Text style={[type.body, { color: colors.charcoalSoft }]}>{copy.week.sparseWeek}</Text>
        </Card>
      ) : (
        <>
          <Card style={{ marginTop: spacing.m }}>
            <Text style={type.h2}>{copy.week.donutHeader}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.m }}>
              <DonutChart
                slices={donut.map((d) => ({ value: d.min, color: d.color }))}
                size={116}
                centerTitle={fmtHM(totalMin)}
                centerSub={copy.week.donutCenterSub}
              />
              <View style={{ flex: 1, marginLeft: spacing.l }}>
                {donut.map((d) => (
                  <View key={d.name} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d.color, marginRight: spacing.s }} />
                    <Text style={[type.label, { flex: 1 }]} numberOfLines={1}>{d.name}</Text>
                    <Text style={type.caption}>{Math.round((d.min / Math.max(totalMin, 1)) * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          <Card style={{ marginTop: spacing.m }}>
            <Text style={type.h2}>Hours by day</Text>
            <View style={styles.chartRow}>
              {byDay.map((min, i) => (
                <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={[styles.dayBar, {
                    height: Math.max(4, (min / maxDay) * 110),
                    backgroundColor: min > 0 ? colors.sky : colors.mist,
                  }]} />
                  <Text style={[type.caption, { marginTop: spacing.xs }]}>{DAY_LABELS[i]}</Text>
                </View>
              ))}
            </View>
          </Card>

          {mentalLoadCats.length > 0 && (
            <Card style={{ marginTop: spacing.m, backgroundColor: colors.lavenderTint }}>
              <Text style={type.h2}>{copy.week.mentalLoadHeader}</Text>
              <Text style={type.caption}>{copy.week.mentalLoadSub}</Text>
              {!state.hideMoney && (
                <Text style={[type.caption, { color: colors.sageDeep, marginBottom: spacing.m, marginTop: 2 }]}>
                  {heroLine('invaluable', state.heroStyle)}
                </Text>
              )}
              {state.hideMoney && <View style={{ height: spacing.m }} />}
              {mentalLoadCats.map((c) => (
                <CategoryBar key={c.key} catKey={c.key} badgeTint={colors.surface} />
              ))}
            </Card>
          )}

          {physicalCats.length > 0 && (
            <Card style={{ marginTop: spacing.m }}>
              <Text style={[type.h2, { marginBottom: spacing.m }]}>By category</Text>
              {physicalCats.map((c) => (
                <CategoryBar key={c.key} catKey={c.key} badgeTint={colors.skyTint} />
              ))}
            </Card>
          )}
        </>
      )}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.l, paddingTop: spacing.xl, paddingBottom: spacing.l },
  chartRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    height: 118, marginTop: spacing.m,
  },
  dayBar: { width: 18, borderRadius: 9 },
  barTrack: {
    height: 8, borderRadius: 4, backgroundColor: colors.warmWhite,
    marginTop: spacing.xs, overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: 4 },
});
