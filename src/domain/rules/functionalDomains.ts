/**
 * Functional Domain Mappings
 * Internal classification system for SSA-aligned reporting
 * NOT LABELED AS SSA IN UI - used only for logical grouping
 */

import { FunctionalDomain } from '../models/EvidenceMode';

/**
 * Symptom to functional domain mappings
 * Maps common symptoms to their functional impact areas
 */
export const SYMPTOM_FUNCTIONAL_MAPPINGS: Record<string, FunctionalDomain[]> = {
  // Pain symptoms
  'back-pain': ['sitting', 'standing', 'walking', 'lifting', 'carrying', 'reaching'],
  'neck-pain': ['sitting', 'concentration', 'handling'],
  'joint-pain': ['walking', 'standing', 'lifting', 'carrying', 'reaching', 'handling'],
  'leg-pain': ['walking', 'standing', 'sitting'],
  'foot-pain': ['walking', 'standing'],
  'headache': ['concentration', 'persistence', 'pace'],
  'migraine': ['concentration', 'persistence', 'pace', 'social_interaction', 'attendance'],
  
  // Fatigue and energy
  'fatigue': ['persistence', 'pace', 'concentration', 'standing', 'walking'],
  'weakness': ['lifting', 'carrying', 'standing', 'walking', 'reaching'],
  'exhaustion': ['persistence', 'pace', 'attendance', 'recovery_time'],
  
  // Cognitive symptoms
  'brain-fog': ['concentration', 'persistence', 'pace'],
  'memory-issues': ['concentration', 'persistence'],
  'confusion': ['concentration', 'social_interaction'],
  'difficulty-focusing': ['concentration', 'persistence', 'pace'],
  
  // Mobility symptoms
  'stiffness': ['walking', 'standing', 'sitting', 'reaching', 'handling'],
  'mobility-issues': ['walking', 'standing', 'sitting', 'lifting', 'carrying'],
  'balance-issues': ['walking', 'standing'],
  'dizziness': ['walking', 'standing', 'concentration'],
  
  // Respiratory
  'shortness-of-breath': ['walking', 'lifting', 'carrying', 'persistence', 'pace'],
  'breathing-difficulty': ['walking', 'lifting', 'carrying', 'persistence'],
  
  // Mental health
  'anxiety': ['concentration', 'social_interaction', 'attendance', 'persistence'],
  'depression': ['persistence', 'pace', 'social_interaction', 'attendance'],
  'panic': ['social_interaction', 'attendance', 'concentration'],
  
  // Sensory
  'sensitivity-light': ['concentration', 'attendance'],
  'sensitivity-noise': ['concentration', 'social_interaction'],
  'sensitivity-touch': ['handling', 'social_interaction'],
  
  // Other
  'nausea': ['concentration', 'persistence', 'attendance'],
  'tremor': ['handling', 'concentration'],
  'spasm': ['sitting', 'standing', 'walking', 'concentration'],
};

/**
 * Activity to functional domain mappings
 * Maps activities to the functional domains they test
 */
