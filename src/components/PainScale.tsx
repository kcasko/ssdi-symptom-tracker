/**
 * PainScale Component
 * 0-10 severity scale with large touch targets
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface PainScaleProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

export const PainScale: React.FC<PainScaleProps> = ({
  value,
  onChange,
  label = 'Severity (0-10)',
  disabled = false,
}) => {
  const getSeverityColor = (severity: number): string => {
    if (severity === 0) return colors.gray300;
    if (severity <= 3) return colors.success;
    if (severity <= 6) return colors.warning;
    return colors.error;
  };

  const getSeverityLabel = (severity: number): string => {
    if (severity === 0) return 'None';
    if (severity <= 3) return 'Mild';
    if (severity <= 6) return 'Moderate';
    if (severity <= 8) return 'Severe';
    return 'Very Severe';
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.scaleContainer}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((severity) => (
          <TouchableOpacity
            key={severity}
            style={[
              styles.scaleButton,
              value === severity && styles.scaleButtonActive,
              value === severity && { backgroundColor: getSeverityColor(severity) },
            ]}
            onPress={() => onChange(severity)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.scaleButtonText,
                value === severity && styles.scaleButtonTextActive,
              ]}
            >
              {severity}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {value >= 0 && (
        <View style={styles.feedbackContainer}>
          <View style={[styles.colorIndicator, { backgroundColor: getSeverityColor(value) }]} />
          <Text style={styles.feedbackText}>
            {value}/10 - {getSeverityLabel(value)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.gray900,
  },
  scaleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  scaleButton: {
    width: 60,
    height: 56,
    backgroundColor: colors.gray200,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray300,
  },
  scaleButtonActive: {
    borderColor: colors.gray900,
    borderWidth: 3,
  },
  scaleButtonText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray600,
  },
  scaleButtonTextActive: {
    color: colors.white,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  feedbackText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.gray700,
  },
});
