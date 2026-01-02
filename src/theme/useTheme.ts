/**
 * Theme Hook
 * Provides theme colors based on dark mode setting
 */

import { useSettingsStore } from '../state/settingsStore';
import { colors as lightColors } from './colors';

// Dark theme colors
const darkColors = {
  ...lightColors,
  background: {
    primary: '#1a1a1a',
    secondary: '#2d2d2d',
    tertiary: '#3a3a3a',
  },
  text: {
    primary: '#ffffff',
    secondary: '#b3b3b3',
    tertiary: '#808080',
  },
  gray900: '#f5f5f5',
  gray600: '#b3b3b3',
  gray300: '#666666',
  gray200: '#4a4a4a',
  gray100: '#3a3a3a',
  gray50: '#2d2d2d',
  white: '#1a1a1a',
};

export function useTheme() {
  const { settings } = useSettingsStore();
  const isDark = settings.darkMode;
  
  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}
