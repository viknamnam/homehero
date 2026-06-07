import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { categoryByKey } from '../constants/categories';
import { copy } from '../copy/strings';
import { heroLineRandom } from '../lib/heroVoice';
import { ParsedTask, parseQuickLog } from '../lib/quickLog';
import { speech } from '../lib/speech';
import { FLAGS } from '../constants/flags';
import { useHousehold } from '../store/HouseholdStore';
import { Card, IconBadge, PrimaryButton } from '../components/ui';
import { Icon } from '../components/icons';
import { useInsets } from '../lib/insets';
import { colors, spacing, type } from '../theme/tokens';

// Quick Log (P4a): "Tell HeroNest what happened. We'll turn it into tasks."
// Mandatory review step — AI output is never saved without the person's OK.
// P4b: in-app mic streams an on-device transcript straight into the box, then
// the existing parse flow takes over. Mic renders only when FLAGS.voiceMic is
// on AND the native module is in the build (speech.available) — so this screen
// is safe on the pre-rebuild dev client too.
export default function QuickLogScreen({ onDone }: { onDone: (toast: string) => void }) {
  const { state, addTask, taskValue } = useHousehold();
  const insets = useInsets();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState<ParsedTask[] | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  // Text already in the box when the mic starts; interim transcripts replace
  // everything AFTER this, so dictation appends instead of clobbering typing.
  const baseText = useRef('');

  const showMic = FLAGS.voiceMic && speech.available;

  useEffect(() => {
    if (!showMic) return;
    const subs = [
      speech.onResult((e) => {
        const transcript = e.results[0]?.transcript ?? '';
        setText(baseText.current + transcript);
      }),
      speech.onEnd(() => setListening(false)),
      speech.onError((e) => {
        setListening(false);
        // 'no-speech'/'aborted' are normal endings, not trouble — stay quiet
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          setMicNote(e.error === 'not-allowed' ? copy.quickLog.micDenied : copy.quickLog.micTrouble);
        }
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [showMic]);

  const toggleMic = async () => {
    if (listening) { speech.stop(); return; } // final result + 'end' will follow
    setMicNote(null);
    const granted = await speech.requestPermission();
    if (!granted) { setMicNote(copy.quickLog.micDenied); return; }
    baseText.current = text.trim() ? text.trim() + ' ' : '';
    speech.start();
    setListening(true);
  };

  const parse = async () => {
    if (listening) speech.stop();
    setBusy(true); setUnreachable(false);
    const tasks = await parseQuickLog(text.trim());
    setBusy(false);
    if (!tasks) { setUnreachable(true); return; }
    setCards(tasks);
  };

  const saveAll = () => {
    if (!cards || !state.meId) return;
    cards.forEach((c) => addTask({
      categoryKey: c.categoryKey, title: c.title, durationMin: c.minutes, memberId: state.meId!,
    }));
    onDone(heroLineRandom('saved', state.heroStyle));
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{ padding: spacing.l, paddingBottom: insets.bottom + spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[type.serifTitle, { fontSize: 26 }]}>{copy.quickLog.title}</Text>
      <Text style={[type.caption, { marginTop: spacing.xs }]}>{copy.quickLog.sub}</Text>

      <TextInput
        style={{
          backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: listening ? colors.coral : colors.mist,
          padding: spacing.m, marginTop: spacing.m, minHeight: 88, textAlignVertical: 'top',
          fontSize: 16, color: colors.charcoal,
        }}
        multiline
        placeholder={copy.quickLog.placeholder}
        placeholderTextColor={colors.charcoalSoft}
        value={text}
        onChangeText={(t) => { setText(t); if (!listening) baseText.current = ''; }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.m }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton label={busy ? copy.quickLog.parsing : copy.quickLog.parseCta}
            onPress={parse} disabled={busy || text.trim().length < 3} />
        </View>
        {showMic && (
          <Pressable
            onPress={toggleMic}
            accessibilityRole="button"
            accessibilityLabel={listening ? copy.quickLog.micListening : copy.quickLog.micLabel}
            style={[micStyles.btn, listening && micStyles.btnLive]}
          >
            <Icon name="mic" size={22} color={listening ? '#FFFFFF' : colors.sageDeep} strokeWidth={2.2} />
          </Pressable>
        )}
      </View>
      {listening && (
        <Text style={[type.caption, { marginTop: spacing.s, textAlign: 'center', color: colors.coralDeep }]}>
          {copy.quickLog.micListening}
        </Text>
      )}
      {micNote && !listening && (
        <Text style={[type.caption, { marginTop: spacing.s, textAlign: 'center' }]}>{micNote}</Text>
      )}
      {busy && <ActivityIndicator style={{ marginTop: spacing.m }} color={colors.coralDeep} />}
      {unreachable && <Text style={[type.caption, { marginTop: spacing.m, color: colors.coralDeep }]}>{copy.quickLog.unreachable}</Text>}

      {cards && (
        <View style={{ marginTop: spacing.l }}>
          <Text style={type.h2}>{cards.length > 0 ? copy.quickLog.found(cards.length) : copy.quickLog.none}</Text>
          {cards.map((c, i) => {
            const cat = categoryByKey(c.categoryKey);
            const value = taskValue(c.categoryKey, c.minutes);
            return (
              <Card key={i} style={{ marginTop: spacing.s }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconBadge icon={cat.icon} tint={colors.peachTint} size={34} />
                  <View style={{ flex: 1, marginLeft: spacing.m }}>
                    <Text style={type.body} numberOfLines={1}>{c.title}</Text>
                    <Text style={type.caption}>
                      {cat.name} · {c.minutes} min
                      {!state.hideMoney && (cat.mentalLoad
                        ? ` · ${copy.addTask.valueInvaluable}`
                        : ` · ${value}`)}
                    </Text>
                  </View>
                  <Pressable onPress={() => setCards(cards.filter((_, j) => j !== i))} hitSlop={10}>
                    <Text style={type.caption}>✕</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
          {cards.length > 0 && (
            <View style={{ marginTop: spacing.m }}>
              <PrimaryButton label={copy.quickLog.saveAll(cards.length)} onPress={saveAll} />
              <Text style={[type.caption, { marginTop: spacing.s, textAlign: 'center' }]}>{copy.quickLog.editHint}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const micStyles = StyleSheet.create({
  btn: {
    width: 52, height: 52, borderRadius: 26, marginLeft: spacing.m,
    backgroundColor: colors.sageTint, borderWidth: 1.5, borderColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  // Live state: coral (warm, not alarming) — design rule: no harsh red anywhere
  btnLive: { backgroundColor: colors.coral, borderColor: colors.coral },
});
