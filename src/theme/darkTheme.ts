/**
 * Dark Theme Configuration
 * Dark mode color palette optimized for accessibility
 *
 * Design Philosophy:
 * - Uses same slate family as light theme for brand consistency
 * - Lighter tints of slate for visibility on dark backgrounds
 * - No color changes that would alter emotional associations
 */

export const darkColors = {
  // Background colors - dark slate family
  background: {
    primary: '#121417',     // Near black with slate undertone
    secondary: '#1a1d21',   // Dark charcoal
    tertiary: '#252a30',    // Elevated surface
  },

  // Surface colors
  surface: {
    primary: '#1a1d21',
    secondary: '#252a30',
    elevated: '#2f353d',
  },

  // Primary brand colors - SLATE family (matching light theme)
  primary50: '#f0f2f5',
  primary100: '#d9dfe6',
  primary200: '#b3bfcc',
  primary300: '#8d9fb3',    // Good for dark mode primary
  primary400: '#677f99',
  primary500: '#4a6176',
  primary600: '#8d9fb3',    // Lighter for dark mode visibility
  primaryMain: '#8d9fb3',   // Lighter slate for dark backgrounds
  primary700: '#b3bfcc',
  primary800: '#d9dfe6',
  primary900: '#f0f2f5',

  // Accent - sunrise orange (brand, not reward)
  accentMain: '#e8956a',    // Slightly lighter for dark mode
  accentLight: '#3d2a1f',   // Dark orange-tinted surface

  // Danger/Error colors - muted for dark mode
  danger50: '#2a1f1f',
  danger100: '#3d2525',
  danger500: '#cf7f78',
  danger600: '#c17369',
  dangerMain: '#c17369',
  danger700: '#a25d54',

  // Success colors - muted sage
  success50: '#1f2a24',
  success100: '#253d2f',
  success500: '#6bb89a',
  success600: '#52a68a',
  successMain: '#52a68a',
  success700: '#3d7a66',

  // Warning colors - muted amber
  warning50: '#2a251f',
  warning100: '#3d3225',
  warning500: '#e0b88a',
  warning600: '#d4a574',
  warningMain: '#d4a574',
  warning700: '#b88a5c',

  // Gray scale - warmer grays matching slate family
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#f4f5f7',
  gray100: '#e9ebee',
  gray200: '#dce0e4',
  gray300: '#c4cbd3',
  gray400: '#9aa4b0',
  gray500: '#6b7684',
  gray600: '#4a5361',
  gray700: '#333b47',
  gray800: '#252a30',
  gray900: '#1a1d21',

  // Text colors (adjusted for dark backgrounds)
  text: {
    primary: '#f4f5f7',     // Off-white, easier on eyes
    secondary: '#9aa4b0',   // Muted gray
    tertiary: '#6b7684',    // Darker muted
    disabled: '#4a5361',
    inverse: '#1a1d21',
  },

  // Border colors - slate family
  border: {
    primary: '#333b47',
    secondary: '#252a30',
    focus: '#8d9fb3',       // Slate, not blue
  },

  // Status colors - neutral
  info: '#8d9fb3',          // Slate, not blue
  disabled: '#4a5361',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Shadows (lighter for dark mode)
  shadow: 'rgba(0, 0, 0, 0.5)',
};

export const darkTheme = {
  colors: darkColors,
  isDark: true,
};
