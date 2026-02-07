/**
 * Daymark - Color Palette
 * Calm, neutral tones for marking time without judgment
 *
 * Design Philosophy:
 * - Deep slate and charcoal tones (not clinical blue)
 * - Low contrast but readable
 * - No alarm colors or bright accents
 * - Colors designed for clear, neutral presentation
 * - Orange accent from brand icon used sparingly, never for "success"
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

  // Brand accent - sunrise orange from app icon
  // Use sparingly for brand moments only, NEVER for success/reward
  accent: {
    light: '#fef3eb',  // Very soft orange background
    main: '#e07c42',   // Warm sunrise orange
    dark: '#c4612e',   // Deeper orange
    text: '#8a4f2a',   // Dark orange for text on light bg
  },

  // Semantic colors - for system states only, not data judgment
  // These should be used sparingly for validation errors, system warnings
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

  // Severity scale colors (0-10) - GRAYSCALE ONLY
  // No emotional color associations - darker = higher severity
  severity: {
    0: '#e9ebee',   // Lightest gray
    1: '#dce0e4',
    2: '#dce0e4',
    3: '#c4cbd3',
    4: '#c4cbd3',
    5: '#9aa4b0',
    6: '#9aa4b0',
    7: '#6b7684',
    8: '#6b7684',
    9: '#4a5361',
    10: '#333b47',  // Darkest gray
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

  // Status colors for logs - neutral, no judgment
  // All use slate/gray family to avoid implying good/bad
  status: {
    logged: '#4a6176',    // Core slate - entry exists
    pending: '#9aa4b0',   // Neutral gray - no entry yet
    exported: '#3d4f61',  // Deep slate - exported/locked
    draft: '#6b7684',     // Muted gray - not finalized
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
  accentMain: '#e07c42',         // Sunrise orange (brand only)
  accentLight: '#fef3eb',        // Very soft orange
  warningMain: '#d4a574',        // Muted amber (system warnings only)
  warningLight: '#fef8ec',       // Very soft amber
  errorMain: '#c17369',          // Muted rose (validation errors only)
  successMain: '#52a68a',        // Muted sage (system success only)
  successLight: '#e8f4f1',       // Very soft green
} as const;

/**
 * Get severity color based on 0-10 scale
 * Uses grayscale only - no emotional color associations
 */
export function getSeverityColor(severity: number): string {
  const clampedSeverity = Math.max(0, Math.min(10, Math.round(severity)));
  return colors.severity[clampedSeverity as keyof typeof colors.severity];
}

/**
 * Get text color that contrasts with severity background
 */
export function getSeverityTextColor(severity: number): string {
  if (severity <= 6) return colors.text.primary;
  return colors.text.inverse;
}

export type ColorPalette = typeof colors;
