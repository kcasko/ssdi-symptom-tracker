/**
 * SSDI Vocabulary
 * Controlled vocabulary for SSDI-appropriate language
 */

// Functional terms preferred by SSDI
export const FUNCTIONAL_TERMS = {
  // Pain descriptions
  pain: {
    avoid: ['unbearable', 'excruciating', 'torture', 'agony'],
    prefer: ['severe', 'significant', 'limiting', 'interferes with function'],
    neutral: ['pain rated 8/10', 'sharp pain in lower back', 'pain increased with activity'],
  },

  // Fatigue descriptions
  fatigue: {
    avoid: ['completely exhausted', 'wiped out', 'destroyed'],
    prefer: ['significant fatigue', 'reduced energy', 'fatigue limiting activity'],
    neutral: ['required rest after 20 minutes', 'energy decreased by afternoon', 'fatigue interfered with concentration'],
  },

  // Functional limitations
  limitations: {
    avoid: ['can\'t do anything', 'totally disabled', 'completely unable'],
    prefer: ['limited to', 'requires frequent breaks', 'able to perform for limited periods'],
    neutral: ['sitting tolerance 20 minutes', 'standing limited to 10 minutes', 'lifting restricted to 5 pounds'],
  },

  // Activity descriptions
  activities: {
    avoid: ['impossible', 'can\'t', 'never'],
    prefer: ['difficulty with', 'limited ability', 'requires modifications'],
    neutral: ['stopped activity after 30 minutes due to pain', 'required assistance with', 'completed with frequent rest breaks'],
  },

  // Symptom impacts
  impacts: {
    avoid: ['ruins my life', 'makes me miserable', 'I hate'],
    prefer: ['interferes with', 'limits ability to', 'affects capacity for'],
    neutral: ['symptoms prevent sustained activity', 'concentration affected for 2+ hours', 'requires position changes every 15 minutes'],
  },
} as const;

// Duration and frequency terms
export const DURATION_TERMS = {
  // How long something lasts
  duration: [
    'approximately',
    'roughly',
    'typically',
    'usually',
    'generally',
    'on average',
    'for about',
    'lasting',
  ],
  
  // How often something happens
  frequency: [
    'consistently',
    'regularly',
    'frequently',
    'occasionally',
    'intermittently',
    'typically occurs',
    'happens',
    'experienced',
  ],
} as const;

// Severity descriptors
export const SEVERITY_DESCRIPTORS = {
  mild: ['mild', 'slight', 'minimal', 'low-level', 'manageable'],
  moderate: ['moderate', 'significant', 'noticeable', 'interfering', 'limiting'],
  severe: ['severe', 'marked', 'substantial', 'considerable', 'major'],
  extreme: ['extreme', 'profound', 'debilitating', 'incapacitating', 'preventing'],
} as const;

// Time-related terms
export const TIME_TERMS = {
  immediate: ['immediately', 'right away', 'instantly', 'at once'],
  soon: ['within minutes', 'shortly after', 'soon after', 'quickly'],
  delayed: ['after some time', 'later', 'subsequently', 'following'],
  recovery: ['relief obtained after', 'symptoms subsided with', 'required', 'needed'],
} as const;

// Recovery action terms
export const RECOVERY_TERMS = {
  rest: ['resting', 'lying down', 'sitting', 'remaining still'],
  position: ['changing position', 'repositioning', 'adjusting posture'],
  medication: ['taking medication', 'using prescribed medication', 'medicating'],
  therapy: ['applying heat/ice', 'using therapy techniques', 'therapeutic measures'],
} as const;

// Medical professional language
export const MEDICAL_LANGUAGE = {
  // Objective observations
  observations: [
    'Patient reports',
    'Symptoms include',
    'Functional capacity limited to',
    'Activity tolerance',
    'Demonstrates difficulty with',
    'Unable to sustain',
    'Requires assistance with',
    'Modified approach needed for',
  ],

  // Functional assessments
  assessments: [
    'Sitting tolerance limited to',
    'Standing capacity restricted to',
    'Walking distance limited to',
    'Lifting restricted to',
    'Concentration span limited to',
    'Memory difficulties noted in',
    'Social functioning affected by',
    'Self-care activities modified due to',
  ],
} as const;

// Connector phrases for natural flow
export const CONNECTORS = {
  cause: ['due to', 'because of', 'as a result of', 'caused by'],
  effect: ['resulting in', 'leading to', 'causing', 'producing'],
  time: ['after', 'during', 'before', 'while', 'when'],
  addition: ['additionally', 'furthermore', 'also', 'in addition'],
  contrast: ['however', 'although', 'while', 'despite'],
} as const;

/**
 * Convert casual language to SSDI-appropriate language
 */
export function convertToSSIDLanguage(text: string, category: keyof typeof FUNCTIONAL_TERMS = 'activities'): string {
  let result = text.toLowerCase();
  
  // Replace avoid terms with preferred terms
  const termSet = FUNCTIONAL_TERMS[category];
  if (termSet && 'avoid' in termSet) {
    termSet.avoid.forEach((avoid, index) => {
      const prefer = termSet.prefer[index] || termSet.prefer[0];
      result = result.replace(new RegExp(avoid, 'gi'), prefer);
    });
  }
  
  // Add qualifying language
  result = result.replace(/^/, 'Patient reports ');
  
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Get appropriate severity descriptor
 */
export function getSeverityDescriptor(severity: number): string[] {
  if (severity === 0) return ['none', 'absent'];
  if (severity <= 2) return SEVERITY_DESCRIPTORS.mild;
  if (severity <= 4) return SEVERITY_DESCRIPTORS.moderate;
  if (severity <= 7) return SEVERITY_DESCRIPTORS.severe;
  return SEVERITY_DESCRIPTORS.extreme;
}

/**
 * Format duration for narrative
 */
export function formatDurationForNarrative(minutes: number): string {
  const durationTerm = DURATION_TERMS.duration[0]; // 'approximately'
  
  if (minutes < 5) return `${durationTerm} 5 minutes`;
  if (minutes < 15) return `${durationTerm} 10 minutes`;
  if (minutes < 25) return `${durationTerm} 20 minutes`;
  if (minutes < 45) return `${durationTerm} 30 minutes`;
  if (minutes < 75) return `${durationTerm} 1 hour`;
  if (minutes < 105) return `${durationTerm} 1.5 hours`;
  
  const hours = Math.round(minutes / 60);
  return `${durationTerm} ${hours} hours`;
}

/**
 * Get recovery action description
 */
export function getRecoveryDescription(actionId: string): string {
  switch (actionId) {
    case 'sit': return 'sitting and resting';
    case 'lie_down': return 'lying down for relief';
    case 'rest': return 'remaining still and resting';
    case 'nap': return 'taking a rest period';
    case 'medication': return 'using prescribed medication';
    case 'ice': return 'applying cold therapy';
    case 'heat': return 'applying heat therapy';
    case 'stretch': return 'gentle stretching';
    case 'walk': return 'light movement';
    default: return 'therapeutic measures';
  }
}