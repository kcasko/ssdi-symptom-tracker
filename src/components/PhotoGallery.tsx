/**
 * PhotoGallery Component
 * Displays attached photos with delete functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PhotoAttachment, getEvidenceValueLabel, getCategoryLabel } from '../domain/models/PhotoAttachment';
import { colors as COLORS } from '../theme/colors';
import { spacing as SPACING } from '../theme/spacing';

const { width, height } = Dimensions.get('window');

interface PhotoGalleryProps {
  photos: PhotoAttachment[];
  onDeletePhoto: (photoId: string) => void;
  editable?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onDeletePhoto,
  editable = true,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoAttachment | null>(null);

  if (photos.length === 0) {
    return null;
  }

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Remove this photo? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeletePhoto(photoId),
        },
      ]
    );
  };

  const renderThumbnail = (photo: PhotoAttachment) => {
    const evidenceValue = getEvidenceValueLabel(photo.category);
    const evidenceColor = 
      evidenceValue === 'High' ? COLORS.success.main :
      evidenceValue === 'Medium' ? COLORS.warning.main :
      COLORS.text.secondary;

    return (
      <TouchableOpacity
        key={photo.id}
        style={styles.thumbnailContainer}
        onPress={() => setSelectedPhoto(photo)}
      >
        <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
        
        {/* Evidence Badge */}
        <View style={[styles.evidenceBadge, { backgroundColor: evidenceColor as string }]}>
          <Text style={styles.evidenceBadgeText}>
            {evidenceValue}
          </Text>
        </View>

        {/* Delete Button */}
        {editable && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePhoto(photo.id)}
          >
            <MaterialIcons name="close" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Category Label */}
        <View style={styles.categoryLabel}>
          <Text style={styles.categoryLabelText} numberOfLines={1}>
            {getCategoryLabel(photo.category)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFullPhoto = () => {
    if (!selectedPhoto) return null;

    const evidenceValue = getEvidenceValueLabel(selectedPhoto.category);

    return (
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedPhoto(null)}
          >
            <View style={styles.modalContent}>
              <Image 
                source={{ uri: selectedPhoto.uri }} 
                style={styles.fullImage}
                resizeMode="contain"
              />

              {/* Photo Info */}
              <View style={styles.photoInfo}>
                <View style={styles.photoInfoRow}>
                  <Text style={styles.photoInfoLabel}>Type:</Text>
                  <Text style={styles.photoInfoValue}>
                    {getCategoryLabel(selectedPhoto.category)}
                  </Text>
                </View>

                <View style={styles.photoInfoRow}>
                  <Text style={styles.photoInfoLabel}>Evidence Value:</Text>
                  <Text style={[styles.photoInfoValue, { color: 
                    evidenceValue === 'High' ? COLORS.success.main :
                    evidenceValue === 'Medium' ? COLORS.warning.main :
                    COLORS.text.secondary
                  }]}>
                    {evidenceValue}
                  </Text>
                </View>

                {selectedPhoto.caption && (
                  <View style={styles.photoInfoRow}>
                    <Text style={styles.photoInfoLabel}>Notes:</Text>
                    <Text style={styles.photoInfoValue}>
                      {selectedPhoto.caption}
                    </Text>
                  </View>
                )}

                <View style={styles.photoInfoRow}>
                  <Text style={styles.photoInfoLabel}>Taken:</Text>
                  <Text style={styles.photoInfoValue}>
                    {new Date(selectedPhoto.capturedAt).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <MaterialIcons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="photo-library" size={20} color={COLORS.primary[500]} />
        <Text style={styles.title}>Photo Evidence ({photos.length})</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gallery}
      >
        {photos.map(renderThumbnail)}
      </ScrollView>

      {renderFullPhoto()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  gallery: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  thumbnailContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.background.secondary,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  evidenceBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  evidenceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  deleteButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
  },
  categoryLabelText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  fullImage: {
    width: width - SPACING.xl * 2,
    height: height * 0.6,
    borderRadius: 8,
  },
  photoInfo: {
    width: '100%',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  photoInfoRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  photoInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    width: 100,
  },
  photoInfoValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: SPACING.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