export const ACTIVITY_FUNCTIONAL_MAPPINGS: Record<string, FunctionalDomain[]> = {
  // Sitting activities
  'desk-work': ['sitting', 'concentration', 'persistence', 'handling'],
  'computer-use': ['sitting', 'concentration', 'persistence', 'handling'],
  'reading': ['sitting', 'concentration'],
  'driving': ['sitting', 'concentration', 'handling'],
  'watching-tv': ['sitting'],
  
  // Standing activities
  'cooking': ['standing', 'handling', 'reaching', 'persistence'],
  'washing-dishes': ['standing', 'handling', 'reaching'],
  'ironing': ['standing', 'handling', 'persistence'],
  'standing-conversation': ['standing', 'social_interaction'],
  
  // Walking activities
  'walking': ['walking', 'persistence', 'pace'],
  'shopping': ['walking', 'standing', 'carrying', 'persistence'],
  'errands': ['walking', 'standing', 'persistence', 'pace'],
  
  // Lifting/carrying
  'lifting-light': ['lifting', 'carrying', 'handling'],
  'lifting-moderate': ['lifting', 'carrying', 'handling', 'standing'],
  'lifting-heavy': ['lifting', 'carrying', 'handling', 'standing', 'walking'],
  'carrying-groceries': ['carrying', 'walking', 'handling'],
  'carrying-laundry': ['carrying', 'walking', 'handling'],
  
  // Reaching/handling
  'overhead-reach': ['reaching', 'standing', 'lifting'],
  'cleaning': ['reaching', 'handling', 'standing', 'walking', 'persistence'],
  'organizing': ['reaching', 'handling', 'persistence'],
  
  // Social/cognitive
  'social-event': ['social_interaction', 'persistence', 'concentration'],
  'phone-call': ['social_interaction', 'concentration'],
  'meeting': ['sitting', 'concentration', 'social_interaction', 'persistence'],
  
  // Physical exercise
  'exercise-light': ['persistence', 'pace', 'walking', 'standing'],
  'exercise-moderate': ['persistence', 'pace', 'walking', 'standing', 'recovery_time'],
  'exercise-vigorous': ['persistence', 'pace', 'walking', 'standing', 'recovery_time'],
  'stretching': ['reaching', 'handling'],
  'physical-therapy': ['persistence', 'recovery_time'],
  
  // Household
  'laundry': ['standing', 'walking', 'carrying', 'reaching', 'persistence'],
  'vacuuming': ['standing', 'walking', 'handling', 'persistence', 'pace'],
  'mopping': ['standing', 'walking', 'handling', 'persistence'],
  'yard-work': ['standing', 'walking', 'lifting', 'carrying', 'persistence', 'recovery_time'],
  
  // Personal care
  'bathing': ['standing', 'reaching', 'handling'],
  'dressing': ['standing', 'reaching', 'handling'],
  'grooming': ['standing', 'sitting', 'handling', 'reaching'],
};

/**
 * Functional domain display information
 * Used in reports for grouping data
 */
export const FUNCTIONAL_DOMAIN_INFO: Record<FunctionalDomain, { label: string; description: string }> = {
  sitting: {
    label: 'Sitting',
    description: 'Ability to sit for extended periods',
  },
  standing: {
    label: 'Standing',
    description: 'Ability to stand for extended periods',
  },
  walking: {
    label: 'Walking',
    description: 'Ability to walk distances and durations',
  },
  lifting: {
    label: 'Lifting',
    description: 'Ability to lift and move objects',
  },
  carrying: {
    label: 'Carrying',
    description: 'Ability to carry objects',
  },
  reaching: {
    label: 'Reaching',
    description: 'Ability to reach overhead or extended positions',
  },
  handling: {
    label: 'Handling',
    description: 'Ability to use hands for fine motor tasks',
  },
  concentration: {
    label: 'Concentration',
    description: 'Ability to focus and maintain attention',
  },
  persistence: {
    label: 'Persistence',
    description: 'Ability to sustain activity over time',
  },
  pace: {
    label: 'Pace',
    description: 'Ability to maintain work pace',
  },
  social_interaction: {
    label: 'Social Interaction',
    description: 'Ability to interact appropriately with others',
  },
  attendance: {
    label: 'Attendance',
    description: 'Ability to maintain regular attendance',
  },
  recovery_time: {
    label: 'Recovery Time',
    description: 'Time needed to recover after activity',
  },
};

/**
 * Get functional domains for a symptom
 */
export function getSymptomFunctionalDomains(symptomId: string): FunctionalDomain[] {
  return SYMPTOM_FUNCTIONAL_MAPPINGS[symptomId] || [];
}

/**
 * Get functional domains for an activity
 */
export function getActivityFunctionalDomains(activityId: string): FunctionalDomain[] {
  return ACTIVITY_FUNCTIONAL_MAPPINGS[activityId] || [];
}

/**
 * Get all affected functional domains from multiple symptoms/activities
 */
export function getAffectedDomains(
  symptomIds: string[],
  activityIds: string[]
): FunctionalDomain[] {
  const domains = new Set<FunctionalDomain>();
  
  symptomIds.forEach((id) => {
    const symptomDomains = getSymptomFunctionalDomains(id);
    symptomDomains.forEach((d) => domains.add(d));
  });
  
  activityIds.forEach((id) => {
    const activityDomains = getActivityFunctionalDomains(id);
    activityDomains.forEach((d) => domains.add(d));
  });
  
  return Array.from(domains);
}
