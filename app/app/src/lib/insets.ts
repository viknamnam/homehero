import { Dimensions, Platform, StatusBar } from 'react-native';

// Safe-area insets without the third-party native module (removed after the
// RNCSafeAreaProvider saga). Android bottom: measure the system navigation bar
// as the screen-vs-window height delta (≈48px for 3-button navs); floor of 20px
// covers gesture pills in edge-to-edge mode where the delta reads 0.
// (The native lib can return at the next EAS rebuild if pixel-perfection is needed.)
export function useInsets() {
  if (Platform.OS !== 'android') return { top: 47, bottom: 28 };
  const sb = StatusBar.currentHeight ?? 24;
  const navDelta = Math.round(
    Dimensions.get('screen').height - Dimensions.get('window').height - sb,
  );
  return { top: sb, bottom: Math.max(navDelta, 20) };
}
