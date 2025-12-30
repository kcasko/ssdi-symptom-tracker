/**
 * Report Editor Screen
 * View and edit report drafts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton } from '../components';
import { useAppState } from '../state/useAppState';
import { ReportService } from '../services';
import * as Sharing from 'expo-sharing';

type ReportEditorProps = NativeStackScreenProps<RootStackParamList, 'ReportEditor'>;

export const ReportEditorScreen: React.FC<ReportEditorProps> = ({ route, navigation }) => {
  const { reportId } = route.params;
  const { reportDrafts, updateReportDraft } = useAppState();
  
  const draft = reportDrafts.find((r) => r.id === reportId);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  if (!draft) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Report not found</Text>
      </SafeAreaView>
    );
  }

  const handleEditSection = (sectionId: string, content: string) => {
    setEditingSectionId(sectionId);
    setEditText(content);
  };

  const handleSaveEdit = () => {
    if (!editingSectionId) return;

    const updated = ReportService.updateSection(draft, editingSectionId, editText);
    updateReportDraft(updated);
    setEditingSectionId(null);
    setEditText('');
    Alert.alert('Success', 'Section updated');
  };

  const handleExport = async () => {
    try {
      const text = ReportService.exportAsText(draft, {
        format: 'text',
        includeMetadata: true,
        includeSourceReferences: true,
      });

      // In production, save to file and share
      Alert.alert('Export', 'Report ready for export (text format)', [
        { text: 'OK' }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const validation = ReportService.validateReport(draft);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{draft.reportType}</Text>
        <Text style={styles.meta}>
          {new Date(draft.dateRange.start).toLocaleDateString()} -{' '}
          {new Date(draft.dateRange.end).toLocaleDateString()}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!validation.isComplete && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Validation Warnings</Text>
            {validation.warnings.map((w, i) => (
              <Text key={i} style={styles.warningText}>• {w}</Text>
            ))}
            {validation.errors.map((e, i) => (
              <Text key={i} style={styles.errorText}>• {e}</Text>
            ))}
          </View>
        )}

        {draft.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {editingSectionId !== section.id && (
                <Text
                  style={styles.editButton}
                  onPress={() => handleEditSection(section.id, section.content)}
                >
                  Edit
                </Text>
              )}
            </View>

            {editingSectionId === section.id ? (
              <View style={styles.editorContainer}>
                <TextInput
                  style={styles.editor}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  textAlignVertical="top"
                />
                <View style={styles.editorButtons}>
                  <BigButton
                    label="Cancel"
                    onPress={() => setEditingSectionId(null)}
                    variant="secondary"
                  />
                  <BigButton
                    label="Save"
                    onPress={handleSaveEdit}
                    variant="primary"
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.content}>{section.content}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <BigButton
          label="Export Report"
          onPress={handleExport}
          variant="primary"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  meta: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
  scrollView: {
    flex: 1,
  },
  warningCard: {
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    margin: spacing.lg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    gap: spacing.xs,
  },
  warningTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.warning,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    fontWeight: typography.weights.semibold as any,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  editButton: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: typography.weights.semibold as any,
  },
  content: {
    fontSize: typography.sizes.md,
    color: colors.gray800,
    lineHeight: 24,
  },
  editorContainer: {
    gap: spacing.md,
  },
  editor: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray900,
    minHeight: 200,
  },
  editorButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});
