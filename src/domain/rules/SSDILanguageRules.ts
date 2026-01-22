/**
 * SSDI Language Rules
 * Business rules for generating SSDI-appropriate language and avoiding problematic phrasing
 */

import { getSeverityDescriptor } from '../../data/ssdiVocabulary';

/**
 * Convert casual language to SSDI-appropriate functional language
 */
export function convertToFunctionalLanguage(text: string): string {
  let result = text;

  // Replace emotional/subjective terms with functional ones
  const replacements: Array<[RegExp, string]> = [
    // Pain descriptions
    [/unbearable|excruciating|torture|agony/gi, 'severe'],
    [/killing me|can't stand it/gi, 'limiting function'],
    
    // Fatigue descriptions
    [/completely exhausted|wiped out|destroyed/gi, 'significant fatigue limiting activity'],
    [/dead tired|drained/gi, 'fatigued'],
    
    // Inability phrases
    [/can't do anything|totally disabled|completely unable/gi, 'limited ability to perform'],
    [/impossible/gi, 'not feasible'],
    [/never/gi, 'rarely able to'],
    
    // Emotional descriptions
    [/ruins my life|makes me miserable/gi, 'interferes with daily function'],
    [/I hate|it's awful/gi, 'affects quality of life'],
    
    // Absolutist terms
    [/always hurts|constant pain/gi, 'persistent discomfort'],
    [/all the time|every single day/gi, 'frequently'],
  ];

  replacements.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, replacement);
  });

  return result;
}

/**
 * Check if text contains problematic language
 */
