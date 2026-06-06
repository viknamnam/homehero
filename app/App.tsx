import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { HouseholdProvider, useHousehold, Task } from './src/store/HouseholdStore';
import { SyncProvider } from './src/lib/sync';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TodayScreen from './src/screens/TodayScreen';
import AddTaskScreen from './src/screens/AddTaskScreen';
import WeekScreen from './src/screens/WeekScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ComingSoonScreen from './src/screens/ComingSoonScreen';
import { Toast } from './src/components/ui';
import { Icon, IconName } from './src/components/icons';
import { colors, spacing, type } from './src/theme/tokens';

// Tab order mirrors the product mockups: Home · Add · Week · Home Value · Thanks.
// Home Value and Thanks are placeholder screens until their Phase 2 feature flags flip
// (they ship TOGETHER — appreciation alongside comparison, per the build plan).
// Settings moved off the tab bar to a gear button (top-right of every main screen).
type Tab = 'today' | 'week' | 'homeValue' | 'thanks' | 'settings';

function Shell() {
  const { state } = useHousehold();
  const [tab, setTab] = useState<Tab>('today');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 1800);
  }, []);

  if (!state.householdName) return <OnboardingScreen />;

  const overlayOpen = adding || editing !== null;
  const closeOverlay = () => { setAdding(false); setEditing(null); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.warmWhite }}>
      {tab === 'today' && (
        <TodayScreen onAdd={() => setAdding(true)} onEdit={(t) => setEditing(t)} onSeeWeek={() => setTab('week')} />
      )}
      {tab === 'week' && <WeekScreen />}
      {tab === 'homeValue' && <ComingSoonScreen kind="homeValue" />}
      {tab === 'thanks' && <ComingSoonScreen kind="thanks" />}
      {tab === 'settings' && <SettingsScreen />}

      {/* Settings gear — top-right on every main screen */}
      {!overlayOpen && (
        <Pressable
          style={styles.gearBtn}
          onPress={() => setTab(tab === 'settings' ? 'today' : 'settings')}
          accessibilityLabel="Settings"
        >
          <Icon name="gear" size={20} color={tab === 'settings' ? colors.charcoal : colors.charcoalSoft} />
        </Pressable>
      )}

      {overlayOpen && (
        <View style={StyleSheet.absoluteFill}>
          <AddTaskScreen
            key={editing?.id ?? 'new'}
            editTask={editing}
            onDone={(msg) => { closeOverlay(); setTab('today'); showToast(msg); }}
          />
          <Pressable style={styles.closeBtn} onPress={closeOverlay} accessibilityLabel="Close">
            <Icon name="x" size={20} color={colors.charcoalSoft} />
          </Pressable>
        </View>
      )}

      {!overlayOpen && (
        <View style={styles.tabBar}>
          <TabButton label="Home" icon="house" active={tab === 'today'} onPress={() => setTab('today')} />
          <AddTabButton onPress={() => setAdding(true)} />
          <TabButton label="Week" icon="calendar" active={tab === 'week'} onPress={() => setTab('week')} />
          <TabButton label="Home Value" icon="dollar" active={tab === 'homeValue'} onPress={() => setTab('homeValue')} />
          <TabButton label="Thanks" icon="heart" active={tab === 'thanks'} onPress={() => setTab('thanks')} />
        </View>
      )}

      <Toast message={toast} visible={toastVisible} />
      <StatusBar style="dark" />
    </View>
  );
}

function TabButton({ label, icon, active, onPress }: {
  label: string; icon: IconName; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tabBtn} accessibilityRole="tab" accessibilityState={{ selected: active }}>
      <Icon name={icon} size={20} color={active ? colors.coralDeep : colors.charcoalSoft} strokeWidth={active ? 2.4 : 2} />
      <Text style={[type.caption, { fontSize: 11, color: active ? colors.coralDeep : colors.charcoalSoft }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function AddTabButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tabBtn} accessibilityRole="button" accessibilityLabel="Add task">
      <View style={styles.addCircle}>
        <Icon name="plus" size={20} color="#FFFFFF" strokeWidth={2.6} />
      </View>
      <Text style={[type.caption, { fontSize: 11, color: colors.charcoalSoft }]}>Add</Text>
    </Pressable>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold,
  });
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.warmWhite }} />;
  }
  return (
    <HouseholdProvider>
      <SyncProvider>
        <Shell />
      </SyncProvider>
    </HouseholdProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 22, paddingTop: spacing.s,
    boxShadow: '0 -3px 12px rgba(46, 53, 72, 0.08)',
    elevation: 8,
  },
  tabBtn: { flex: 1, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  addCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.coralDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  gearBtn: {
    position: 'absolute', top: 44, right: spacing.xl,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(46, 53, 72, 0.08)',
    elevation: 3,
  },
  closeBtn: {
    position: 'absolute', top: 44, right: spacing.xl,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
});
