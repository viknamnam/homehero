import { Platform } from 'react-native';

// RevenueCat shell (#50). react-native-purchases is NATIVE (⚠️ needs the next
// dev build). Same guarded-require pattern as notifications/speech: on clients
// built before the rebuild, the module is absent and every call is a safe
// no-op, so the paywall flag can be flipped on only once the rebuild ships.
//
// Setup when live: create a RevenueCat project, add the public SDK keys below
// as env (EXPO_PUBLIC_RC_IOS / EXPO_PUBLIC_RC_ANDROID), define one
// "premium" entitlement + a per-household subscription product, and point a
// RevenueCat webhook at a Supabase function that sets households.premium_until.

let Purchases: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Purchases = require('react-native-purchases').default;
} catch {
  Purchases = null;
}

export function purchasesAvailable(): boolean {
  return Purchases != null;
}

export async function initPurchases(appUserId?: string): Promise<void> {
  if (!purchasesAvailable()) return;
  const key = Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_RC_IOS
    : process.env.EXPO_PUBLIC_RC_ANDROID;
  if (!key) return;
  try {
    Purchases.configure({ apiKey: key, appUserID: appUserId });
  } catch {}
}

export type Offering = { id: string; priceString: string; title: string } | null;

export async function getPremiumOffering(): Promise<Offering> {
  if (!purchasesAvailable()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings?.current?.availablePackages?.[0];
    if (!pkg) return null;
    return { id: pkg.identifier, priceString: pkg.product.priceString, title: pkg.product.title };
  } catch {
    return null;
  }
}

/** Returns true if the purchase completed and the premium entitlement is active. */
export async function buyPremium(): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings?.current?.availablePackages?.[0];
    if (!pkg) return false;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return !!customerInfo?.entitlements?.active?.premium;
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  try {
    const info = await Purchases.restorePurchases();
    return !!info?.entitlements?.active?.premium;
  } catch {
    return false;
  }
}
