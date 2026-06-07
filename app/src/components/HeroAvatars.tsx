import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { copy } from '../copy/strings';
import { colors, radius, shadow, spacing, type } from '../theme/tokens';

// Hero avatars v2 (founder direction, Jun 2026): warm 3D-illustrated characters
// extracted from the founder's reference art (Avatar_guidance + ChatGPT_Image
// sheets in project files), replacing the v1 flat-SVG faces which didn't match
// the intended style. Each avatar carries a playful hero title ("Household
// Hero Identity" per the guidance doc). Avatar MOODS from the doc were
// deliberately NOT built — a tired avatar on one member is a blame signal in
// a cute costume (§9/§13).
//
// STORAGE (unchanged from v1, no migration): a chosen avatar is stored as
// `avatar://<key>` in the SAME members.avatar column photo paths use; sync
// passes the scheme through, so the household sees it on the next pull.
//
// Assets live in app/assets/avatars/ (256px squares, ~80KB each). The set
// grows by dropping new same-style renders into that folder and adding a row
// below + a title in strings.ts — see the register for the generation spec.

export const AVATAR_SCHEME = 'avatar://';
export const isHeroAvatar = (url?: string | null): boolean => !!url && url.startsWith(AVATAR_SCHEME);
export const heroAvatarKey = (url: string): string => url.slice(AVATAR_SCHEME.length);
export const heroAvatarUrl = (key: string): string => AVATAR_SCHEME + key;

type HeroDesign = { key: string; src: number };

// Order = picker order: adults first, then kids/teen, pet last.
export const HERO_AVATARS: HeroDesign[] = [
  // Adults
  { key: 'maria', src: require('../../assets/avatars/maria.png') },
  { key: 'james', src: require('../../assets/avatars/james.png') },
  { key: 'dad',   src: require('../../assets/avatars/dad.png') },
  { key: 'hero',  src: require('../../assets/avatars/hero.png') },
  { key: 'sol',   src: require('../../assets/avatars/sol.png') },
  { key: 'rosa',  src: require('../../assets/avatars/rosa.png') },
  { key: 'amara', src: require('../../assets/avatars/amara.png') },
  { key: 'noor',  src: require('../../assets/avatars/noor.png') },
  { key: 'omar',  src: require('../../assets/avatars/omar.png') },
  { key: 'baz',   src: require('../../assets/avatars/baz.png') },
  { key: 'kira',  src: require('../../assets/avatars/kira.png') },
  // Grandparents
  { key: 'nana',  src: require('../../assets/avatars/nana.png') },
  { key: 'papa',  src: require('../../assets/avatars/papa.png') },
  // Teens
  { key: 'teen',  src: require('../../assets/avatars/teen.png') },
  { key: 'mei',   src: require('../../assets/avatars/mei.png') },
  { key: 'tom',   src: require('../../assets/avatars/tom.png') },
  // Kids
  { key: 'boy',   src: require('../../assets/avatars/boy.png') },
  { key: 'liam',  src: require('../../assets/avatars/liam.png') },
  { key: 'ava',   src: require('../../assets/avatars/ava.png') },
  { key: 'girl',  src: require('../../assets/avatars/girl.png') },
  { key: 'zuri',  src: require('../../assets/avatars/zuri.png') },
  { key: 'lily',  src: require('../../assets/avatars/lily.png') },
  { key: 'finn',  src: require('../../assets/avatars/finn.png') },
  { key: 'kai',   src: require('../../assets/avatars/kai.png') },
  { key: 'remy',  src: require('../../assets/avatars/remy.png') },
  // Nest Creatures — non-human options so everyone can belong
  { key: 'dog',   src: require('../../assets/avatars/dog.png') },
  { key: 'fox',   src: require('../../assets/avatars/fox.png') },
  { key: 'owl',   src: require('../../assets/avatars/owl.png') },
  { key: 'bear',  src: require('../../assets/avatars/bear.png') },
  { key: 'bee',   src: require('../../assets/avatars/bee.png') },
  { key: 'puppy',    src: require('../../assets/avatars/puppy.png') },
  { key: 'unicorn',  src: require('../../assets/avatars/unicorn.png') },
  { key: 'rabbit',   src: require('../../assets/avatars/rabbit.png') },
  { key: 'cat',      src: require('../../assets/avatars/cat.png') },
  { key: 'hedgehog', src: require('../../assets/avatars/hedgehog.png') },
];