export function validateSSIDLanguage(text: string): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for emotional language
  const emotionalPatterns = [
    /unbearable|torture|agony|suffering/gi,
    /depressed|hopeless|suicidal/gi,
    /hate|despise|terrible|awful/gi,
  ];

  emotionalPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      issues.push('Contains emotional language that may undermine credibility');
      suggestions.push('Use objective, functional descriptions instead');
    }
  });

  // Check for absolutist language
  const absolutistPatterns = [
    /never|always|constantly|continuously/gi,
    /can't do anything|completely unable|totally disabled/gi,
    /impossible|can't/gi,
  ];

  absolutistPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      issues.push('Contains absolutist language that may be challenged');
      suggestions.push('Use frequency descriptors (usually, frequently, often)');
    }
  });

  // Check for diagnostic language (unless quoting medical professional)
  const diagnosticPatterns = [
    /I have been diagnosed with/gi,
    /my condition is/gi,
  ];

  diagnosticPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      issues.push('Contains self-diagnosis language');
      suggestions.push('Reference medical professional opinions instead');
    }
  });

  // Check for comparison language
  if (/worse than|better than/gi.test(text)) {
    issues.push('Contains comparative language');
    suggestions.push('Use objective measures instead of comparisons');
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Format severity for SSDI narrative
 */
export function formatSeverityForNarrative(severity: number): string {
  const descriptors = getSeverityDescriptor(severity);
  
  if (severity === 0) return 'no symptoms reported';
  if (severity <= 2) return `${descriptors[0]} symptoms`;
  if (severity <= 4) return `${descriptors[0]} symptoms interfering with some activities`;
  if (severity <= 6) return `${descriptors[0]} symptoms limiting functional capacity`;
  if (severity <= 8) return `${descriptors[0]} symptoms significantly restricting daily activities`;
  return `${descriptors[0]} symptoms preventing sustained activity`;
}

/**
 * Format frequency for SSDI narrative
 */
export function formatFrequencyForNarrative(percentage: number): string {
  if (percentage >= 90) return 'at all times';
  if (percentage >= 75) return 'most of the time';
  if (percentage >= 50) return 'frequently';
  if (percentage >= 25) return 'sometimes';
  if (percentage >= 10) return 'occasionally';
  return 'rarely';
}

/**
 * Format duration for SSDI narrative
 */
export function formatDurationForNarrative(minutes: number): string {
  if (minutes < 5) return 'a few minutes';
  if (minutes < 15) return 'approximately 10 minutes';
  if (minutes < 25) return 'approximately 20 minutes';
  if (minutes < 45) return 'approximately 30 minutes';
  if (minutes < 75) return 'approximately 1 hour';
  if (minutes < 105) return 'approximately 1.5 hours';
  
  const hours = Math.round(minutes / 60);
  return `approximately ${hours} hours`;
}

/**
 * Generate functional capacity statement
 */
export function generateFunctionalStatement(
  activity: string,
  duration: number,
  consequence: string
): string {
  const durationText = formatDurationForNarrative(duration);
  
  return `${activity} tolerance limited to ${durationText}, after which ${consequence.toLowerCase()}.`;
}

/**
 * Generate recovery statement
 */
export function generateRecoveryStatement(
  recoveryActions: string[],
  recoveryDuration?: number
): string {
  if (recoveryActions.length === 0) return 'no specific recovery measures documented';
  
  const actionsList = recoveryActions.join(', ');
  
  if (recoveryDuration) {
    const durationText = formatDurationForNarrative(recoveryDuration);
    return `relief obtained through ${actionsList}, requiring ${durationText}`;
  }
  
  return `relief obtained through ${actionsList}`;
}

/**
 * Generate impact statement
 */
export function generateImpactStatement(
  symptom: string,
  severity: number,
  functionalImpact: string
): string {
  const severityText = formatSeverityForNarrative(severity);
  
  return `${symptom} experienced as ${severityText}, ${functionalImpact.toLowerCase()}`;
}

/**
 * Format limitation statement
 */
export function formatLimitationStatement(
  category: string,
  threshold: string,
  frequency: string,
  consequence: string
): string {
  return `${category} limited to ${threshold} ${frequency}, resulting in ${consequence.toLowerCase()}`;
}

/**
 * Ensure professional tone
 */
export function ensureProfessionalTone(text: string): string {
  let result = text;

  // Start with "Patient reports" if not already professional
  if (!result.match(/^(Patient reports|The patient|During|Following|After)/i)) {
    result = `Patient reports ${result.charAt(0).toLowerCase()}${result.slice(1)}`;
  }

  // Ensure proper capitalization
  result = result.charAt(0).toUpperCase() + result.slice(1);

  // Ensure proper punctuation
  if (!result.match(/[.!?]$/)) {
    result += '.';
  }

  return result;
}

/**
 * Generate consistency statement
 */
export function generateConsistencyStatement(percentage: number): string {
  if (percentage >= 90) return 'consistently present';
  if (percentage >= 75) return 'present most of the time';
  if (percentage >= 50) return 'frequently occurring';
  if (percentage >= 25) return 'intermittently present';
  return 'occasionally noted';
}

/**
 * Generate variability statement
 */
export function generateVariabilityStatement(
  variability: 'consistent' | 'some_variability' | 'high_variability' | 'unpredictable'
): string {
  switch (variability) {
    case 'consistent':
      return 'symptoms demonstrate consistent patterns across time periods';
    case 'some_variability':
      return 'symptoms show some day-to-day variation but maintain overall pattern';
    case 'high_variability':
      return 'symptoms demonstrate significant variation between lower- and higher-impact days';
    case 'unpredictable':
      return 'symptoms follow unpredictable patterns without clear triggers';
  }
}

/**
 * Validate report section for SSDI appropriateness
 */
export function validateReportSection(content: string): {
  appropriate: boolean;
  score: number;
  issues: string[];
  improvements: string[];
} {
  const issues: string[] = [];
  const improvements: string[] = [];
  let score = 100;

  // Check overall language
  const languageCheck = validateSSIDLanguage(content);
  if (!languageCheck.valid) {
    issues.push(...languageCheck.issues);
    score -= languageCheck.issues.length * 10;
  }

  // Check for functional focus
  const functionalKeywords = [
    'limited to', 'restricted to', 'tolerance', 'capacity',
    'duration', 'frequency', 'requires', 'interferes with',
  ];
  
  const hasFunctionalLanguage = functionalKeywords.some(keyword => 
    content.toLowerCase().includes(keyword)
  );
  
  if (!hasFunctionalLanguage) {
    issues.push('Lacks functional language and specific limitations');
    improvements.push('Add specific durations, frequencies, and functional capacities');
    score -= 15;
  }

  // Check for specificity
  const hasSpecificMeasures = /\d+\s*(minutes|hours|pounds|feet|times)/gi.test(content);
  if (!hasSpecificMeasures) {
    issues.push('Lacks specific quantifiable measures');
    improvements.push('Include specific durations, distances, or weights where applicable');
    score -= 10;
  }

  // Check for passive voice overuse
  const passiveCount = (content.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/gi) || []).length;
  const wordCount = content.split(/\s+/).length;
  const passivePercentage = (passiveCount / wordCount) * 100;
  
  if (passivePercentage > 30) {
    improvements.push('Consider using more active voice for clarity');
    score -= 5;
  }

  // Check for professional formatting
  if (content.length < 50) {
    issues.push('Content too brief for substantive documentation');
    score -= 20;
  }

  return {
    appropriate: score >= 70,
    score: Math.max(0, Math.min(100, score)),
    issues,
    improvements,
  };
}
