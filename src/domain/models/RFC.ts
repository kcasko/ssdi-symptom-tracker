/**
 * Residual Functional Capacity (RFC) Model
 * Critical SSDI assessment - what work activities you can still perform
 * 
 * RFC built from actual log data carries authoritative weight
 * RFC from self-assessment alone looks speculative
 */

export interface RFC {
  id: string;
  profileId: string;
  
  // Assessment period
  assessmentStartDate: string;
  assessmentEndDate: string;
  generatedAt: string;
  
  // Physical capacity
  exertionalLimitations: ExertionalCapacity;
  posturalLimitations: PosturalLimitations;
  manipulativeLimitations: ManipulativeLimitations;
  
  // Environmental limitations
  environmentalLimitations: EnvironmentalLimitations;
  
  // Mental/cognitive capacity
  mentalLimitations: MentalLimitations;
  
  // Supporting evidence from logs
  evidenceSummary: EvidenceSummary;
  
  // Overall assessment
  overallRating: 'sedentary' | 'light' | 'medium' | 'heavy' | 'very_heavy';
  canWorkFullTime: boolean;
  requiresAccommodations: string[];
  
  notes?: string;
}

/**
 * Exertional Capacity - Sitting, Standing, Walking, Lifting
 */
export interface ExertionalCapacity {
  // Sitting capacity (hours per 8-hour day)
  sitting: {
    maxContinuousMinutes: number;
    maxTotalHours: number;
    requiresBreaks: boolean;
    breakFrequencyMinutes?: number;
    evidence: string[]; // Log IDs supporting this limitation
  };
  
  // Standing capacity (hours per 8-hour day)
  standing: {
    maxContinuousMinutes: number;
    maxTotalHours: number;
    requiresBreaks: boolean;
    breakFrequencyMinutes?: number;
    evidence: string[];
  };
  
  // Walking capacity (hours per 8-hour day)
  walking: {
    maxContinuousMinutes: number;
    maxTotalHours: number;
    maxDistanceFeet?: number;
    requiresAssistiveDevice: boolean;
    assistiveDeviceType?: string;
    evidence: string[];
  };
  
  // Lifting/Carrying capacity
  lifting: {
    maxWeightPoundsOccasional: number; // 1/3 of day
    maxWeightPoundsFrequent: number;   // 1/3 to 2/3 of day
    maxWeightPoundsConstant: number;   // 2/3+ of day
    evidence: string[];
  };
  
  // Pushing/Pulling capacity
  pushPull: {
    limitedBeyondLifting: boolean;
    maxForcePounds?: number;
    affectedLimbs?: ('left_arm' | 'right_arm' | 'left_leg' | 'right_leg')[];
    evidence: string[];
  };
}

/**
 * Postural Limitations - Bending, stooping, kneeling, etc.
 */
export interface PosturalLimitations {
  stooping: LimitationLevel;      // Bending body downward/forward
  kneeling: LimitationLevel;      // Bending legs to rest on knees
  crouching: LimitationLevel;     // Bending body downward/forward, bending legs
  crawling: LimitationLevel;      // Moving on hands and knees
  climbing: {
    stairs: LimitationLevel;
    ladders: LimitationLevel;
    ramps: LimitationLevel;
  };
  balancing: LimitationLevel;     // Maintaining body equilibrium
  
  evidence: Record<string, string[]>; // Category -> log IDs
}

/**
 * Manipulative Limitations - Use of hands, fingers, arms
 */
export interface ManipulativeLimitations {
  reaching: {
    overhead: LimitationLevel;
    forward: LimitationLevel;
    lateral: LimitationLevel;
    affectedSides?: ('left' | 'right' | 'both')[];
  };
  
  handling: LimitationLevel;      // Seizing, holding, grasping
  fingering: LimitationLevel;     // Picking, pinching, typing
  feeling: LimitationLevel;       // Perceiving attributes by touch
  
  evidence: Record<string, string[]>;
}

