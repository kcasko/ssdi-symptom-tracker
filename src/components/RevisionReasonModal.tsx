/**
 * RevisionReasonModal
 * Collects a neutral reason before saving a revision.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RevisionReasonCategory } from '../domain/models/EvidenceMode';

export interface RevisionReasonOption {
  id: RevisionReasonCategory;
  label: string;
}

interface RevisionReasonModalProps {
  visible: boolean;
  title?: string;
  helperText?: string;
  reasonOptions: RevisionReasonOption[];
  selectedReason: RevisionReasonCategory;
  note: string;
  onSelectReason: (reason: RevisionReasonCategory) => void;
  onChangeNote: (text: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}

export const RevisionReasonModal: React.FC<RevisionReasonModalProps> = ({
  visible,
  title = 'Revision reason (required)',
  helperText = 'Select the closest reason and add a neutral explanation for this change.',
  reasonOptions,
  selectedReason,
  note,
  onSelectReason,
  onChangeNote,
  onCancel,
  onConfirm,
  confirmLabel = 'Save revision',
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.helper}>{helperText}</Text>
          <ScrollView style={styles.reasonList} contentContainerStyle={styles.reasonListContent}>
            {reasonOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.reasonButton,
                  selectedReason === option.id && styles.reasonButtonSelected,
                ]}
                onPress={() => onSelectReason(option.id)}
              >
                <Text style={styles.reasonButtonText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.noteLabel}>Revision note</Text>
          <TextInput
            testID="revision-note-input"
            style={styles.noteInput}
            value={note}
            onChangeText={onChangeNote}
            placeholder="Describe what was corrected or clarified (minimum 20 characters)"
            multiline
          />
          <View style={styles.actions}>
            <TouchableOpacity testID="revision-cancel" style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="revision-confirm" style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  helper: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    marginBottom: spacing.md,
  },
  reasonList: {
    maxHeight: 140,
  },
  reasonListContent: {
    gap: spacing.sm,
  },
  reasonButton: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
  },
  reasonButtonSelected: {
    borderColor: colors.primary600,
    backgroundColor: colors.primaryLight,
  },
  reasonButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.gray900,
    fontWeight: typography.weights.medium as any,
  },
  noteLabel: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    fontWeight: typography.weights.medium as any,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    padding: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.gray900,
    minHeight: 90,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    color: colors.gray700,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
  },
  confirmButton: {
    backgroundColor: colors.primaryMain,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 4,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as any,
  },
});
