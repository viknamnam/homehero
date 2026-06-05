// Design tokens — single source of truth, mirrors Phase0_Design_Foundations.md §1
import { Platform } from 'react-native';

export const colors = {
  warmWhite: '#FAF6F0',
  surface: '#FFFFFF',
  charcoal: '#2E3548',
  charcoalSoft: '#5A6178',
  sage: '#A8C3A0',
  sageDeep: '#5F7D5C',
  coral: '#F28B7D',
  coralDeep: '#C94F3D',
  peach: '#F8C8A8',
  peachSoft: '#FBE9DA',   // affirmation banner fill
  butter: '#F7D98C',
  sky: '#9CC8E8',
  lavender: '#C5B8E3',
  blush: '#F4B8C1',
  mist: '#E9E4DC',
  teal: '#8FC8BD',
  // pastel fills for icon badges (mockup style: tinted circle behind icon)
  sageTint: '#E7F0E4',
  skyTint: '#E3F0FA',
  butterTint: '#FBF1D6',
  lavenderTint: '#EFEAF8',
  peachTint: '#FCECDD',
  blushTint: '#FBE7EA',
} as const;

// Hard rule: no harsh red anywhere. Errors use coralDeep with calm copy.

export const fonts = {
  // Serif accents (wordmark, greeting name) — platform serif, zero extra assets
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: "Georgia, 'Times New Roman', serif" }) as string,
  // Warm rounded sans (Nunito via @expo-google-fonts, loaded in App.tsx)
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
};

export const personColours = [
  colors.coral, colors.sky, colors.sage, colors.lavender,
  colors.butter, colors.peach, colors.blush, colors.teal,
];

export const spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const radius = { card: 16, chip: 20, button: 24 } as const;

export const type = {
  display: { fontSize: 28, fontFamily: fonts.extrabold, color: colors.charcoal },
  serifTitle: { fontSize: 30, fontFamily: fonts.serif, fontWeight: '700' as const, color: colors.charcoal },
  h1: { fontSize: 22, fontFamily: fonts.bold, color: colors.charcoal },
  h2: { fontSize: 18, fontFamily: fonts.bold, color: colors.charcoal },
  body: { fontSize: 16, fontFamily: fonts.regular, color: colors.charcoal },
  label: { fontSize: 14, fontFamily: fonts.semibold, color: colors.charcoal },
  caption: { fontSize: 13, fontFamily: fonts.regular, color: colors.charcoalSoft },
};

export const shadow = {
  card: {
    shadowColor: colors.charcoal,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
};
