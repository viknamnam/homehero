import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/tokens';

// REWARD OVERLAYS (Phase 4). Two come from founder art (rings + emblems,
// cropped to transparent PNGs), one is built in code (the burst) so it aligns
// to the circle by construction and animates. All anchor to the AVATAR CIRCLE,
// never the face — so they register perfectly on every one of the 35 avatars.

export type RingKey =
  | 'bronze' | 'silver' | 'gold' | 'gold_stars' | 'vine' | 'sky' | 'rainbow' | 'sparkle';
export type EmblemKey =
  | 'star' | 'ribbon' | 'medal' | 'crown' | 'leaf' | 'chef' | 'paw' | 'bolt' | 'heart' | 'trophy';

const RINGS: Record<RingKey, number> = {
  bronze: require('../../assets/rewards/ring_bronze.png'),
  silver: require('../../assets/rewards/ring_silver.png'),
  gold: require('../../assets/rewards/ring_gold.png'),
  gold_stars: require('../../assets/rewards/ring_gold_stars.png'),
  vine: require('../../assets/rewards/ring_vine.png'),
  sky: require('../../assets/rewards/ring_sky.png'),
  rainbow: require('../../assets/rewards/ring_rainbow.png'),
  sparkle: require('../../assets/rewards/ring_sparkle.png'),
};
const EMBLEMS: Record<EmblemKey, number> = {
  star: require('../../assets/rewards/emblem_star.png'),
  ribbon: require('../../assets/rewards/emblem_ribbon.png'),
  medal: require('../../assets/rewards/emblem_medal.png'),
  crown: require('../../assets/rewards/emblem_crown.png'),
  leaf: require('../../assets/rewards/emblem_leaf.png'),
  chef: require('../../assets/rewards/emblem_chef.png'),
  paw: require('../../assets/rewards/emblem_paw.png'),
  bolt: require('../../assets/rewards/emblem_bolt.png'),
  heart: require('../../assets/rewards/emblem_heart.png'),
  trophy: require('../../assets/rewards/emblem_trophy.png'),
};

/** Avatar wrapped in a reward frame + optional corner emblem. Both optional. */
export function RewardAvatar({ size, ring, emblem, children }: {
  size: number; ring?: RingKey | null; emblem?: EmblemKey | null; children: React.ReactNode;
}) {
  // The art ring's hollow centre is ~76% of the image; inset the avatar so it
  // sits inside the band rather than under it.
  const inset = ring ? Math.round(size * 0.12) : 0;
  const emblemSize = Math.round(size * 0.42);
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', top: inset, left: inset, width: size - inset * 2, height: size - inset * 2 }}>
        {children}
      </View>
      {ring && <Image source={RINGS[ring]} style={{ position: 'absolute', width: size, height: size }} />}
      {emblem && (
        <Image
          source={EMBLEMS[emblem]}
          style={{ position: 'absolute', width: emblemSize, height: emblemSize, right: -emblemSize * 0.12, bottom: -emblemSize * 0.12 }}
        />
      )}
    </View>
  );
}

const HEART = 'M12 21s-7-4.6-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.4 12 21 12 21z';
const SPARK = 'M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z';

/** Celebration burst — sparkles/hearts pop and fade around the circle. Code, not
 *  art: aligned to the circle centre by construction, reuses the app's glyphs. */
export function CelebrationBurst({ size }: { size: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 1400, useNativeDriver: true }).start();
  }, [t]);
  const count = 12;
  const r = size * 0.52;
  const palette = [colors.coral, colors.butter, colors.sage, colors.sky, colors.lavender, colors.blush];
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      {Array.from({ length: count }).map((_, i) => {
        const ang = (i / count) * Math.PI * 2;
        const dx = Math.cos(ang) * r;
        const dy = Math.sin(ang) * r;
        const isHeart = i % 4 === 0;
        const tint = palette[i % palette.length];
        const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
        const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
        const scale = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1.1, 0.9] });
        const opacity = t.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] });
        return (
          <Animated.View key={i} style={{ position: 'absolute', transform: [{ translateX }, { translateY }, { scale }], opacity }}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d={isHeart ? HEART : SPARK} fill={tint} />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}
