import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { colors } from '../theme/tokens';

// Decorative doodle layer (founder design feedback, Jun 2026): small scattered
// pastel marks — heart, sparkle, leaf, squiggle, confetti dashes — on the
// warm-white canvas, matching the reference mockups' framing doodles.
//
// Rules:
// - DETERMINISTIC, hand-placed positions (fractions of the window) so the layer
//   looks designed, renders identically on every open, and matches across the
//   household's devices. No randomness.
// - Sparse + subtle: 8 marks, ~50% opacity pastels. Cards are opaque white and
//   naturally mask the layer, so doodles read in the canvas gaps and gutters.
// - pointerEvents="none" and rendered FIRST inside the screen container —
//   purely decorative, never intercepts a tap, never above content.
// - Behind a flag (FLAGS.doodles at the call sites) so it can be switched off
//   instantly if it reads as noise on any device during household testing.
//
// Each glyph is drawn in a 24×24 box and placed via translate/rotate/scale.

const GLYPHS = {
  // Soft heart (filled)
  heart:
    'M12 21s-7-4.6-9.5-9C.7 8.6 2.5 5 6 5c2 0 3.2 1 4 2.2C10.8 6 12 5 14 5c3.5 0 5.3 3.6 3.5 7-2.5 4.4-9.5 9-9.5 9z',
  // Four-point sparkle (filled)
  sparkle: 'M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z',
  // Simple leaf swoosh (filled)
  leaf: 'M4 20C4 10 10 4 20 4c0 10-6 16-16 16z',
} as const;

// Stroked glyphs (fill="none")
const STROKES = {
  squiggle: 'M2 13c2.5-7 5 7 7.5 0s5 7 7.5 0',
} as const;

type Placement = { x: number; y: number; rotate: number; scale: number };

function Glyph({ d, color, p, stroked }: {
  d: string; color: string; p: Placement; stroked?: boolean;
}) {
  return (
    <G transform={`translate(${p.x}, ${p.y}) rotate(${p.rotate}) scale(${p.scale})`} opacity={0.5}>
      {stroked ? (
        <Path d={d} stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      ) : (
        <Path d={d} fill={color} />
      )}
    </G>
  );
}

// Three confetti dashes at slightly different angles — the mockups render these
// in mixed pastels, so each dash carries its own colour.
function ConfettiDashes({ p }: { p: Placement }) {
  return (
    <G transform={`translate(${p.x}, ${p.y}) rotate(${p.rotate}) scale(${p.scale})`} opacity={0.55}>
      <Path d="M2 14l3.5-7" stroke={colors.coral} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M9 17l3.5-7" stroke={colors.sage} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M16 20l3.5-7" stroke={colors.sky} strokeWidth={2.6} strokeLinecap="round" />
    </G>
  );
}

export default function DoodleBackground({ density = 'cozy' }: { density?: 'cozy' | 'playful' }) {
  const { width: w, height: h } = useWindowDimensions();
  const playful = density === 'playful';
  return (
    <Svg
      width={w}
      height={h}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* base set (founder feedback: denser than v1) */}
      <Glyph d={GLYPHS.heart} color={colors.coral} p={{ x: w * 0.05, y: h * 0.17, rotate: -12, scale: 0.9 }} />
      <ConfettiDashes p={{ x: w * 0.03, y: h * 0.4, rotate: 0, scale: 0.85 }} />
      <Glyph d={GLYPHS.leaf} color={colors.butter} p={{ x: w * 0.84, y: h * 0.13, rotate: 24, scale: 0.9 }} />
      <Glyph d={GLYPHS.sparkle} color={colors.peach} p={{ x: w * 0.88, y: h * 0.32, rotate: 12, scale: 0.8 }} />
      <Glyph d={STROKES.squiggle} color={colors.sky} p={{ x: w * 0.42, y: h * 0.045, rotate: -4, scale: 0.9 }} stroked />
      <Glyph d={GLYPHS.heart} color={colors.blush} p={{ x: w * 0.89, y: h * 0.6, rotate: 16, scale: 0.7 }} />
      <Glyph d={GLYPHS.sparkle} color={colors.lavender} p={{ x: w * 0.07, y: h * 0.68, rotate: -14, scale: 0.7 }} />
      <Glyph d={GLYPHS.leaf} color={colors.sage} p={{ x: w * 0.72, y: h * 0.8, rotate: -28, scale: 0.8 }} />
      <Glyph d={GLYPHS.sparkle} color={colors.coral} p={{ x: w * 0.04, y: h * 0.06, rotate: 8, scale: 0.65 }} />
      <Glyph d={STROKES.squiggle} color={colors.lavender} p={{ x: w * 0.06, y: h * 0.55, rotate: 6, scale: 0.8 }} stroked />
      <Glyph d={GLYPHS.heart} color={colors.sage} p={{ x: w * 0.5, y: h * 0.52, rotate: 10, scale: 0.6 }} />
      <ConfettiDashes p={{ x: w * 0.86, y: h * 0.47, rotate: 18, scale: 0.7 }} />
      <Glyph d={GLYPHS.leaf} color={colors.teal} p={{ x: w * 0.05, y: h * 0.86, rotate: 30, scale: 0.75 }} />
      <Glyph d={STROKES.squiggle} color={colors.peach} p={{ x: w * 0.55, y: h * 0.9, rotate: -6, scale: 0.85 }} stroked />
      <Glyph d={GLYPHS.sparkle} color={colors.sky} p={{ x: w * 0.45, y: h * 0.27, rotate: -10, scale: 0.55 }} />
      {playful && (
        <>
          {/* extra layer for Kids Mode — busier, livelier canvas */}
          <Glyph d={GLYPHS.heart} color={colors.butter} p={{ x: w * 0.3, y: h * 0.1, rotate: -18, scale: 0.65 }} />
          <ConfettiDashes p={{ x: w * 0.55, y: h * 0.17, rotate: -12, scale: 0.7 }} />
          <Glyph d={GLYPHS.sparkle} color={colors.blush} p={{ x: w * 0.25, y: h * 0.45, rotate: 20, scale: 0.6 }} />
          <Glyph d={GLYPHS.leaf} color={colors.coral} p={{ x: w * 0.65, y: h * 0.38, rotate: -22, scale: 0.6 }} />
          <Glyph d={GLYPHS.heart} color={colors.sky} p={{ x: w * 0.35, y: h * 0.72, rotate: 14, scale: 0.7 }} />
          <ConfettiDashes p={{ x: w * 0.5, y: h * 0.62, rotate: 8, scale: 0.75 }} />
          <Glyph d={GLYPHS.sparkle} color={colors.sage} p={{ x: w * 0.78, y: h * 0.7, rotate: -8, scale: 0.7 }} />
          <Glyph d={STROKES.squiggle} color={colors.coral} p={{ x: w * 0.25, y: h * 0.95, rotate: 4, scale: 0.8 }} stroked />
        </>
      )}
    </Svg>
  );
}
