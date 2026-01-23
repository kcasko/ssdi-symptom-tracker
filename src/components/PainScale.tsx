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
  // Monochromatic scale to prevent visual bias
  const getSeverityColor = (severity: number): string => {
    // Progressive gray scale - no emotional color associations
    const grayScale = [
      colors.gray200,  // 0
      colors.gray300,  // 1
      colors.gray300,  // 2
      colors.gray400,  // 3
      colors.gray400,  // 4
      colors.gray500,  // 5
      colors.gray500,  // 6
      colors.gray600,  // 7
      colors.gray600,  // 8
      colors.gray700,  // 9
      colors.gray800,  // 10
    ];
    return grayScale[severity] || colors.gray500;
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

      {value >= 0 ? (
        <View style={styles.feedbackContainer}>
          <View style={[styles.colorIndicator, { backgroundColor: getSeverityColor(value) }]} />
          <Text style={styles.feedbackText}>
            Selected: {value}/10
          </Text>
        </View>
      ) : (
        <Text style={styles.unselectedText}>Select a value (0-10)</Text>
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
    width: 72,
    height: 72,
    backgroundColor: colors.white,
    borderRadius: 4, // Sharp edges for document-like appearance
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray400,
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
  unselectedText: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
});