// Display defaults (founder decision): every member without a chosen avatar
// gets a hero face automatically — CREATURES only, so no algorithm ever guesses
// anyone's gender. Assignment is deterministic (members sorted by id) and
// household-unique: explicitly-picked creatures are skipped, and unset members
// each take the next free one, so the same family sees the same faces on every
// device with no database writes. Picking your own avatar overrides, always.
export const NEUTRAL_DEFAULT_KEYS = [
  'fox', 'owl', 'bear', 'bee', 'dog', 'cat', 'rabbit', 'puppy', 'hedgehog', 'unicorn',
];

export function defaultAvatarKey(
  memberId: string,
  members: { id: string; avatarUrl?: string | null }[],
): string {
  const taken = new Set(
    members
      .filter((m) => m.avatarUrl && isHeroAvatar(m.avatarUrl))
      .map((m) => heroAvatarKey(m.avatarUrl as string)),
  );
  let pool = NEUTRAL_DEFAULT_KEYS.filter((k) => !taken.has(k));
  if (pool.length === 0) pool = NEUTRAL_DEFAULT_KEYS;
  const unset = members
    .filter((m) => !m.avatarUrl)
    .sort((a, b) => a.id.localeCompare(b.id));
  const idx = unset.findIndex((m) => m.id === memberId);
  return pool[(idx === -1 ? 0 : idx) % pool.length];
}

/** Image source for a stored avatar key (unknown/legacy keys fall back to the first design). */
export function heroAvatarSource(key: string): number {
  return (HERO_AVATARS.find((a) => a.key === key) ?? HERO_AVATARS[0]).src;
}

function heroTitle(key: string): string {
  return copy.avatars.titles[key] ?? copy.avatars.fallbackTitle;
}

// Bottom-sheet picker: tap a face, done. Cancel never changes anything.
export function HeroAvatarPicker({ visible, onPick, onClose }: {
  visible: boolean; onPick: (key: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pickerStyles.backdrop} onPress={onClose} accessibilityLabel={copy.photo.cancel}>
        <Pressable style={pickerStyles.sheet} onPress={() => {}}>
          <Text style={[type.h2, { textAlign: 'center' }]}>{copy.photo.heroTitle}</Text>
          <Text style={[type.caption, { textAlign: 'center', marginTop: spacing.xs }]}>
            {copy.photo.heroSub}
          </Text>
          <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={pickerStyles.grid}>
            {HERO_AVATARS.map((a) => (
              <Pressable
                key={a.key}
                onPress={() => onPick(a.key)}
                accessibilityRole="button"
                accessibilityLabel={heroTitle(a.key)}
                style={({ pressed }) => [pickerStyles.cell, pressed && { transform: [{ scale: 0.94 }] }]}
              >
                <Image source={a.src} style={pickerStyles.face} />
                <Text style={pickerStyles.caption} numberOfLines={2}>{heroTitle(a.key)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={onClose} style={pickerStyles.cancel} accessibilityRole="button">
            <Text style={[type.label, { color: colors.charcoalSoft }]}>{copy.photo.cancel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(46, 53, 72, 0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.warmWhite,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: spacing.xl, paddingHorizontal: spacing.l, paddingBottom: spacing.xl,
    ...shadow.card,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    paddingTop: spacing.l, paddingBottom: spacing.s,
  },
  cell: {
    width: 96, borderRadius: radius.card, margin: spacing.xs,
    backgroundColor: colors.surface, alignItems: 'center',
    paddingTop: spacing.s, paddingBottom: spacing.s, paddingHorizontal: spacing.xs,
    ...shadow.card,
  },
  face: { width: 64, height: 64, borderRadius: 32 },
  caption: { ...type.caption, fontSize: 11, textAlign: 'center', marginTop: spacing.xs },
  cancel: { alignItems: 'center', paddingVertical: spacing.m, minHeight: 44, justifyContent: 'center' },
});
