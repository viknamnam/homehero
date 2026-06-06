import { Platform, StatusBar } from 'react-native';

// Safe-area insets without the third-party native module: the status bar height
// on Android, sensible constants on iOS. Keeps the dev build dependency-light and
// avoids a native rebuild every time. (Swapped in after the RNCSafeAreaProvider saga.)
export function useInsets() {
  return {
    top: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 47,
    bottom: Platform.OS === 'ios' ? 24 : 8,
  };
}
