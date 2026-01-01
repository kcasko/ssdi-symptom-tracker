/**
 * Work History Model
 * Documents past jobs and their specific requirements
 * 
 * Critical for SSDI: SSA evaluates if you can return to PAST work
 * Not just "can you work" but "can you do YOUR previous jobs"
 */

export interface WorkHistory {
  id: string;
  profileId: string;
  
  // Job identification
  jobTitle: string;
  employer?: string;
  industry?: string;
  
  // Time period
  startDate: string;
  endDate?: string; // null if current job
  stillEmployed: boolean;
  
  // Employment details
  hoursPerWeek: number;
  wasFullTime: boolean;
  salary?: number;
  
  // Physical requirements
  physicalDemands: PhysicalDemands;
  
  // Job duties (specific tasks performed)
  duties: JobDuty[];
  
  // Skills and requirements
  skillsRequired: string[];
  educationRequired?: string;
  certificationsRequired?: string[];
  
  // Why you left (if applicable)
  reasonForLeaving?: 'disability' | 'laid_off' | 'quit' | 'fired' | 'other';
  disabilityRelated: boolean;
  
  // SSA classification
  dotCode?: string; // Dictionary of Occupational Titles code
  soc2018Code?: string; // Standard Occupational Classification
  
  notes?: string;
}

/**
 * Physical demands of a job (SSA definitions)
 */
export interface PhysicalDemands {
  // Exertional level
  exertionLevel: 'sedentary' | 'light' | 'medium' | 'heavy' | 'very_heavy';
  
  // Specific physical requirements
  liftingRequired: {
    maxWeightPounds: number;
    frequency: 'never' | 'occasional' | 'frequent' | 'constant';
  };
  
  standingRequired: {
    hoursPerDay: number;
    continuous: boolean;
  };
  
  walkingRequired: {
    hoursPerDay: number;
    distancePerDay?: number; // feet
  };
  
  sittingRequired: {
    hoursPerDay: number;
    continuous: boolean;
  };
  
  // Postural requirements
  posturalRequirements: {
    stooping: 'never' | 'occasional' | 'frequent' | 'constant';
    kneeling: 'never' | 'occasional' | 'frequent' | 'constant';
    crouching: 'never' | 'occasional' | 'frequent' | 'constant';
    crawling: 'never' | 'occasional' | 'frequent' | 'constant';
    climbing: 'never' | 'occasional' | 'frequent' | 'constant';
    balancing: 'never' | 'occasional' | 'frequent' | 'constant';
  };
  
  // Manipulative requirements
  manipulativeRequirements: {
    reaching: 'never' | 'occasional' | 'frequent' | 'constant';
    handling: 'never' | 'occasional' | 'frequent' | 'constant';
    fingering: 'never' | 'occasional' | 'frequent' | 'constant';
    feeling: 'never' | 'occasional' | 'frequent' | 'constant';
  };
  
  // Environmental exposures
  environmentalExposures: {
    outdoors: boolean;
    extremeTemperatures: boolean;
    wetness: boolean;
    humidity: boolean;
    noise: 'quiet' | 'moderate' | 'loud' | 'very_loud';
    vibration: boolean;
    hazards: boolean;
  };
}

/**
 * Specific job duty/task
 */
export interface JobDuty {
  id: string;
  description: string;
  
  // Frequency of this duty
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  percentOfTime: number; // % of work time spent on this
  
  // What's required for this duty
  physicalRequirements?: {
    standing?: boolean;
    sitting?: boolean;
    walking?: boolean;
    lifting?: number; // max pounds
    reaching?: boolean;
    fineDexterity?: boolean;
    concentration?: boolean;
    memory?: boolean;
  };
  
  // Essential function (can't do job without this)
  isEssential: boolean;
  
  // Alternative ways to perform this duty
  accommodationsPossible?: string[];
}

/**
 * Work impact assessment result
 * Shows which duties you can/cannot perform
 */
export interface WorkImpact {
  workHistoryId: string;
  jobTitle: string;
  
  // Overall assessment
  canReturnToThisJob: boolean;
  impactScore: number; // 0-100, higher = more impaired
  
  // Duty-by-duty analysis
  dutyImpacts: DutyImpact[];
  
  // Supporting evidence
  evidenceBase: {
    dailyLogIds: string[];
    activityLogIds: string[];
    limitationIds: string[];
    photoIds: string[];
  };
  
  // Summary statements
  impactStatements: string[];
  
  // Date range analyzed
  analysisStartDate: string;
  analysisEndDate: string;
  generatedAt: string;
}

/**
 * Impact on a specific job duty
 */
export interface DutyImpact {
  dutyId: string;
  dutyDescription: string;
  
  // Can you perform this duty?
  canPerform: 'yes' | 'no' | 'with_difficulty' | 'with_accommodation';
  
  // Why not? (symptoms/limitations that interfere)
  interferingFactors: InterferingFactor[];
  
  // Impact severity
  severityScore: number; // 0-10
  
  // Specific evidence
  supportingLogIds: string[];
  
  // Narrative explanation
  impactExplanation: string;
}

/**
 * Symptom or limitation that interferes with job duty
 */
export interface InterferingFactor {
  type: 'symptom' | 'limitation';
  id: string;
  name: string;
  
  // How it interferes
  interferenceDescription: string;
  
  // Frequency in logs
  occurrenceCount: number;
  occurrencePercentage: number;
  
  // Severity
  averageSeverity: number;
  maxSeverity: number;
  
  // Supporting evidence
  logIds: string[];
}

/**
 * Pre-defined job duty templates for common occupations
 */
