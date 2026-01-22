/**
 * Daymark - Color Palette
 * Calm, neutral tones for marking time without judgment
 *
 * Design Philosophy:
 * - Deep slate and charcoal tones (not clinical blue)
 * - Low contrast but readable
 * - No alarm colors or bright accents
 * - Colors you'd trust on a bad day
 */

export const colors = {
  // Primary palette - deep slate tones
  primary: {
    50: '#f0f2f5',     // Very light slate
    100: '#d9dfe6',    // Light slate
    200: '#b3bfcc',    // Soft slate
    300: '#8d9fb3',    // Medium slate
    400: '#677f99',    // Muted slate
    500: '#4a6176',    // Core slate
    600: '#3d4f61',    // Deep slate
    700: '#2f3d4c',    // Darker slate
    800: '#222b37',    // Charcoal
    900: '#1a2128',    // Near black slate
  },

  // Semantic colors - toned down, calm
  success: {
    light: '#e8f4f1',  // Very soft green background
    main: '#52a68a',   // Muted sage green
    dark: '#3d7a66',   // Deeper sage
    text: '#2c5949',   // Dark sage text
  },

  warning: {
    light: '#fef8ec',  // Very soft amber background
    main: '#d4a574',   // Muted amber
    dark: '#b88a5c',   // Deeper amber
    text: '#8b6944',   // Dark amber text
  },

  error: {
    light: '#f7ebe9',  // Very soft rose background
    main: '#c17369',   // Muted rose
    dark: '#a25d54',   // Deeper rose
    text: '#7a4740',   // Dark rose text
  },

  // Neutral grays - warmer, softer
  gray: {
    50: '#fafbfc',     // Off-white
    100: '#f4f5f7',    // Very light gray
    200: '#e9ebee',    // Light gray
    300: '#dce0e4',    // Soft gray
    400: '#c4cbd3',    // Medium gray
    500: '#9aa4b0',    // Neutral gray
    600: '#6b7684',    // Muted gray
    700: '#4a5361',    // Deep gray
    800: '#333b47',    // Darker gray
    900: '#1e242e',    // Near black
  },

  // Severity scale colors (0-10) - less alarming
  severity: {
    none: '#7ec299',      // 0 - Soft green
    minimal: '#98cfac',   // 1-2 - Light sage
    mild: '#e8d490',      // 3-4 - Soft yellow
    moderate: '#daa978',  // 5-6 - Muted orange
    severe: '#c9887d',    // 7-8 - Soft rose
    extreme: '#b5726a',   // 9-10 - Muted red
  },

  // Background colors
  background: {
    primary: '#ffffff',   // Pure white
    secondary: '#fafbfc', // Off-white
    tertiary: '#f4f5f7',  // Very light gray
    dark: '#2f3d4c',      // Deep slate
  },

  // Text colors - softer hierarchy
  text: {
    primary: '#1e242e',   // Near black
    secondary: '#6b7684', // Muted gray
    disabled: '#9aa4b0',  // Neutral gray
    inverse: '#ffffff',   // White on dark
    link: '#4a6176',      // Core slate
  },

  // Border colors
  border: {
    light: '#e9ebee',     // Light gray
    medium: '#c4cbd3',    // Medium gray
    dark: '#6b7684',      // Muted gray
    focus: '#4a6176',     // Core slate
  },

  // Status colors for logs - calm versions
  status: {
    logged: '#4a6176',    // Core slate
    pending: '#d4a574',   // Muted amber
    exported: '#52a68a',  // Muted sage
    draft: '#6b7684',     // Muted gray
  },

  // Shorthand aliases for commonly used colors
  gray50: '#fafbfc',
  gray100: '#f4f5f7',
  gray200: '#e9ebee',
  gray300: '#dce0e4',
  gray400: '#c4cbd3',
  gray500: '#9aa4b0',
  gray600: '#6b7684',
  gray700: '#4a5361',
  gray800: '#333b47',
  gray900: '#1e242e',

  // Common color shorthands
  white: '#ffffff',
  black: '#000000',
  primaryMain: '#4a6176',        // Core slate
  primary600: '#3d4f61',         // Deep slate
  primaryLight: '#f0f2f5',       // Very light slate
  warningMain: '#d4a574',        // Muted amber
  warningLight: '#fef8ec',       // Very soft amber
  errorMain: '#c17369',          // Muted rose
  successMain: '#52a68a',        // Muted sage
  successLight: '#e8f4f1',       // Very soft green
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
