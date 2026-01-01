/**
 * PhotoPicker Component
 * Allows users to capture or select photos for evidence documentation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PhotoService } from '../services/PhotoService';
import { PhotoCategory, PhotoAttachment } from '../domain/models/PhotoAttachment';
import { colors as COLORS } from '../theme/colors';
import { spacing as SPACING } from '../theme/spacing';

interface PhotoPickerProps {
  entityType: string;
  entityId: string;
  category?: PhotoCategory;
  onPhotoAdded: (photo: PhotoAttachment) => void;
  maxPhotos?: number;
  currentPhotoCount?: number;
}

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  symptom_visible: 'Visible Symptom',
  medical_device: 'Medical Device',
  mobility_aid: 'Mobility Aid',
  medication: 'Medication',
  adaptive_equipment: 'Adaptive Equipment',
  environment: 'Environment/Setup',
  treatment: 'Treatment',
  documentation: 'Medical Documentation',
  other: 'Other Evidence',
};

const CATEGORY_DESCRIPTIONS: Record<PhotoCategory, string> = {
  symptom_visible: 'Rash, swelling, bruising, tremors, etc.',
  medical_device: 'CPAP, oxygen, monitors, etc.',
  mobility_aid: 'Wheelchair, walker, cane, braces',
  medication: 'Prescription bottles, pill organizers',
  adaptive_equipment: 'Shower chair, grab bars, special utensils',
  environment: 'Bedroom setup, accessibility modifications',
  treatment: 'Ice packs, compression, elevation',
  documentation: 'Lab results, doctor notes, prescriptions',
  other: 'Any other relevant visual evidence',
};

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  entityType,
  entityId,
  category,
  onPhotoAdded,
  maxPhotos = 10,
  currentPhotoCount = 0,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | null>(category || null);
  const [loading, setLoading] = useState(false);

  const canAddMore = currentPhotoCount < maxPhotos;

  const handleTakePhoto = async () => {
    if (!canAddMore) {
      Alert.alert('Limit Reached', `Maximum ${maxPhotos} photos per entry`);
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select what type of evidence this photo shows');
      return;
    }

    try {
      setLoading(true);
      const result = await PhotoService.takePhoto();
      
      if (result) {
        const photo = await PhotoService.createAttachment(
          result,
          entityType,
          entityId,
          selectedCategory
        );
        onPhotoAdded(photo);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Failed to take photo. Please check camera permissions.');
      console.error('Take photo error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    if (!canAddMore) {
      Alert.alert('Limit Reached', `Maximum ${maxPhotos} photos per entry`);
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select what type of evidence this photo shows');
      return;
    }

    try {
      setLoading(true);
      const result = await PhotoService.pickPhoto();
      
      if (result) {
        const photo = await PhotoService.createAttachment(
          result,
          entityType,
          entityId,
          selectedCategory
        );
        onPhotoAdded(photo);
      }
    } catch (error) {
      Alert.alert('Photo Error', 'Failed to select photo. Please check permissions.');
      console.error('Pick photo error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickMultiple = async () => {
    if (!canAddMore) {
      Alert.alert('Limit Reached', `Maximum ${maxPhotos} photos per entry`);
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select what type of evidence this photo shows');
      return;
    }

    try {
      setLoading(true);
      const results = await PhotoService.pickMultiplePhotos();
      
      if (results && results.length > 0) {
        const remaining = maxPhotos - currentPhotoCount;
        const photosToAdd = results.slice(0, remaining);
        
        if (results.length > remaining) {
          Alert.alert(
            'Photo Limit',
            `Only adding ${remaining} photos due to ${maxPhotos} photo limit`
          );
        }

        for (const result of photosToAdd) {
          const photo = await PhotoService.createAttachment(
            result,
            entityType,
            entityId,
            selectedCategory
          );
          onPhotoAdded(photo);
        }
      }
    } catch (error) {
      Alert.alert('Photo Error', 'Failed to select photos. Please check permissions.');
      console.error('Pick multiple photos error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Processing photo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Selection */}
      <Text style={styles.sectionTitle}>What does this photo show?</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {(Object.keys(CATEGORY_LABELS) as PhotoCategory[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextSelected,
              ]}
            >
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedCategory && (
        <Text style={styles.categoryDescription}>
          {CATEGORY_DESCRIPTIONS[selectedCategory]}
        </Text>
      )}

      {/* Photo Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, !canAddMore && styles.actionButtonDisabled]}
          onPress={handleTakePhoto}
          disabled={!canAddMore}
        >
          <MaterialIcons name="photo-camera" size={24} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !canAddMore && styles.actionButtonDisabled]}
          onPress={handlePickPhoto}
          disabled={!canAddMore}
        >
          <MaterialIcons name="photo-library" size={24} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Choose Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !canAddMore && styles.actionButtonDisabled]}
          onPress={handlePickMultiple}
          disabled={!canAddMore}
        >
          <MaterialIcons name="collections" size={24} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Choose Multiple</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Count */}
      <Text style={styles.photoCount}>
        {currentPhotoCount} / {maxPhotos} photos
      </Text>

      {/* Evidence Tip */}
      <View style={styles.tipContainer}>
        <MaterialIcons name="lightbulb-outline" size={20} color={COLORS.warning} />
        <Text style={styles.tipText}>
          Visual evidence significantly strengthens your disability case
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  categoryScroll: {
    marginBottom: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  categoryChipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  photoCount: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
