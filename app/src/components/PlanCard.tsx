import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CATEGORIES, CategoryKey, categoryByKey } from '../constants/categories';
import { copy } from '../copy/strings';
import { PlannedTask, useHousehold } from '../store/HouseholdStore';
import { Avatar, Card, Chip, IconBadge } from '../components/ui';
import { colors, spacing, type } from '../theme/tokens';

const todayKey = () => new Date().toISOString().slice(0, 10);

function dueToday(p: PlannedTask): boolean {
  const t = todayKey();
  if (p.completedDates.includes(t)) return false;
  if (p.repeat === 'daily') return true;
  if (p.repeat === 'weekly') return p.weekday === new Date().getDay();
  return p.date === t;
}

// Plan the Day v1 (gaps #13): a shared plan, not a dispatch board. Anyone adds,
// items can be assigned OR open; open items invite "I'll do it". Done routes
// through Add Task so logged time stays honest.
export function PlanCard({ onLogPlan }: {
  onLogPlan: (plan: PlannedTask, memberId: string) => void;
}) {
  const { state, addPlan, deletePlan, claimPlan } = useHousehold();
  const [composerOpen, setComposerOpen] = useState(false);
  const [catKey, setCatKey] = useState<CategoryKey | null>(null);
  const [title, setTitle] = useState('');
  const [who, setWho] = useState<string | null>(null); // null = anyone
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');

  const due = useMemo(() => state.plans.filter(dueToday), [state.plans]);
  const member = (id?: string | null) => state.members.find((m) => m.id === id);

  const add = () => {
    if (!catKey) return;
    addPlan({ categoryKey: catKey, title: title || undefined, assignedMemberId: who, repeat });
    setCatKey(null); setTitle(''); setWho(null); setRepeat('none'); setComposerOpen(false);
  };

  return (
    <Card style={{ marginTop: spacing.s }}>
      <Text style={type.h2}>{copy.plan.title}</Text>

      {due.length === 0 && !composerOpen && (
        <Text style={[type.caption, { marginTop: spacing.xs }]}>{copy.plan.empty}</Text>
      )}

      {due.map((p) => {
        const cat = categoryByKey(p.categoryKey);
        const owner = member(p.claimedDate === todayKey() ? p.claimedBy : p.assignedMemberId);
        const mine = owner?.id === state.meId;
        return (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.m }}>
            <IconBadge icon={cat.icon} tint={colors.skyTint} size={32} />
            <View style={{ flex: 1, marginLeft: spacing.m }}>
              <Text style={type.body} numberOfLines={1}>{p.title ?? cat.name}</Text>
              <Text style={type.caption}>
                {owner ? copy.plan.takenBy(owner.name) : copy.plan.open}
                {p.repeat !== 'none' ? ` · ${copy.plan.repeatBadge[p.repeat]}` : ''}
              </Text>
            </View>
            {owner ? (
              <Pressable
                onPress={() => onLogPlan(p, owner.id)}
                style={{ paddingHorizontal: spacing.m, paddingVertical: spacing.s }}
                accessibilityRole="button"
              >
                <Text style={[type.label, { color: mine ? colors.coralDeep : colors.charcoalSoft }]}>
                  {copy.plan.doneCta}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => claimPlan(p.id)}
                style={{ paddingHorizontal: spacing.m, paddingVertical: spacing.s }}
                accessibilityRole="button"
              >
                <Text style={[type.label, { color: colors.sageDeep }]}>{copy.plan.claimCta}</Text>
              </Pressable>
            )}
            <Pressable onPress={() => deletePlan(p.id)} hitSlop={10} accessibilityLabel="Remove plan">
              <Text style={[type.caption, { marginLeft: spacing.s }]}>✕</Text>
            </Pressable>
          </View>
        );
      })}

      {composerOpen ? (
        <View style={{ marginTop: spacing.m }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((c) => (
              <Chip key={c.key} label={c.name} iconName={c.icon}
                selected={catKey === c.key} onPress={() => setCatKey(c.key)} />
            ))}
          </ScrollView>
          <TextInput
            style={{
              backgroundColor: colors.warmWhite, borderRadius: 12, borderWidth: 1,
              borderColor: colors.mist, padding: spacing.m, marginTop: spacing.s,
              fontSize: 16, color: colors.charcoal,
            }}
            placeholder={copy.plan.titleHint}
            placeholderTextColor={colors.charcoalSoft}
            value={title} onChangeText={setTitle}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.s, flexWrap: 'wrap' }}>
            <Chip label={copy.plan.anyone} selected={who === null} onPress={() => setWho(null)} />
            {state.members.map((m) => (
              <Pressable key={m.id} onPress={() => setWho(m.id)} style={{ marginRight: spacing.m }}>
                <Avatar name={m.name} colour={m.colour} size={34} selected={who === m.id} avatarUrl={m.avatarUrl} memberId={m.id} />
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', marginTop: spacing.s, flexWrap: 'wrap' }}>
            {(['none', 'daily', 'weekly'] as const).map((r) => (
              <Chip key={r} label={copy.plan.repeatLabels[r]} selected={repeat === r} onPress={() => setRepeat(r)} />
            ))}
          </View>
          <Pressable onPress={add} disabled={!catKey} style={{ marginTop: spacing.m }} accessibilityRole="button">
            <Text style={[type.label, { color: catKey ? colors.coralDeep : colors.charcoalSoft }]}>
              {copy.plan.addCta}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setComposerOpen(true)} style={{ marginTop: spacing.m }} accessibilityRole="button">
          <Text style={[type.label, { color: colors.sageDeep }]}>{copy.plan.composerCta}</Text>
        </Pressable>
      )}
    </Card>
  );
}
