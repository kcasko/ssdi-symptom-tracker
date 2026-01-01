/**
 * Appointment Model
 * Tracks medical appointments for documentation
 */

export interface Appointment {
  id: string;
  profileId: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Appointment details
  appointmentDate: string;
  appointmentTime?: string; // HH:mm
  
  // Provider info
  providerName: string;
  providerType: ProviderType;
  facilityName?: string;
  
  // Appointment purpose
  purpose: AppointmentPurpose;
  purposeDetails?: string;
  
  // Status
  status: AppointmentStatus;
  
  // What was discussed (post-appointment)
  discussedSymptoms?: string[];
  discussedLimitations?: string[];
  
  // Outcomes
  outcomes?: AppointmentOutcome[];
  
  // Follow-up
  followUpScheduled?: boolean;
  followUpDate?: string;
  
  // Notes
  preAppointmentNotes?: string;
  postAppointmentNotes?: string;
  
  // Photo evidence
  photos?: string[]; // Photo attachment IDs
}

export type ProviderType =
  | 'primary_care'
  | 'specialist'
  | 'mental_health'
  | 'physical_therapy'
  | 'occupational_therapy'
  | 'pain_management'
  | 'rheumatology'
  | 'neurology'
  | 'orthopedics'
  | 'psychiatry'
  | 'psychology'
  | 'other';

export type AppointmentPurpose =
  | 'initial_evaluation'
  | 'follow_up'
  | 'medication_review'
  | 'test_results'
  | 'treatment'
  | 'therapy_session'
  | 'ssdi_evaluation'
  | 'paperwork'
  | 'other';

export type AppointmentStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show';

export interface AppointmentOutcome {
  type: OutcomeType;
  description: string;
}

export type OutcomeType =
  | 'new_diagnosis'
  | 'diagnosis_confirmed'
  | 'medication_change'
  | 'new_medication'
  | 'referral'
  | 'test_ordered'
  | 'treatment_plan'
  | 'restrictions_documented'
  | 'forms_completed'
  | 'other';

/**
 * Create a new appointment with defaults
 */
export function createAppointment(
  id: string,
  profileId: string,
  providerName: string,
  appointmentDate: string
): Appointment {
  const now = new Date().toISOString();
  
  return {
    id,
    profileId,
    createdAt: now,
    updatedAt: now,
    appointmentDate,
    providerName,
    providerType: 'primary_care',
    purpose: 'follow_up',
    status: 'scheduled',
  };
}

/**
 * Get provider type display label
 */
export function getProviderTypeLabel(type: ProviderType): string {
  const labels: Record<ProviderType, string> = {
    primary_care: 'Primary Care',
    specialist: 'Specialist',
    mental_health: 'Mental Health',
    physical_therapy: 'Physical Therapy',
    occupational_therapy: 'Occupational Therapy',
    pain_management: 'Pain Management',
    rheumatology: 'Rheumatology',
    neurology: 'Neurology',
    orthopedics: 'Orthopedics',
    psychiatry: 'Psychiatry',
    psychology: 'Psychology',
    other: 'Other',
  };
  return labels[type] || type;
}

/**
 * Get purpose display label
 */
export function getPurposeLabel(purpose: AppointmentPurpose): string {
  const labels: Record<AppointmentPurpose, string> = {
    initial_evaluation: 'Initial Evaluation',
    follow_up: 'Follow-up Visit',
    medication_review: 'Medication Review',
    test_results: 'Test Results',
    treatment: 'Treatment',
    therapy_session: 'Therapy Session',
    ssdi_evaluation: 'SSDI Evaluation',
    paperwork: 'Paperwork/Forms',
    other: 'Other',
  };
  return labels[purpose] || purpose;
}
