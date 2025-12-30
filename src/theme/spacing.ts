/**
 * SSDI Symptom Tracker - Spacing System
 * Consistent spacing for accessible, touch-friendly UI
 */

export const spacing = {
  // Base unit: 4px
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Semantic spacing
  screenPadding: 16,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 12,
  inputPadding: 12,
  buttonPadding: 16,

  // Touch targets (minimum 44px for accessibility)
  touchTarget: 48,
  touchTargetLarge: 56,

  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // Icon sizes
  icon: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
} as const;

/**
 * Get consistent margin/padding values
 */
export const layout = {
  // Screen layouts
  screenHorizontal: spacing.screenPadding,
  screenVertical: spacing.md,
  
  // Card layouts
  cardMargin: spacing.md,
  cardRadius: spacing.borderRadius.lg,
  
  // List layouts
  listItemHeight: 56,
  listItemPadding: spacing.md,
  listSeparator: 1,
  
  // Button layouts
  buttonHeight: 48,
  buttonHeightLarge: 56,
  buttonRadius: spacing.borderRadius.md,
  
  // Input layouts
  inputHeight: 48,
  inputRadius: spacing.borderRadius.md,
  
  // Bottom tab bar
  tabBarHeight: 64,
} as const;

export type Spacing = typeof spacing;
export type Layout = typeof layout;
