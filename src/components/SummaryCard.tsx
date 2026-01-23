/**
 * SummaryCard Component
 * High-contrast card for displaying summary information
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  onPress,
  variant = 'default',
}) => {
  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return colors.successMain;
      case 'warning':
        return colors.warningMain;
      case 'error':
        return colors.errorMain;
      default:
        return colors.primaryMain;
    }
  };

  const Container = (onPress ? TouchableOpacity : View) as any;

  return (
    <Container
      style={[styles.card, { borderLeftColor: getVariantColor() }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color: getVariantColor() }]}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: spacing.md,
    borderLeftWidth: 4,
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    alignSelf: 'flex-start',
  },
  content: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    fontWeight: typography.weights.semibold as any,
  },
  value: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
});
