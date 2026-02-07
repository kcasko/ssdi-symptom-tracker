/**
 * BigButton Component
 * Large, high-contrast button optimized for fatigued users
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface BigButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
}

export const BigButton: React.FC<BigButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  icon,
  style,
  accessibilityLabel,
  testID,
}) => {
  const buttonStyles: ViewStyle[] = [styles.button];
  const textStyles: TextStyle[] = [styles.text];

  // Variant styles
  if (variant === 'primary') {
    buttonStyles.push(styles.primaryButton);
    textStyles.push(styles.primaryText);
  } else if (variant === 'secondary') {
    buttonStyles.push(styles.secondaryButton);
    textStyles.push(styles.secondaryText);
  } else if (variant === 'danger') {
    buttonStyles.push(styles.dangerButton);
    textStyles.push(styles.dangerText);
  }

  // Disabled state
  if (disabled) {
    buttonStyles.push(styles.disabled);
    textStyles.push(styles.disabledText);
  }

  // Full width
  if (fullWidth) {
    buttonStyles.push(styles.fullWidth);
  }

  // Custom styles
  if (style) {
    buttonStyles.push(style);
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      testID={testID || label.replace(/\s+/g, '-') + '-button'}
    >
      {icon && icon}
      <Text style={textStyles}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    ...typography.buttonLarge,
  },

  // Primary variant
  primaryButton: {
    backgroundColor: colors.primaryMain,
  },
  primaryText: {
    color: colors.white,
  },

  // Secondary variant - interactive element uses 2px border
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryMain,
  },
  secondaryText: {
    color: colors.primaryMain,
  },

  // Danger variant - for destructive actions only
  dangerButton: {
    backgroundColor: colors.errorMain,
  },
  dangerText: {
    color: colors.white,
  },

  // Disabled state
  disabled: {
    backgroundColor: colors.gray200,
    borderColor: colors.gray200,
  },
  disabledText: {
    color: colors.gray500,
  },
});
