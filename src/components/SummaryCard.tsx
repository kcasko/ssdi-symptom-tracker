/**
 * SummaryCard Component
 * Neutral card for displaying summary information
 *
 * Design Philosophy:
 * - No semantic color variants (success/warning/error)
 * - All data presented neutrally without judgment
 * - Slate accent color only
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
  /**
   * @deprecated Semantic variants removed to prevent data judgment.
   * All cards now use neutral styling. This prop is ignored.
   */
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  onPress,
  // variant is intentionally ignored - all cards are neutral
}) => {
  const Container = (onPress ? TouchableOpacity : View) as any;

  const containerProps = onPress
    ? {
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: `${title}, value: ${value}${subtitle ? ', ' + subtitle : ''}`,
        testID: `summary-card-${title.replace(/\s+/g, '-').toLowerCase()}`,
        onPress,
        activeOpacity: 0.7,
      }
    : {};

  return (
    <Container
      style={styles.card}
      {...containerProps}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
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
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryMain,  // Neutral slate accent
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.sm,
    // Removed shadow - informational cards don't need elevation
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
    color: colors.gray900,  // Neutral text color, no judgment
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
});
