/**
 * Theme Toggle Component
 * Toggle between light and dark themes
 */

import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: (enabled: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, onToggle }) => {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.label}>Dark Mode</Text>
        <Text style={styles.description}>
          Reduces eye strain in low-light environments
        </Text>
      </View>
      <Switch
        value={isDarkMode}
        onValueChange={onToggle}
        trackColor={{ false: colors.gray300, true: colors.primary[300] }}
        thumbColor={isDarkMode ? colors.primaryMain : colors.white}
        accessibilityLabel="Toggle dark mode"
        testID="theme-toggle-switch"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
});
