/**
 * Dark Theme Configuration
 * Dark mode color palette optimized for accessibility
 */

export const darkColors = {
  // Background colors
  background: {
    primary: '#121212',
    secondary: '#1E1E1E',
    tertiary: '#2C2C2C',
  },

  // Surface colors
  surface: {
    primary: '#1E1E1E',
    secondary: '#2C2C2C',
    elevated: '#383838',
  },

  // Primary brand colors (adjusted for dark mode)
  primary50: '#E3F2FD',
  primary100: '#BBDEFB',
  primary200: '#90CAF9',
  primary300: '#64B5F6',
  primary400: '#42A5F5',
  primary500: '#2196F3',
  primary600: '#1E88E5', // Main primary
  primaryMain: '#1E88E5',
  primary700: '#1976D2',
  primary800: '#1565C0',
  primary900: '#0D47A1',

  // Danger/Error colors
  danger50: '#FFEBEE',
  danger100: '#FFCDD2',
  danger500: '#F44336',
  danger600: '#E53935',
  dangerMain: '#E53935',
  danger700: '#D32F2F',

  // Success colors
  success50: '#E8F5E9',
  success100: '#C8E6C9',
  success500: '#4CAF50',
  success600: '#43A047',
  successMain: '#43A047',
  success700: '#388E3C',

  // Warning colors
  warning50: '#FFF3E0',
  warning100: '#FFE0B2',
  warning500: '#FF9800',
  warning600: '#FB8C00',
  warningMain: '#FB8C00',
  warning700: '#F57C00',

  // Gray scale (inverted for dark mode)
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  // Text colors (adjusted for dark backgrounds)
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    tertiary: '#808080',
    disabled: '#5C5C5C',
    inverse: '#000000',
  },

  // Border colors
  border: {
    primary: '#383838',
    secondary: '#2C2C2C',
    focus: '#1E88E5',
  },

  // Status colors
  info: '#2196F3',
  disabled: '#5C5C5C',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Shadows (lighter for dark mode)
  shadow: 'rgba(0, 0, 0, 0.5)',
};

export const darkTheme = {
  colors: darkColors,
  isDark: true,
};
