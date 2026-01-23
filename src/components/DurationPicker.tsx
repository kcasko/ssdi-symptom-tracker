/**
 * DurationPicker Component
 * Quick duration selection with presets and custom input
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface DurationPickerProps {
  value: number; // in minutes
  onChange: (minutes: number) => void;
  label?: string;
  presets?: number[]; // preset durations in minutes
}

const DEFAULT_PRESETS = [5, 10, 15, 30, 45, 60, 90, 120];

export const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onChange,
  label = 'Duration',
  presets = DEFAULT_PRESETS,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  const handlePresetSelect = (minutes: number) => {
    onChange(minutes);
    setShowCustom(false);
    setCustomInput('');
  };

  const handleCustomSubmit = () => {
    const parsed = parseInt(customInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
      setCustomInput('');
      setShowCustom(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.presetsContainer}>
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[
              styles.presetButton,
              value === preset && styles.presetButtonActive,
            ]}
            onPress={() => handlePresetSelect(preset)}
          >
            <Text
              style={[
                styles.presetText,
                value === preset && styles.presetTextActive,
              ]}
            >
              {formatDuration(preset)}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.presetButton, showCustom && styles.presetButtonActive]}
          onPress={() => setShowCustom(!showCustom)}
        >
          <Text
            style={[styles.presetText, showCustom && styles.presetTextActive]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {showCustom && (
        <View style={styles.customContainer}>
          <TextInput
            style={styles.customInput}
            placeholder="Enter minutes"
            keyboardType="number-pad"
            value={customInput}
            onChangeText={setCustomInput}
            placeholderTextColor={colors.gray500}
          />
          <TouchableOpacity
            style={styles.customButton}
            onPress={handleCustomSubmit}
          >
            <Text style={styles.customButtonText}>Set</Text>
          </TouchableOpacity>
        </View>
      )}

      {value > 0 && !showCustom && (
        <Text style={styles.selectedText}>
          Selected: {formatDuration(value)}
        </Text>
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
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  presetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray300,
    minWidth: 60,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: colors.primaryMain,
    borderColor: colors.primaryMain,
  },
  presetText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.gray700,
  },
  presetTextActive: {
    color: colors.white,
  },
  customContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  customInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray900,
  },
  customButton: {
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryMain,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.white,
  },
  selectedText: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
});
