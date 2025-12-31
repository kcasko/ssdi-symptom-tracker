/**
 * SSDI Symptom Tracker - Color Palette
 * High contrast colors optimized for fatigued users
 */

export const colors = {
  // Primary palette - calming blue tones
  primary: {
    50: '#e6f0ff',
    100: '#b3d4ff',
    200: '#80b8ff',
    300: '#4d9cff',
    400: '#1a80ff',
    500: '#0066e6',
    600: '#0052b3',
    700: '#003d80',
    800: '#00294d',
    900: '#1a365d',
  },

  // Semantic colors
  success: {
    light: '#d4edda',
    main: '#28a745',
    dark: '#1e7e34',
    text: '#155724',
  },

  warning: {
    light: '#fff3cd',
    main: '#ffc107',
    dark: '#d39e00',
    text: '#856404',
  },

  error: {
    light: '#f8d7da',
    main: '#dc3545',
    dark: '#c82333',
    text: '#721c24',
  },

  // Neutral grays
  gray: {
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#6c757d',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },

  // Severity scale colors (0-10)
  severity: {
    none: '#4ade80',      // 0 - Green
    minimal: '#86efac',   // 1-2 - Light green
    mild: '#fef08a',      // 3-4 - Yellow
    moderate: '#fdba74',  // 5-6 - Orange
    severe: '#f87171',    // 7-8 - Light red
    extreme: '#dc2626',   // 9-10 - Dark red
  },

  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: '#e9ecef',
    dark: '#1a365d',
  },

  // Text colors
  text: {
    primary: '#212529',
    secondary: '#6c757d',
    disabled: '#adb5bd',
    inverse: '#ffffff',
    link: '#0066e6',
  },

  // Border colors
  border: {
    light: '#e9ecef',
    medium: '#ced4da',
    dark: '#6c757d',
    focus: '#0066e6',
  },

  // Status colors for logs
  status: {
    logged: '#0066e6',
    pending: '#ffc107',
    exported: '#28a745',
    draft: '#6c757d',
  },

  // Shorthand aliases for commonly used colors (for convenience)
  gray50: '#f8f9fa',
  gray100: '#f1f3f5',
  gray200: '#e9ecef',
  gray300: '#dee2e6',
  gray400: '#ced4da',
  gray500: '#adb5bd',
  gray600: '#6c757d',
  gray700: '#495057',
  gray800: '#343a40',
  gray900: '#212529',
  
  // Common color shorthands
  white: '#ffffff',
  background: '#f8f9fa',     // background.secondary
  primaryLight: '#e6f0ff',   // primary[50]
  warningLight: '#fff3cd',   // warning.light
} as const;

/**
 * Get severity color based on 0-10 scale
 */
export function getSeverityColor(severity: number): string {
  if (severity === 0) return colors.severity.none;
  if (severity <= 2) return colors.severity.minimal;
  if (severity <= 4) return colors.severity.mild;
  if (severity <= 6) return colors.severity.moderate;
  if (severity <= 8) return colors.severity.severe;
  return colors.severity.extreme;
}

/**
 * Get text color that contrasts with severity background
 */
export function getSeverityTextColor(severity: number): string {
  if (severity <= 6) return colors.text.primary;
  return colors.text.inverse;
}

export type ColorPalette = typeof colors;
