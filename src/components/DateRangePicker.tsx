/**
 * DateRangePicker Component
 * Simple date range selection with presets
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatDateShort } from '../utils/dates';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  label?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  label = 'Date Range',
}) => {
  const getPresetRange = (
    preset: 'last7' | 'last30' | 'last90' | 'all'
  ): { start: string; end: string } => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];

    switch (preset) {
      case 'last7': {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: start.toISOString().split('T')[0], end };
      }
      case 'last30': {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start: start.toISOString().split('T')[0], end };
      }
      case 'last90': {
        const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return { start: start.toISOString().split('T')[0], end };
      }
      case 'all': {
        return { start: '2020-01-01', end };
      }
    }
  };

  const handlePresetSelect = (preset: 'last7' | 'last30' | 'last90' | 'all') => {
    const range = getPresetRange(preset);
    onChange(range.start, range.end);
  };

  const calculateDays = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1; // Include both start and end days
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.presetsContainer}>
        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => handlePresetSelect('last7')}
        >
          <Text style={styles.presetText}>Last 7 Days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => handlePresetSelect('last30')}
        >
          <Text style={styles.presetText}>Last 30 Days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => handlePresetSelect('last90')}
        >
          <Text style={styles.presetText}>Last 90 Days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => handlePresetSelect('all')}
        >
          <Text style={styles.presetText}>All Time</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectedContainer}>
        <Text style={styles.selectedText}>
          {formatDateShort(startDate)} - {formatDateShort(endDate)}
        </Text>
        <Text style={styles.daysText}>({calculateDays()} days)</Text>
      </View>
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
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  presetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray300,
  },
  presetText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: colors.gray700,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  selectedText: {
    fontSize: typography.sizes.md,
    color: colors.gray900,
    fontWeight: typography.weights.semibold as any,
  },
  daysText: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
});
