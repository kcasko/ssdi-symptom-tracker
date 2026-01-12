/**
 * Limitations Screen
 * Manage functional limitations
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  TextInput,
  Switch
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton } from '../components';
import { useAppState } from '../state/useAppState';
import { LimitationCategory, LimitationFrequency, VariabilityLevel, Limitation } from '../domain/models/Limitation';

const LIMITATION_CATEGORIES: { value: LimitationCategory; label: string; description: string }[] = [
  { value: 'sitting', label: 'Sitting', description: 'Time limits for sitting' },
  { value: 'standing', label: 'Standing', description: 'Time limits for standing' },
  { value: 'walking', label: 'Walking', description: 'Distance/time limits for walking' },
  { value: 'lifting', label: 'Lifting', description: 'Weight limits for lifting' },
  { value: 'carrying', label: 'Carrying', description: 'Weight/distance limits for carrying' },
  { value: 'reaching', label: 'Reaching', description: 'Limitations in reaching overhead/forward' },
  { value: 'bending', label: 'Bending', description: 'Limitations in bending or stooping' },
  { value: 'climbing', label: 'Climbing', description: 'Limitations in climbing stairs/ladders' },
  { value: 'concentration', label: 'Concentration', description: 'Time limits for focused work' },
  { value: 'memory', label: 'Memory', description: 'Memory or recall difficulties' },
  { value: 'social', label: 'Social Interaction', description: 'Limits on social engagement' },
  { value: 'self_care', label: 'Self Care', description: 'Limitations in daily self-care tasks' },
  { value: 'fine_motor', label: 'Fine Motor', description: 'Hand dexterity limitations' },
  { value: 'gross_motor', label: 'Gross Motor', description: 'Large movement limitations' },
];

const FREQUENCY_OPTIONS: { value: LimitationFrequency; label: string }[] = [
  { value: 'always', label: 'Always' },
  { value: 'usually', label: 'Usually' },
  { value: 'often', label: 'Often' },
  { value: 'occasionally', label: 'Occasionally' },
];

const VARIABILITY_OPTIONS: { value: VariabilityLevel; label: string }[] = [
  { value: 'consistent', label: 'Consistent' },
  { value: 'some_variability', label: 'Some Variability' },
  { value: 'high_variability', label: 'High Variability' },
];

export const LimitationsScreen: React.FC = () => {
  const { activeProfile, limitations, addLimitation, updateLimitation, deleteLimitation } = useAppState();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [selectedCategory, setSelectedCategory] = useState<LimitationCategory | null>(null);
  const [timeMinutes, setTimeMinutes] = useState('');
  const [weightPounds, setWeightPounds] = useState('');
  const [frequency, setFrequency] = useState<LimitationFrequency>('usually');
  const [consequences, setConsequences] = useState('');
  const [accommodations, setAccommodations] = useState('');
  const [variability, setVariability] = useState<VariabilityLevel>('some_variability');
  const [variabilityNotes, setVariabilityNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const activeLimitations = limitations.filter(
    l => l.profileId === activeProfile?.id && l.isActive
  );

  const resetForm = () => {
    setSelectedCategory(null);
    setTimeMinutes('');
    setWeightPounds('');
    setFrequency('usually');
    setConsequences('');
    setAccommodations('');
    setVariability('some_variability');
    setVariabilityNotes('');
    setNotes('');
    setIsActive(true);
    setEditingId(null);
  };

  const loadLimitationForEdit = (limitation: Limitation) => {
    setSelectedCategory(limitation.category);
    setTimeMinutes(limitation.timeThreshold?.durationMinutes?.toString() || '');
    setWeightPounds(limitation.weightThreshold?.maxPounds?.toString() || '');
    setFrequency(limitation.frequency);
    setConsequences(limitation.consequences?.join(', ') || '');
    setAccommodations(limitation.accommodations?.join(', ') || '');
    setVariability(limitation.variability);
    setVariabilityNotes(limitation.variabilityNotes || '');
    setNotes(limitation.notes || '');
    setIsActive(limitation.isActive);
    setEditingId(limitation.id);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!activeProfile || !selectedCategory) {
      Alert.alert('Missing Information', 'Please select a limitation category');
      return;
    }

    try {
      const consequencesList = consequences.split(',').map(s => s.trim()).filter(s => s);
      const accommodationsList = accommodations.split(',').map(s => s.trim()).filter(s => s);
      
      const limitationData: Partial<Limitation> = {
        profileId: activeProfile.id,
        category: selectedCategory,
        frequency,
        consequences: consequencesList.length > 0 ? consequencesList : [],
        accommodations: accommodationsList.length > 0 ? accommodationsList : [],
        variability,
        variabilityNotes: variabilityNotes || undefined,
        notes: notes || undefined,
        isActive,
      };

      // Add time threshold if provided
      if (timeMinutes) {
        const mins = parseInt(timeMinutes);
        if (!isNaN(mins) && mins > 0) {
          limitationData.timeThreshold = {
            durationMinutes: mins,
            confidence: 'moderate' as const,
          };
        }
      }

      // Add weight threshold if provided
      if (weightPounds) {
        const lbs = parseInt(weightPounds);
        if (!isNaN(lbs) && lbs > 0) {
          limitationData.weightThreshold = {
            maxPounds: lbs,
            frequency: 'occasionally' as const,
          };
        }
      }

      if (editingId) {
        // Update existing
        const existingLimitation = limitations.find(l => l.id === editingId);
        if (existingLimitation) {
          await updateLimitation({
            ...existingLimitation,
            ...limitationData,
          } as Limitation);
        }
      } else {
        // Add new
        await addLimitation(limitationData);
      }

      setShowAddForm(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save limitation');
    }
  };

  const handleDelete = (limitationId: string) => {
    const limitation = limitations.find(l => l.id === limitationId);
    if (!limitation) return;

    const categoryInfo = LIMITATION_CATEGORIES.find(c => c.value === limitation.category);

    Alert.alert(
      'Delete Limitation',
      `Are you sure you want to delete this ${categoryInfo?.label || limitation.category} limitation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLimitation(limitationId);
            } catch {
              Alert.alert('Error', 'Failed to delete limitation');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Functional Limitations</Text>
        <Text style={styles.subtitle}>Track capacity limits and impacts</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Limitations */}
        {activeLimitations.length > 0 && !showAddForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Limitations</Text>
            {activeLimitations.map(limitation => {
              const category = LIMITATION_CATEGORIES.find(c => c.value === limitation.category);
              return (
                <View key={limitation.id} style={styles.limitationCard}>
                  <View style={styles.limitationHeader}>
                    <Text style={styles.limitationTitle}>{category?.label || limitation.category}</Text>
                    <View style={styles.limitationActions}>
                      <TouchableOpacity 
                        onPress={() => loadLimitationForEdit(limitation)}
                        style={styles.iconButton}
                      >
                        <Text style={styles.iconButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleDelete(limitation.id)}
                        style={styles.iconButton}
                      >
                        <Text style={styles.iconButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {limitation.timeThreshold && (
                    <Text style={styles.limitationText}>
                      ⏱️ Time Limit: {limitation.timeThreshold.durationMinutes} minutes
                    </Text>
                  )}
                  
                  {limitation.weightThreshold && (
                    <Text style={styles.limitationText}>
                      ⚖️ Weight Limit: {limitation.weightThreshold.pounds} lbs
                    </Text>
                  )}
                  
                  <Text style={styles.limitationText}>
                    📅 Frequency: {limitation.frequency.replace(/_/g, ' ')}
                  </Text>
                  
                  {limitation.consequences && limitation.consequences.length > 0 && (
                    <Text style={styles.limitationText}>
                      ⚠️ Consequences: {limitation.consequences.join(', ')}
                    </Text>
                  )}
                  
                  {limitation.accommodations && limitation.accommodations.length > 0 && (
                    <Text style={styles.limitationText}>
                      🛠️ Accommodations: {limitation.accommodations.join(', ')}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Add/Edit Form */}
        {showAddForm ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {editingId ? 'Edit Limitation' : 'Add Limitation'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryGrid}>
                {LIMITATION_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryButton,
                      selectedCategory === cat.value && styles.categoryButtonSelected
                    ]}
                    onPress={() => setSelectedCategory(cat.value)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      selectedCategory === cat.value && styles.categoryButtonTextSelected
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {(selectedCategory === 'sitting' || selectedCategory === 'standing' || selectedCategory === 'walking' || selectedCategory === 'concentration') && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Time Limit (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={timeMinutes}
                  onChangeText={setTimeMinutes}
                  placeholder="e.g., 30"
                  keyboardType="numeric"
                />
              </View>
            )}

            {(selectedCategory === 'lifting' || selectedCategory === 'carrying') && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Weight Limit (pounds)</Text>
                <TextInput
                  style={styles.input}
                  value={weightPounds}
                  onChangeText={setWeightPounds}
                  placeholder="e.g., 10"
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>How Often *</Text>
              <View style={styles.frequencyRow}>
                {FREQUENCY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.frequencyButton,
                      frequency === opt.value && styles.frequencyButtonSelected
                    ]}
                    onPress={() => setFrequency(opt.value)}
                  >
                    <Text style={[
                      styles.frequencyButtonText,
                      frequency === opt.value && styles.frequencyButtonTextSelected
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Consequences (comma-separated)</Text>
              <TextInput
                style={styles.textArea}
                value={consequences}
                onChangeText={setConsequences}
                placeholder="e.g., Pain increase, Fatigue, Need to rest"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Accommodations Used (comma-separated)</Text>
              <TextInput
                style={styles.textArea}
                value={accommodations}
                onChangeText={setAccommodations}
                placeholder="e.g., Frequent breaks, Special chair, Assistance"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Variability</Text>
              <View style={styles.frequencyRow}>
                {VARIABILITY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.frequencyButton,
                      variability === opt.value && styles.frequencyButtonSelected
                    ]}
                    onPress={() => setVariability(opt.value)}
                  >
                    <Text style={[
                      styles.frequencyButtonText,
                      variability === opt.value && styles.frequencyButtonTextSelected
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Additional Notes</Text>
              <TextInput
                style={styles.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional details about this limitation..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active Limitation</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: colors.gray300, true: colors.primary[300] }}
                  thumbColor={isActive ? colors.primaryMain : colors.white}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <BigButton
                label="Cancel"
                onPress={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                variant="secondary"
                fullWidth
              />
              <BigButton
                label={editingId ? 'Update' : 'Save'}
                onPress={handleSave}
                variant="primary"
                fullWidth
              />
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <BigButton
              label="+ Add Functional Limitation"
              onPress={() => setShowAddForm(true)}
              variant="primary"
              fullWidth
            />
            
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📋 About Limitations</Text>
              <Text style={styles.infoText}>
                Document your functional capacity limits:{'\n\n'}
                • How long you can perform activities{'\n'}
                • Weight or distance limits{'\n'}
                • What happens when limits are exceeded{'\n'}
                • Accommodations you use{'\n\n'}
                This helps establish patterns for SSDI documentation.
              </Text>
            </View>
          </View>
        )}

        {activeLimitations.length === 0 && !showAddForm && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No limitations documented yet</Text>
            <Text style={styles.emptySubtext}>
              Add limitations to track your functional capacity over time
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background.secondary 
  },
  header: { 
    padding: spacing.lg, 
    backgroundColor: colors.white, 
    gap: spacing.xs 
  },
  title: { 
    fontSize: typography.sizes.xxl, 
    fontWeight: typography.weights.bold as any, 
    color: colors.gray900 
  },
  subtitle: { 
    fontSize: typography.sizes.md, 
    color: colors.gray600 
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  limitationCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.warningMain,
    gap: spacing.xs,
  },
  limitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  limitationTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
    flex: 1,
  },
  limitationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  iconButtonText: {
    fontSize: 18,
  },
  limitationText: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    lineHeight: 20,
  },
  formGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.gray900,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray900,
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray900,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  categoryButtonSelected: {
    borderColor: colors.primaryMain,
    backgroundColor: colors.primary[50],
  },
  categoryButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
  },
  categoryButtonTextSelected: {
    color: colors.primaryMain,
    fontWeight: typography.weights.semibold as any,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  frequencyButtonSelected: {
    borderColor: colors.primaryMain,
    backgroundColor: colors.primary[50],
  },
  frequencyButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
  },
  frequencyButtonTextSelected: {
    color: colors.primaryMain,
    fontWeight: typography.weights.semibold as any,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    gap: spacing.xs,
  },
  infoTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.gray600,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    textAlign: 'center',
  },
});
