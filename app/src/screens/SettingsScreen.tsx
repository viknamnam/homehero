import React, { useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { copy } from '../copy/strings';
import { useHousehold } from '../store/HouseholdStore';
import { Avatar, Card, Chip } from '../components/ui';
import { Header } from '../components/brand';
import { colors, spacing, type } from '../theme/tokens';

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP'];

export default function SettingsScreen() {
  const { state, setHideMoney, setCurrency, setRate, reset } = useHousehold();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const logTimes = state.logDurationsMs;
  const median = logTimes.length
    ? [...logTimes].sort((a, b) => a - b)[Math.floor(logTimes.length / 2)]
    : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.warmWhite }} contentContainerStyle={styles.container}>
      <Header />
      <Text style={type.serifTitle}>{state.householdName}</Text>

      <Card style={{ marginTop: spacing.l }}>
        <Text style={type.h2}>{copy.settings.membersTitle}</Text>
        <View style={{ flexDirection: 'row', marginTop: spacing.m }}>
          {state.members.map((m) => (
            <View key={m.id} style={{ alignItems: 'center', marginRight: spacing.l }}>
              <Avatar name={m.name} colour={m.colour} size={48} />
              <Text style={[type.caption, { marginTop: spacing.xs }]}>{m.name}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.l }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.m }}>
            <Text style={type.h2}>{copy.settings.hideMoneyLabel}</Text>
            <Text style={[type.caption, { marginTop: spacing.xs }]}>{copy.settings.hideMoneySub}</Text>
          </View>
          <Switch
            value={state.hideMoney}
            onValueChange={setHideMoney}
            trackColor={{ true: colors.sage, false: colors.mist }}
          />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.l }}>
        <Text style={type.h2}>{copy.settings.currencyTitle}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.m }}>
          {CURRENCIES.map((c) => (
            <Chip key={c} label={c} selected={state.currency === c} onPress={() => setCurrency(c)} />
          ))}
        </View>
      </Card>

      {!state.hideMoney && (
        <Card style={{ marginTop: spacing.l }}>
          <Text style={type.h2}>{copy.settings.ratesTitle}</Text>
          <Text style={[type.caption, { marginBottom: spacing.m }]}>{copy.settings.ratesSub}</Text>
          {CATEGORIES.map((c) => (
            <View key={c.key} style={styles.rateRow}>
              <Text style={[type.label, { flex: 1 }]}>{c.icon} {c.name}</Text>
              <TextInput
                style={styles.rateInput}
                keyboardType="numeric"
                value={String(state.rates[c.key] ?? '')}
                onChangeText={(v) => {
                  const n = parseFloat(v);
                  if (!isNaN(n) && n >= 0) setRate(c.key, n);
                }}
              />
              <Text style={type.caption}>/h</Text>
            </View>
          ))}
        </Card>
      )}

      <Card style={{ marginTop: spacing.l }}>
        <Text style={type.h2}>{copy.settings.metricsTitle}</Text>
        <Text style={[type.caption, { marginTop: spacing.xs }]}>
          {median !== null
            ? `Median time to log (last ${logTimes.length}): ${(median / 1000).toFixed(1)}s — target <10s`
            : 'Log a task to start measuring.'}
        </Text>
      </Card>

      <Pressable
        style={{ marginTop: spacing.xl, alignItems: 'center' }}
        onPress={() => {
          if (confirmingReset) { reset(); setConfirmingReset(false); }
          else setConfirmingReset(true);
        }}
      >
        <Text style={[type.label, { color: colors.coralDeep }]}>
          {confirmingReset ? copy.settings.resetConfirm : copy.settings.resetCta}
        </Text>
      </Pressable>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, paddingTop: spacing.xxl },
  rateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s },
  rateInput: {
    backgroundColor: colors.warmWhite, borderRadius: 8, borderWidth: 1,
    borderColor: colors.mist, paddingHorizontal: spacing.m, paddingVertical: spacing.xs,
    width: 70, textAlign: 'right', marginRight: spacing.xs,
    fontSize: 16, color: colors.charcoal,
  },
});