export const COMMON_JOB_DUTIES: Record<string, JobDuty[]> = {
  'office_clerk': [
    {
      id: 'filing',
      description: 'Filing and organizing documents',
      frequency: 'daily',
      percentOfTime: 20,
      physicalRequirements: {
        standing: true,
        reaching: true,
        fineDexterity: true,
      },
      isEssential: true,
    },
    {
      id: 'data_entry',
      description: 'Computer data entry and typing',
      frequency: 'daily',
      percentOfTime: 40,
      physicalRequirements: {
        sitting: true,
        fineDexterity: true,
        concentration: true,
      },
      isEssential: true,
    },
    {
      id: 'phone_calls',
      description: 'Answering phones and assisting customers',
      frequency: 'daily',
      percentOfTime: 20,
      physicalRequirements: {
        sitting: true,
        concentration: true,
      },
      isEssential: true,
    },
  ],
  
  'retail_sales': [
    {
      id: 'customer_service',
      description: 'Assisting customers on sales floor',
      frequency: 'daily',
      percentOfTime: 50,
      physicalRequirements: {
        standing: true,
        walking: true,
        concentration: true,
      },
      isEssential: true,
    },
    {
      id: 'stocking',
      description: 'Stocking shelves and inventory',
      frequency: 'daily',
      percentOfTime: 30,
      physicalRequirements: {
        standing: true,
        walking: true,
        lifting: 25,
        reaching: true,
      },
      isEssential: true,
    },
    {
      id: 'cash_register',
      description: 'Operating cash register',
      frequency: 'daily',
      percentOfTime: 20,
      physicalRequirements: {
        standing: true,
        fineDexterity: true,
        concentration: true,
      },
      isEssential: true,
    },
  ],
  
  'warehouse_worker': [
    {
      id: 'loading_unloading',
      description: 'Loading and unloading trucks',
      frequency: 'daily',
      percentOfTime: 40,
      physicalRequirements: {
        standing: true,
        walking: true,
        lifting: 50,
      },
      isEssential: true,
    },
    {
      id: 'operating_forklift',
      description: 'Operating forklift and pallet jack',
      frequency: 'daily',
      percentOfTime: 30,
      physicalRequirements: {
        sitting: true,
        concentration: true,
      },
      isEssential: false,
      accommodationsPossible: ['Automated equipment', 'Team lifting'],
    },
    {
      id: 'inventory_management',
      description: 'Counting and organizing inventory',
      frequency: 'daily',
      percentOfTime: 30,
      physicalRequirements: {
        walking: true,
        standing: true,
        concentration: true,
        memory: true,
      },
      isEssential: true,
    },
  ],
  
  'nurse': [
    {
      id: 'patient_care',
      description: 'Direct patient care and monitoring',
      frequency: 'daily',
      percentOfTime: 50,
      physicalRequirements: {
        standing: true,
        walking: true,
        lifting: 35,
        concentration: true,
      },
      isEssential: true,
    },
    {
      id: 'medication_administration',
      description: 'Preparing and administering medications',
      frequency: 'daily',
      percentOfTime: 20,
      physicalRequirements: {
        standing: true,
        fineDexterity: true,
        concentration: true,
        memory: true,
      },
      isEssential: true,
    },
    {
      id: 'documentation',
      description: 'Charting and medical documentation',
      frequency: 'daily',
      percentOfTime: 20,
      physicalRequirements: {
        sitting: true,
        fineDexterity: true,
        concentration: true,
      },
      isEssential: true,
    },
  ],
  
  'truck_driver': [
    {
      id: 'driving',
      description: 'Operating commercial vehicle',
      frequency: 'daily',
      percentOfTime: 70,
      physicalRequirements: {
        sitting: true,
        concentration: true,
      },
      isEssential: true,
    },
    {
      id: 'loading_securing',
      description: 'Loading and securing cargo',
      frequency: 'daily',
      percentOfTime: 20,
      physicalRequirements: {
        standing: true,
        walking: true,
        lifting: 50,
      },
      isEssential: true,
    },
    {
      id: 'vehicle_inspection',
      description: 'Pre-trip vehicle inspection',
      frequency: 'daily',
      percentOfTime: 10,
      physicalRequirements: {
        walking: true,
        stooping: true,
        reaching: true,
      },
      isEssential: true,
    },
  ],
};

/**
 * Create a new work history entry
 */
export function createWorkHistory(
  id: string,
  profileId: string,
  jobTitle: string,
  startDate: string
): WorkHistory {
  return {
    id,
    profileId,
    jobTitle,
    startDate,
    stillEmployed: false,
    hoursPerWeek: 40,
    wasFullTime: true,
    disabilityRelated: false,
    
    physicalDemands: {
      exertionLevel: 'light',
      liftingRequired: {
        maxWeightPounds: 10,
        frequency: 'occasional',
      },
      standingRequired: {
        hoursPerDay: 2,
        continuous: false,
      },
      walkingRequired: {
        hoursPerDay: 2,
      },
      sittingRequired: {
        hoursPerDay: 6,
        continuous: false,
      },
      posturalRequirements: {
        stooping: 'occasional',
        kneeling: 'never',
        crouching: 'never',
        crawling: 'never',
        climbing: 'never',
        balancing: 'occasional',
      },
      manipulativeRequirements: {
        reaching: 'frequent',
        handling: 'frequent',
        fingering: 'frequent',
        feeling: 'occasional',
      },
      environmentalExposures: {
        outdoors: false,
        extremeTemperatures: false,
        wetness: false,
        humidity: false,
        noise: 'moderate',
        vibration: false,
        hazards: false,
      },
    },
    
    duties: [],
    skillsRequired: [],
  };
}
