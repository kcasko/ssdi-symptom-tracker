/**
 * Limitation Model
 * Captures baseline functional limitations - raw evidence layer
 */

export interface Limitation {
  id: string;
  profileId: string;
  
  // When this limitation was set/updated
  createdAt: string;
  updatedAt: string;
  
  // Limitation category
  category: LimitationCategory;
  
  // Time-based threshold (how long before problems start)
  timeThreshold?: TimeThreshold;
  
  // Weight/distance threshold if applicable
  weightThreshold?: WeightThreshold;
  distanceThreshold?: DistanceThreshold;
  
  // Frequency of limitation (how often it applies)
  frequency: LimitationFrequency;
  
  // What happens when limit is exceeded
  consequences: string[];
  
  // Accommodations or modifications used
  accommodations?: string[];
  
  // Variability
  variability: VariabilityLevel;
  variabilityNotes?: string;
  
  // Free-form notes
  notes?: string;
  
  // Active status (limitations can be archived)
  isActive: boolean;
}

export type LimitationCategory =
  | 'sitting'
  | 'standing'
  | 'walking'
  | 'lifting'
  | 'carrying'
  | 'reaching'
  | 'bending'
  | 'climbing'
  | 'concentration'
  | 'memory'
  | 'social'
  | 'self_care'
  | 'fine_motor'
  | 'gross_motor';

export interface TimeThreshold {
  // Duration before symptoms start/worsen
  durationMinutes: number;
  
  // Range for variability
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  
  // Confidence in this threshold
  confidence: 'low' | 'moderate' | 'high';
}

export interface WeightThreshold {
  // Maximum weight in pounds
  maxPounds: number;
  
  // Frequency able to lift this amount
  frequency: 'never' | 'rarely' | 'occasionally' | 'frequently';
  
  notes?: string;
}

export interface DistanceThreshold {
  // Maximum distance
  maxFeet?: number;
  maxBlocks?: number;
  
  // With or without rest breaks
  withRests: boolean;
  restFrequency?: string;
  
  notes?: string;
}

export type LimitationFrequency =
  | 'always' // 100% of the time
  | 'usually' // 75-99%
  | 'often' // 50-74%
  | 'sometimes' // 25-49%
  | 'occasionally' // 10-24%
  | 'rarely'; // <10%

export type VariabilityLevel =
  | 'consistent' // Same every day
  | 'some_variability' // Varies somewhat
  | 'high_variability' // Varies significantly
  | 'unpredictable'; // No pattern

/**
 * Create a new limitation with defaults
 */
export function createLimitation(
  id: string,
  profileId: string,
  category: LimitationCategory
): Limitation {
  const now = new Date().toISOString();
  
  return {
    id,
    profileId,
    createdAt: now,
    updatedAt: now,
    category,
    frequency: 'usually',
    consequences: [],
    variability: 'some_variability',
    isActive: true,
  };
}

/**
 * Get display label for limitation category
 */
export function getLimitationCategoryLabel(category: LimitationCategory): string {
  const labels: Record<LimitationCategory, string> = {
    sitting: 'Sitting',
    standing: 'Standing',
    walking: 'Walking',
    lifting: 'Lifting',
    carrying: 'Carrying',
    reaching: 'Reaching',
    bending: 'Bending',
    climbing: 'Climbing (stairs)',
    concentration: 'Concentration',
    memory: 'Memory',
    social: 'Social Functioning',
    self_care: 'Self Care',
    fine_motor: 'Fine Motor Skills',
    gross_motor: 'Gross Motor Skills',
  };
  return labels[category] || category;
}

/**
 * Get SSDI-friendly frequency description
 */
export function getFrequencyDescription(frequency: LimitationFrequency): string {
  const descriptions: Record<LimitationFrequency, string> = {
    always: 'at all times',
    usually: 'most of the time',
    often: 'frequently',
    sometimes: 'sometimes',
    occasionally: 'occasionally',
    rarely: 'rarely',
  };
  return descriptions[frequency] || frequency;
}
