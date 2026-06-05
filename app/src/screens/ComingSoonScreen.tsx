import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { copy } from '../copy/strings';
import { Card, IconBadge } from '../components/ui';
import { Header } from '../components/brand';
import { colors, spacing, type } from '../theme/tokens';

export default function ComingSoonScreen({ kind }: { kind: 'homeValue' | 'thanks' }) {
  const title = kind === 'homeValue' ? copy.comingSoon.homeValueTitle : copy.comingSoon.thanksTitle;
  const body = kind === 'homeValue' ? copy.comingSoon.homeValueBody : copy.comingSoon.thanksBody;
  const icon = kind === 'homeValue' ? '💲' : '💛';
  const tint = kind === 'homeValue' ? colors.butterTint : colors.blushTint;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.warmWhite }} contentContainerStyle={styles.container}>
      <Header />
      <Card style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
        <IconBadge icon={icon} tint={tint} size={64} />
        <Text style={[type.serifTitle, { marginTop: spacing.l }]}>{title}</Text>
        <Text style={[type.body, { color: colors.charcoalSoft, textAlign: 'center', marginTop: spacing.m }]}>
          {body}
        </Text>
        <View style={styles.phasePill}>
          <Text style={[type.label, { color: colors.sageDeep }]}>{copy.comingSoon.phaseTag}</Text>
        </View>
        <Text style={[type.caption, { textAlign: 'center', marginTop: spacing.l }]}>
          {copy.comingSoon.togetherNote}
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.l, paddingTop: spacing.xl },
  phasePill: {
    backgroundColor: colors.sageTint,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: 20,
    marginTop: spacing.l,
  },
});
