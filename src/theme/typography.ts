import { Platform, TextStyle } from 'react-native';

/**
 * Daymark - Typography System
 * Clear, readable fonts optimized for fatigued users
 */

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

// Font weights
const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

// Font sizes with line heights
export const typography = {
  // Display - Large headers
  displayLarge: {
    fontFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.5,
  } as TextStyle,

  displayMedium: {
    fontFamily,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.25,
  } as TextStyle,

  displaySmall: {
    fontFamily,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: fontWeights.bold,
  } as TextStyle,

  // Headlines
  headlineLarge: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeights.semibold,
  } as TextStyle,

  headlineMedium: {
    fontFamily,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeights.semibold,
  } as TextStyle,

  headlineSmall: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
  } as TextStyle,

  // Titles
  titleLarge: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  titleMedium: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  titleSmall: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  // Body text
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  bodyMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  // Labels
  labelLarge: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.1,
  } as TextStyle,

  labelMedium: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
  } as TextStyle,

  labelSmall: {
    fontFamily,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
  } as TextStyle,

  // Button text
  buttonLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.25,
  } as TextStyle,

  buttonMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.25,
  } as TextStyle,

  // Caption and helper text
  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.4,
  } as TextStyle,

  overline: {
    fontFamily,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: fontWeights.medium,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,

  // Numeric displays (for severity scores, durations)
  numeric: {
    fontFamily,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  numericLarge: {
    fontFamily,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  // Font size tokens (for backwards compatibility with existing code)
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
  },

  // Font weight tokens (for backwards compatibility with existing code)
  weights: fontWeights,
} as const;

export type Typography = typeof typography;
export { fontWeights };

