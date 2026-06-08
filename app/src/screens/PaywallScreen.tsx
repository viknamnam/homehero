import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { copy } from '../copy/strings';
import { colors, spacing, type, radius } from '../theme/tokens';
import { Card, PrimaryButton, BusyButton } from '../components/ui';
import { Header } from '../components/brand';
import { useInsets } from '../lib/insets';
import { buyPremium, getPremiumOffering, restorePurchases, purchasesAvailable } from '../lib/purchases';

// Paywall (#50). Shown only when a household's trial has lapsed AND the paywall
// flag is on. Tone follows §13: the app never holds data hostage — export is
// always one tap away, and the message is warm, not coercive.

export default function PaywallScreen({ onExport, onPurchased }: {
  onExport: () => void; onPurchased: () => void;
}) {
  const insets = useInsets();
  const [price, setPrice] = useState<string | null>(null);

  useEffect(() => {
    if (purchasesAvailable()) getPremiumOffering().then((o) => o && setPrice(o.priceString));
  }, []);

  const subscribe = async () => { if (await buyPremium()) onPurchased(); };
  const restore = async () => { if (await restorePurchases()) onPurchased(); };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{ padding: spacing.l, paddingBottom: insets.bottom + spacing.xxl }}
    >
      <Header />
      <Text style={[type.serifTitle, { fontSize: 26, marginTop: spacing.l }]}>{copy.paywall.title}</Text>
      <Text style={[type.body, { marginTop: spacing.s, color: colors.charcoalSoft }]}>{copy.paywall.sub}</Text>

      <Card style={{ marginTop: spacing.l }}>
        {copy.paywall.points.map((pt) => (
          <View key={pt} style={{ flexDirection: 'row', marginBottom: spacing.s }}>
            <Text style={{ marginRight: spacing.s }}>💛</Text>
            <Text style={[type.body, { flex: 1 }]}>{pt}</Text>
          </View>
        ))}
        <Text style={[type.caption, { marginTop: spacing.s }]}>{copy.paywall.householdNote}</Text>
      </Card>

      <View style={{ marginTop: spacing.l }}>
        <BusyButton
          label={price ? copy.paywall.subscribeWithPrice(price) : copy.paywall.subscribe}
          busyLabel={copy.paywall.subscribing}
          onPress={subscribe}
        />
      </View>
      <Pressable onPress={restore} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: spacing.s }}>
        <Text style={[type.label, { color: colors.coralDeep }]}>{copy.paywall.restore}</Text>
      </Pressable>

      {/* §13: data is never held hostage */}
      <Card style={{ marginTop: spacing.l, backgroundColor: colors.sageTint }}>
        <Text style={type.h2}>{copy.paywall.exportTitle}</Text>
        <Text style={[type.caption, { marginTop: 2 }]}>{copy.paywall.exportSub}</Text>
        <View style={{ marginTop: spacing.m }}>
          <Pressable onPress={onExport} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: colors.sage, borderRadius: radius.button }}>
            <Text style={[type.label, { color: colors.sageDeep }]}>{copy.paywall.exportCta}</Text>
          </Pressable>
        </View>
      </Card>
    </ScrollView>
  );
}
