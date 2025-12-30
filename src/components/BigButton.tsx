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
}

export const BigButton: React.FC<BigButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  icon,
  style,
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
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as TextStyle['fontWeight'],
  },
  
  // Primary variant
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.white,
  },
  
  // Secondary variant
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryText: {
    color: colors.primary,
  },
  
  // Danger variant
  dangerButton: {
    backgroundColor: colors.error,
  },
  dangerText: {
    color: colors.white,
  },
  
  // Disabled state
  disabled: {
    backgroundColor: colors.gray300,
    borderColor: colors.gray300,
  },
  disabledText: {
    color: colors.gray500,
  },
});