/**
 * Environmental Limitations - Temperature, noise, heights, etc.
 */
export interface EnvironmentalLimitations {
  heights: boolean;               // Avoid unprotected heights
  movingMechanicalParts: boolean; // Avoid machinery
  operatingVehicle: boolean;      // Cannot operate motor vehicle
  
  humidity: LimitationLevel;
  wetness: LimitationLevel;
  dust: LimitationLevel;
  odors: LimitationLevel;
  fumes: LimitationLevel;
  
  temperature: {
    extremeCold: boolean;
    extremeHeat: boolean;
    rapidChanges: boolean;
  };
  
  noise: {
    loudNoise: boolean;
    constantNoise: boolean;
  };
  
  vibration: LimitationLevel;
  
  evidence: Record<string, string[]>;
}

/**
 * Mental/Cognitive Limitations
 */
export interface MentalLimitations {
  // Concentration and persistence
  concentration: {
    maxContinuousMinutes: number;
    requiresFrequentBreaks: boolean;
    distractedByPain: boolean;
    distractedBySymptoms: boolean;
    evidence: string[];
  };
  
  // Memory
  memory: {
    shortTermImpaired: boolean;
    longTermImpaired: boolean;
    forgetsMedications: boolean;
    forgetsAppointments: boolean;
    evidence: string[];
  };
  
  // Social interaction
  social: {
    limitedPublicContact: boolean;
    limitedCoworkerContact: boolean;
    limitedSupervisorContact: boolean;
    evidenceOfIsolation: boolean;
    evidence: string[];
  };
  
  // Pace and persistence
  pace: {
    belowNormalPace: boolean;
    cannotMeetQuotas: boolean;
    requiresFlexibleSchedule: boolean;
    unpredictableAbsences: boolean;
    evidence: string[];
  };
  
  // Adaptation to change
  adaptation: {
    difficultyWithChange: boolean;
    needsRoutine: boolean;
    stressIntolerant: boolean;
    evidence: string[];
  };
}

/**
 * Limitation severity levels
 */
export type LimitationLevel = 
  | 'unlimited'      // No limitation
  | 'occasional'     // Up to 1/3 of 8-hour day
  | 'frequent'       // 1/3 to 2/3 of 8-hour day  
  | 'never';         // Cannot perform at all

/**
 * Supporting evidence summary
 */
export interface EvidenceSummary {
  totalDailyLogs: number;
  totalActivityLogs: number;
  totalLimitations: number;
  totalPhotos: number;
  
  // Pattern evidence
  consistentPatterns: string[];
  worseningTrends: string[];
  medicationEffects: string[];
  
  // Key supporting logs
  mostSevereSymptomDays: string[]; // Daily log IDs
  activityLimitations: string[];   // Activity log IDs
  functionalDeclines: string[];    // Limitation IDs
  
  // Data quality indicators
  dateRangeDays: number;
  averageLogsPerWeek: number;
  hasPhotographicEvidence: boolean;
  hasMedicalCorroboration: boolean;
}

/**
 * RFC Work Level Classifications (SSA definitions)
 */
export const RFC_WORK_LEVELS = {
  sedentary: {
    label: 'Sedentary Work',
    description: 'Lifting 10 lbs occasionally, sitting 6+ hours, standing/walking 2 hours',
    exertion: 'Very light',
  },
  light: {
    label: 'Light Work',
    description: 'Lifting 20 lbs occasionally, 10 lbs frequently, standing/walking 6 hours',
    exertion: 'Light',
  },
  medium: {
    label: 'Medium Work',
    description: 'Lifting 50 lbs occasionally, 25 lbs frequently, standing/walking 6 hours',
    exertion: 'Moderate',
  },
  heavy: {
    label: 'Heavy Work',
    description: 'Lifting 100 lbs occasionally, 50 lbs frequently',
    exertion: 'Heavy',
  },
  very_heavy: {
    label: 'Very Heavy Work',
    description: 'Lifting over 100 lbs occasionally, 50+ lbs frequently',
    exertion: 'Very heavy',
  },
} as const;

