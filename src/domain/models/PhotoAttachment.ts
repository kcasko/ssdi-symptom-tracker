/**
 * Photo Attachment Model
 * Evidence multiplier for SSDI documentation
 */

export interface PhotoAttachment {
  id: string;
  
  // What this photo is attached to
  entityType: 'daily_log' | 'activity_log' | 'appointment' | 'medication' | 'limitation';
  entityId: string;
  
  // Photo metadata
  uri: string; // Local file system URI
  width?: number;
  height?: number;
  fileSize?: number;
  
  // When photo was taken/added
  capturedAt: string;
  addedAt: string;
  
  // Description and categorization
  caption?: string;
  category: PhotoCategory;
  tags?: string[];
  
  // Evidence strength
  isVisibleEvidence: boolean; // Swelling, rash, device, etc.
  
  // Optional metadata
  location?: string; // Body location if applicable
  notes?: string;
}

export type PhotoCategory =
  | 'symptom_visible'      // Rash, swelling, bruising, etc.
  | 'medical_device'       // Braces, canes, wheelchairs, CPAP, etc.
  | 'medication'           // Pill bottles, prescriptions
  | 'mobility_aid'         // Crutches, walker, wheelchair
  | 'adaptive_equipment'   // Shower chair, grabber, etc.
  | 'environment'          // Accessible parking, modifications
  | 'treatment'            // Ice packs, heating pads, compression
  | 'documentation'        // Medical forms, appointment cards
  | 'other';

/**
 * Create a new photo attachment
 */
export function createPhotoAttachment(
  id: string,
  entityType: PhotoAttachment['entityType'],
  entityId: string,
  uri: string,
  category: PhotoCategory
): PhotoAttachment {
  const now = new Date().toISOString();
  
  return {
    id,
    entityType,
    entityId,
    uri,
    capturedAt: now,
    addedAt: now,
    category,
    isVisibleEvidence: category !== 'other' && category !== 'documentation',
  };
}

/**
 * Get category display label
 */
export function getCategoryLabel(category: PhotoCategory): string {
  const labels: Record<PhotoCategory, string> = {
    symptom_visible: 'Visible Symptom',
    medical_device: 'Medical Device',
    medication: 'Medication',
    mobility_aid: 'Mobility Aid',
    adaptive_equipment: 'Adaptive Equipment',
    environment: 'Environment/Accessibility',
    treatment: 'Treatment Method',
    documentation: 'Documentation',
    other: 'Other',
  };
  return labels[category];
}

/**
 * Get category description for user guidance
 */
export function getCategoryDescription(category: PhotoCategory): string {
  const descriptions: Record<PhotoCategory, string> = {
    symptom_visible: 'Rashes, swelling, bruising, skin conditions',
    medical_device: 'CPAP, oxygen tank, nebulizer, monitoring devices',
    medication: 'Prescription bottles, medication organizers',
    mobility_aid: 'Cane, walker, wheelchair, crutches',
    adaptive_equipment: 'Shower chair, grabber tool, special utensils',
    environment: 'Handicap parking, home modifications, ramps',
    treatment: 'Ice packs, heating pads, compression garments',
    documentation: 'Appointment cards, medical forms, doctor notes',
    other: 'Other evidence',
  };
  return descriptions[category];
}

/**
 * Get evidence value rating for photo category
 * Higher value = stronger evidence for SSDI
 */
export function getEvidenceValue(category: PhotoCategory): 'high' | 'medium' | 'low' {
  const highValue: PhotoCategory[] = [
    'symptom_visible',
    'medical_device',
    'mobility_aid',
  ];
  
  const mediumValue: PhotoCategory[] = [
    'medication',
    'adaptive_equipment',
    'treatment',
  ];
  
  if (highValue.includes(category)) return 'high';
  if (mediumValue.includes(category)) return 'medium';
  return 'low';
}

/**
 * Get evidence value label for display
 */
export function getEvidenceValueLabel(category: PhotoCategory): string {
  const value = getEvidenceValue(category);
  return value.charAt(0).toUpperCase() + value.slice(1);
}
