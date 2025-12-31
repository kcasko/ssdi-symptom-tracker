/**
 * SymptomPicker Component
 * Searchable symptom selector organized by category
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { SYMPTOMS as symptoms, SymptomCategory } from '../data/symptoms';

interface SymptomPickerProps {
  selectedSymptomIds: string[];
  onToggleSymptom: (symptomId: string) => void;
  maxSelections?: number;
}

export const SymptomPicker: React.FC<SymptomPickerProps> = ({
  selectedSymptomIds,
  onToggleSymptom,
  maxSelections,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<SymptomCategory>>(new Set());

  const toggleCategory = (category: SymptomCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredSymptoms = useMemo(() => {
    if (!searchQuery.trim()) return symptoms;

    const query = searchQuery.toLowerCase();
    return symptoms.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const groupedSymptoms = useMemo(() => {
    const groups: Partial<Record<SymptomCategory, typeof symptoms>> = {};
    filteredSymptoms.forEach((symptom) => {
      if (!groups[symptom.category]) {
        groups[symptom.category] = [];
      }
      groups[symptom.category]!.push(symptom);
    });
    return groups;
  }, [filteredSymptoms]);

  const isSelected = (symptomId: string) => selectedSymptomIds.includes(symptomId);
  const canSelect = !maxSelections || selectedSymptomIds.length < maxSelections;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search symptoms..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={colors.gray500}
      />

      <Text style={styles.selectionCount}>
        {selectedSymptomIds.length} selected
        {maxSelections ? ` (max ${maxSelections})` : ''}
      </Text>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedSymptoms).map(([category, categorySymptoms]) => {
          const isExpanded = expandedCategories.has(category as SymptomCategory);

          return (
            <View key={category} style={styles.categoryContainer}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category as SymptomCategory)}
              >
                <Text style={styles.categoryTitle}>
                  {category} ({categorySymptoms?.length || 0})
                </Text>
                <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
              </TouchableOpacity>

              {isExpanded &&
                categorySymptoms?.map((symptom) => {
                  const selected = isSelected(symptom.id);
                  const disabled = !selected && !canSelect;

                  return (
                    <TouchableOpacity
                      key={symptom.id}
                      style={[
                        styles.symptomButton,
                        selected && styles.symptomButtonSelected,
                        disabled && styles.symptomButtonDisabled,
                      ]}
                      onPress={() => onToggleSymptom(symptom.id)}
                      disabled={disabled}
                    >
                      <View style={styles.symptomContent}>
                        <Text
                          style={[
                            styles.symptomName,
                            selected && styles.symptomNameSelected,
                          ]}
                        >
                          {symptom.name}
                        </Text>
                        <Text style={styles.symptomDescription}>
                          {symptom.description}
                        </Text>
                      </View>
                      {selected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray900,
  },
  selectionCount: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: 8,
  },
  categoryTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  expandIcon: {
    fontSize: typography.sizes.xl,
    color: colors.primaryMain,
    fontWeight: typography.weights.bold as any,
  },
  symptomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  symptomButtonSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryMain,
  },
  symptomButtonDisabled: {
    opacity: 0.5,
  },
  symptomContent: {
    flex: 1,
    gap: spacing.xs,
  },
  symptomName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.gray900,
  },
  symptomNameSelected: {
    color: colors.primaryMain,
  },
  symptomDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
  checkmark: {
    fontSize: typography.sizes.xl,
    color: colors.primaryMain,
    fontWeight: typography.weights.bold as any,
    marginLeft: spacing.sm,
  },
});