/**
 * Create a new RFC assessment
 */
export function createRFC(
  id: string,
  profileId: string,
  startDate: string,
  endDate: string
): RFC {
  const now = new Date().toISOString();
  
  return {
    id,
    profileId,
    assessmentStartDate: startDate,
    assessmentEndDate: endDate,
    generatedAt: now,
    
    exertionalLimitations: {
      sitting: {
        maxContinuousMinutes: 480,
        maxTotalHours: 8,
        requiresBreaks: false,
        evidence: [],
      },
      standing: {
        maxContinuousMinutes: 480,
        maxTotalHours: 8,
        requiresBreaks: false,
        evidence: [],
      },
      walking: {
        maxContinuousMinutes: 480,
        maxTotalHours: 8,
        requiresAssistiveDevice: false,
        evidence: [],
      },
      lifting: {
        maxWeightPoundsOccasional: 100,
        maxWeightPoundsFrequent: 50,
        maxWeightPoundsConstant: 20,
        evidence: [],
      },
      pushPull: {
        limitedBeyondLifting: false,
        evidence: [],
      },
    },
    
    posturalLimitations: {
      stooping: 'unlimited',
      kneeling: 'unlimited',
      crouching: 'unlimited',
      crawling: 'unlimited',
      climbing: {
        stairs: 'unlimited',
        ladders: 'unlimited',
        ramps: 'unlimited',
      },
      balancing: 'unlimited',
      evidence: {},
    },
    
    manipulativeLimitations: {
      reaching: {
        overhead: 'unlimited',
        forward: 'unlimited',
        lateral: 'unlimited',
      },
      handling: 'unlimited',
      fingering: 'unlimited',
      feeling: 'unlimited',
      evidence: {},
    },
    
    environmentalLimitations: {
      heights: false,
      movingMechanicalParts: false,
      operatingVehicle: false,
      humidity: 'unlimited',
      wetness: 'unlimited',
      dust: 'unlimited',
      odors: 'unlimited',
      fumes: 'unlimited',
      temperature: {
        extremeCold: false,
        extremeHeat: false,
        rapidChanges: false,
      },
      noise: {
        loudNoise: false,
        constantNoise: false,
      },
      vibration: 'unlimited',
      evidence: {},
    },
    
    mentalLimitations: {
      concentration: {
        maxContinuousMinutes: 480,
        requiresFrequentBreaks: false,
        distractedByPain: false,
        distractedBySymptoms: false,
        evidence: [],
      },
      memory: {
        shortTermImpaired: false,
        longTermImpaired: false,
        forgetsMedications: false,
        forgetsAppointments: false,
        evidence: [],
      },
      social: {
        limitedPublicContact: false,
        limitedCoworkerContact: false,
        limitedSupervisorContact: false,
        evidenceOfIsolation: false,
        evidence: [],
      },
      pace: {
        belowNormalPace: false,
        cannotMeetQuotas: false,
        requiresFlexibleSchedule: false,
        unpredictableAbsences: false,
        evidence: [],
      },
      adaptation: {
        difficultyWithChange: false,
        needsRoutine: false,
        stressIntolerant: false,
        evidence: [],
      },
    },
    
    evidenceSummary: {
      totalDailyLogs: 0,
      totalActivityLogs: 0,
      totalLimitations: 0,
      totalPhotos: 0,
      consistentPatterns: [],
      worseningTrends: [],
      medicationEffects: [],
      mostSevereSymptomDays: [],
      activityLimitations: [],
      functionalDeclines: [],
      dateRangeDays: 0,
      averageLogsPerWeek: 0,
      hasPhotographicEvidence: false,
      hasMedicalCorroboration: false,
    },
    
    overallRating: 'heavy',
    canWorkFullTime: true,
    requiresAccommodations: [],
  };
}
