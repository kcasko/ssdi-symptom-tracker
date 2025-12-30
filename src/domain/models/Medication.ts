/**
 * Medication Model
 * Tracks medications for context in reports
 */

export interface Medication {
  id: string;
  profileId: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Medication details
  name: string;
  genericName?: string;
  dosage: string;
  frequency: MedicationFrequency;
  
  // Purpose
  purpose: string[]; // What symptoms/conditions it's for
  
  // Prescriber info (optional)
  prescriber?: string;
  
  // Dates
  startDate?: string;
  endDate?: string;
  
  // Side effects experienced
  sideEffects?: string[];
  
  // Effectiveness
  effectiveness?: EffectivenessRating;
  effectivenessNotes?: string;
  
  // Notes
  notes?: string;
  
  // Active status
  isActive: boolean;
  discontinuedReason?: string;
}

export type MedicationFrequency =
  | 'as_needed'
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'every_4_hours'
  | 'every_6_hours'
  | 'every_8_hours'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'other';

export type EffectivenessRating =
  | 'not_effective'
  | 'minimally_effective'
  | 'somewhat_effective'
  | 'moderately_effective'
  | 'very_effective';

/**
 * Create a new medication with defaults
 */
export function createMedication(
  id: string,
  profileId: string,
  name: string,
  dosage: string
): Medication {
  const now = new Date().toISOString();
  
  return {
    id,
    profileId,
    createdAt: now,
    updatedAt: now,
    name,
    dosage,
    frequency: 'as_needed',
    purpose: [],
    isActive: true,
  };
}

/**
 * Get frequency display label
 */
export function getFrequencyLabel(frequency: MedicationFrequency): string {
  const labels: Record<MedicationFrequency, string> = {
    as_needed: 'As needed',
    once_daily: 'Once daily',
    twice_daily: 'Twice daily',
    three_times_daily: 'Three times daily',
    four_times_daily: 'Four times daily',
    every_4_hours: 'Every 4 hours',
    every_6_hours: 'Every 6 hours',
    every_8_hours: 'Every 8 hours',
    weekly: 'Weekly',
    biweekly: 'Every two weeks',
    monthly: 'Monthly',
    other: 'Other',
  };
  return labels[frequency] || frequency;
}

/**
 * Get effectiveness display label
 */
export function getEffectivenessLabel(rating: EffectivenessRating): string {
  const labels: Record<EffectivenessRating, string> = {
    not_effective: 'Not effective',
    minimally_effective: 'Minimally effective',
    somewhat_effective: 'Somewhat effective',
    moderately_effective: 'Moderately effective',
    very_effective: 'Very effective',
  };
  return labels[rating] || rating;
}
