import React, { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { HouseholdProvider, useHousehold, Task } from './src/store/HouseholdStore';
import { SyncProvider } from './src/lib/sync';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TodayScreen from './src/screens/TodayScreen';
import AddTaskScreen, { PlanPrefill } from './src/screens/AddTaskScreen';
import QuickLogScreen from './src/screens/QuickLogScreen';
import WeekScreen from './src/screens/WeekScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ComingSoonScreen from './src/screens/ComingSoonScreen';
import HomeValueScreen from './src/screens/HomeValueScreen';
import ThanksScreen from './src/screens/ThanksScreen';
import KidModeScreen from './src/screens/KidModeScreen';
import { FLAGS } from './src/constants/flags';
import { Toast } from './src/components/ui';
import DoodleBackground from './src/components/DoodleBackground';
import { useInsets } from './src/lib/insets';
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
  const [planPrefill, setPlanPrefill] = useState<PlanPrefill | null>(null);
  const [quickLogging, setQuickLogging] = useState(false);
  const [kidModeChildId, setKidModeChildId] = useState<string | null>(null);
  // Persist Kids Mode across app restarts: a child handed the phone can't
  // escape to the adult view by force-closing the app (security), and the
  // kid's world simply resumes where it was.
  const KID_KEY = 'heronest.kidmode';
  useEffect(() => {
    AsyncStorage.getItem(KID_KEY).then((v: string | null) => { if (v) setKidModeChildId(v); }).catch(() => {});
  }, []);
  const enterKidMode = (id: string) => { setKidModeChildId(id); AsyncStorage.setItem(KID_KEY, id).catch(() => {}); };
  const exitKidMode = () => { setKidModeChildId(null); AsyncStorage.removeItem(KID_KEY).catch(() => {}); };
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

  const insets = useInsets();
  if (!state.householdName) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.warmWhite }}>
        {FLAGS.doodles && <DoodleBackground />}
        <OnboardingScreen />
      </View>
    );
  }

  const overlayOpen = adding || editing !== null;
  const closeOverlay = () => { setAdding(false); setEditing(null); setPlanPrefill(null); setQuickLogging(false); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.warmWhite }}>
      {/* Decorative pastel doodles sit on the canvas, behind every screen.
          Screens paint transparent backgrounds so the shared layer shows through. */}
      {FLAGS.doodles && <DoodleBackground />}
      {tab === 'today' && (
        <TodayScreen
          onOpenKidMode={FLAGS.kidsMode ? enterKidMode : undefined}
          onAdd={() => setAdding(true)}
          onEdit={(t) => setEditing(t)}
          onSeeWeek={() => setTab('week')}
          onLogPlan={(plan, memberId) => {
            setPlanPrefill({ planId: plan.id, categoryKey: plan.categoryKey, title: plan.title, memberId });
            setAdding(true);
          }}
        />
      )}
      {tab === 'week' && <WeekScreen />}
      {tab === 'homeValue' && (FLAGS.homeValue ? <HomeValueScreen onPlan={() => setTab('today')} /> : <ComingSoonScreen kind="homeValue" />)}
      {tab === 'thanks' && (FLAGS.thanks ? <ThanksScreen onToast={showToast} /> : <ComingSoonScreen kind="thanks" />)}
      {tab === 'settings' && <SettingsScreen onOpenKidMode={FLAGS.kidsMode ? enterKidMode : undefined} />}

      {/* Settings gear — top-right on every main screen */}
      {!overlayOpen && (
        <Pressable
          style={[styles.gearBtn, { top: insets.top + spacing.xs }]}
          onPress={() => setTab(tab === 'settings' ? 'today' : 'settings')}
          accessibilityLabel="Settings"
        >
          <Icon name="gear" size={20} color={tab === 'settings' ? colors.charcoal : colors.charcoalSoft} />
        </Pressable>
      )}

      {overlayOpen && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.warmWhite }]}>
          {FLAGS.doodles && <DoodleBackground />}
          {quickLogging ? (
            <QuickLogScreen onDone={(msg) => { closeOverlay(); setTab('today'); showToast(msg); }} />
          ) : (
            <AddTaskScreen
              key={editing?.id ?? planPrefill?.planId ?? 'new'}
              editTask={editing}
              prefill={planPrefill}
              onQuickLog={() => setQuickLogging(true)}
              onDone={(msg) => { closeOverlay(); setPlanPrefill(null); setTab('today'); showToast(msg); }}
            />
          )}
          <Pressable style={styles.closeBtn} onPress={closeOverlay} accessibilityLabel="Close">
            <Icon name="x" size={20} color={colors.charcoalSoft} />
          </Pressable>
        </View>
      )}

      {!overlayOpen && (
        <View style={[styles.tabBar, { paddingBottom: insets.bottom + spacing.s }]}>
          <TabButton label="Home" icon="house" active={tab === 'today'} onPress={() => setTab('today')} />
          <AddTabButton onPress={() => setAdding(true)} />
          <TabButton label="Week" icon="calendar" active={tab === 'week'} onPress={() => setTab('week')} />
          <TabButton label="Home Value" icon="dollar" active={tab === 'homeValue'} onPress={() => setTab('homeValue')} />
          <TabButton label="Thanks" icon="heart" active={tab === 'thanks'} onPress={() => setTab('thanks')} />
        </View>
      )}

      {/* Kids Mode covers EVERYTHING (tabs, gear, overlays) — its own world,
          exited only via the hold-to-exit control inside */}
      {FLAGS.kidsMode && kidModeChildId && (
        <KidModeScreen
          childId={kidModeChildId}
          onExit={exitKidMode}
          onSwitchChild={enterKidMode}
        />
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
    <Pressable onPress={onPress} style={styles.tabBtn} accessibilityRole="button" accessibilityLabel={FLAGS.quickLog ? 'Log work' : 'Add task'}>
      <View style={styles.addCircle}>
        <Icon name="plus" size={20} color="#FFFFFF" strokeWidth={2.6} />
      </View>
      <Text style={[type.caption, { fontSize: 11, color: colors.charcoalSoft }]}>{FLAGS.quickLog ? 'Log' : 'Add'}</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.warmWhite }}>
      <HouseholdProvider>
        <SyncProvider>
          <Shell />
        </SyncProvider>
      </HouseholdProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: spacing.s,
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
    position: 'absolute', right: spacing.xl,
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
