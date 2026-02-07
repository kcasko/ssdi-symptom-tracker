/**
 * NotesField Component
 * Large text input for context notes
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface NotesFieldProps {
  value: string;
  onChange: (text: string) => void;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  height?: number;
}

export const NotesField: React.FC<NotesFieldProps> = ({
  value,
  onChange,
  label = 'Notes',
  placeholder = 'Add any relevant context...',
  maxLength = 500,
  height = 120,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      </View>

      <TextInput
        style={[styles.input, { height }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.gray500}
        multiline
        textAlignVertical="top"
        maxLength={maxLength}
        blurOnSubmit={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.labelLarge,
    color: colors.gray900,
  },
  counter: {
    ...typography.labelSmall,
    color: colors.gray600,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    padding: spacing.md,
    ...typography.bodyMedium,
    color: colors.gray900,
  },
});
