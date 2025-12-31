/**
 * ActivityPicker Component
 * Searchable activity selector organized by category
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
import { ACTIVITIES as activities, ActivityCategory } from '../data/activities';

interface ActivityPickerProps {
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string) => void;
}

export const ActivityPicker: React.FC<ActivityPickerProps> = ({
  selectedActivityId,
  onSelectActivity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<ActivityCategory>>(new Set());

  const toggleCategory = (category: ActivityCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities;

    const query = searchQuery.toLowerCase();
    return activities.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const groupedActivities = useMemo(() => {
    const groups: Partial<Record<ActivityCategory, typeof activities>> = {};
    filteredActivities.forEach((activity) => {
      if (!groups[activity.category]) {
        groups[activity.category] = [];
      }
      groups[activity.category]!.push(activity);
    });
    return groups;
  }, [filteredActivities]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search activities..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={colors.gray500}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedActivities).map(([category, categoryActivities]) => {
          const isExpanded = expandedCategories.has(category as ActivityCategory);

          return (
            <View key={category} style={styles.categoryContainer}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category as ActivityCategory)}
              >
                <Text style={styles.categoryTitle}>
                  {category} ({categoryActivities?.length || 0})
                </Text>
                <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
              </TouchableOpacity>

              {isExpanded &&
                categoryActivities?.map((activity) => {
                  const selected = selectedActivityId === activity.id;

                  return (
                    <TouchableOpacity
                      key={activity.id}
                      style={[
                        styles.activityButton,
                        selected && styles.activityButtonSelected,
                      ]}
                      onPress={() => onSelectActivity(activity.id)}
                    >
                      <View style={styles.activityContent}>
                        <Text
                          style={[
                            styles.activityName,
                            selected && styles.activityNameSelected,
                          ]}
                        >
                          {activity.name}
                        </Text>
                        <Text style={styles.activityDescription}>
                          {activity.description}
                        </Text>
                      </View>
                      {selected && <Text style={styles.checkmark}>✓</Text>}
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
    marginBottom: spacing.md,
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
  activityButton: {
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
  activityButtonSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryMain,
  },
  activityContent: {
    flex: 1,
    gap: spacing.xs,
  },
  activityName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.gray900,
  },
  activityNameSelected: {
    color: colors.primaryMain,
  },
  activityDescription: {
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
