/**
 * Limitations Data
 * Predefined limitation templates and assessments
 */

import { LimitationCategory } from '../domain/models/Limitation';

export interface LimitationTemplate {
  category: LimitationCategory;
  displayName: string;
  description: string;
  typicalThresholds: ThresholdSuggestion[];
  commonConsequences: string[];
  commonAccommodations: string[];
  ssdiRelevance: string;
}

export interface ThresholdSuggestion {
  description: string;
  typicalMinutes?: number;
  typicalRange?: { min: number; max: number };
  note?: string;
}

export const LIMITATION_TEMPLATES: LimitationTemplate[] = [
  {
    category: 'sitting',
    displayName: 'Sitting',
    description: 'How long can you sit before needing to change position or take a break?',
    typicalThresholds: [
      { description: 'Less than 10 minutes', typicalMinutes: 5 },
      { description: '10-20 minutes', typicalRange: { min: 10, max: 20 } },
      { description: '20-30 minutes', typicalRange: { min: 20, max: 30 } },
      { description: '30-60 minutes', typicalRange: { min: 30, max: 60 } },
      { description: 'More than 1 hour', typicalMinutes: 90 },
    ],
    commonConsequences: [
      'Back pain increases',
      'Hip pain develops',
      'Need to stand and stretch',
      'Numbness in legs',
      'Stiffness when getting up',
      'Difficulty concentrating due to discomfort',
    ],
    commonAccommodations: [
      'Cushioned seating',
      'Lumbar support',
      'Frequent position changes',
      'Standing desk option',
      'Regular breaks',
      'Ergonomic chair',
    ],
    ssdiRelevance: 'Critical for sedentary work capacity assessment',
  },
  
  {
    category: 'standing',
    displayName: 'Standing',
    description: 'How long can you stand in one place before needing to sit or change position?',
    typicalThresholds: [
      { description: 'Less than 5 minutes', typicalMinutes: 2 },
      { description: '5-15 minutes', typicalRange: { min: 5, max: 15 } },
      { description: '15-30 minutes', typicalRange: { min: 15, max: 30 } },
      { description: '30-60 minutes', typicalRange: { min: 30, max: 60 } },
      { description: 'More than 1 hour', typicalMinutes: 90 },
    ],
    commonConsequences: [
      'Leg pain or weakness',
      'Back pain increases',
      'Dizziness or lightheadedness',
      'Swelling in feet/legs',
      'Need to lean or hold onto something',
      'Balance becomes unsteady',
    ],
    commonAccommodations: [
      'Stool or chair nearby',
      'Anti-fatigue mat',
      'Leaning rail or support',
      'Compression stockings',
      'Frequent sitting breaks',
      'Alternating sitting/standing workspace',
    ],
    ssdiRelevance: 'Important for jobs requiring prolonged standing',
  },

  {
    category: 'walking',
    displayName: 'Walking',
    description: 'How far can you walk without stopping to rest?',
    typicalThresholds: [
      { description: 'Less than 1 block', note: 'Very limited mobility' },
      { description: '1-2 blocks', note: 'Significant limitation' },
      { description: '2-5 blocks', note: 'Moderate limitation' },
      { description: '5-10 blocks', note: 'Mild limitation' },
      { description: 'More than 10 blocks', note: 'Minimal limitation' },
    ],
    commonConsequences: [
      'Shortness of breath',
      'Leg pain or cramping',
      'Fatigue',
      'Back pain',
      'Need to sit and rest',
      'Heart palpitations',
      'Dizziness',
    ],
    commonAccommodations: [
      'Mobility aid (cane, walker)',
      'Frequent rest stops',
      'Parking closer to destinations',
      'Avoid stairs when possible',
      'Use elevator instead of stairs',
      'Wheelchair for longer distances',
    ],
    ssdiRelevance: 'Key factor in determining disability severity',
  },

  {
    category: 'lifting',
    displayName: 'Lifting',
    description: 'What is the maximum weight you can lift and how frequently?',
    typicalThresholds: [
      { description: 'Less than 5 pounds', note: 'Sedentary work level' },
      { description: '5-10 pounds occasionally', note: 'Light work capacity' },
      { description: '10-25 pounds occasionally', note: 'Light to medium work' },
      { description: '25-50 pounds occasionally', note: 'Medium work capacity' },
      { description: 'More than 50 pounds', note: 'Heavy work capacity' },
    ],
    commonConsequences: [
      'Sharp pain in back',
      'Muscle spasms',
      'Weakness in arms/hands',
      'Drop items due to pain',
      'Symptoms worsen for hours/days',
      'Need help with basic tasks',
    ],
    commonAccommodations: [
      'Use lifting aids or tools',
      'Ask for help with heavy items',
      'Break tasks into smaller parts',
      'Use proper lifting technique',
      'Avoid overhead reaching',
      'Use cart or dolly when possible',
    ],
    ssdiRelevance: 'Determines work capacity categories in RFC assessment',
  },

  {
    category: 'concentration',
    displayName: 'Concentration',
    description: 'How long can you focus on a task before losing concentration?',
    typicalThresholds: [
      { description: 'Less than 5 minutes', typicalMinutes: 2 },
      { description: '5-15 minutes', typicalRange: { min: 5, max: 15 } },
      { description: '15-30 minutes', typicalRange: { min: 15, max: 30 } },
      { description: '30-60 minutes', typicalRange: { min: 30, max: 60 } },
      { description: 'More than 1 hour', typicalMinutes: 90 },
    ],
    commonConsequences: [
      'Mind wanders or goes blank',
      'Forget what was being done',
      'Make more errors',
      'Need to re-read things multiple times',
      'Become frustrated or overwhelmed',
      'Need frequent breaks to refocus',
    ],
    commonAccommodations: [
      'Work in quiet environment',
      'Break tasks into smaller steps',
      'Written instructions or reminders',
      'Flexible scheduling',
      'Minimize distractions',
      'Regular short breaks',
    ],
    ssdiRelevance: 'Critical for mental RFC and work capacity assessment',
  },

  {
    category: 'memory',
    displayName: 'Memory',
    description: 'How often do you have problems remembering important information?',
    typicalThresholds: [
      { description: 'Multiple times per day', note: 'Severe impairment' },
      { description: 'Daily', note: 'Significant impairment' },
      { description: 'Several times per week', note: 'Moderate impairment' },
      { description: 'Occasionally', note: 'Mild impairment' },
      { description: 'Rarely', note: 'Minimal impairment' },
    ],
    commonConsequences: [
      'Forget appointments or deadlines',
      'Lose track of conversations',
      'Forget familiar names or faces',
      'Repeat questions or stories',
      'Need multiple reminders',
      'Safety concerns (forget stove, locks)',
    ],
    commonAccommodations: [
      'Written reminders and lists',
      'Calendar alerts and notifications',
      'Simplify tasks and routines',
      'Have someone check in regularly',
      'Use memory aids and apps',
      'Reduce information overload',
    ],
    ssdiRelevance: 'Important for cognitive work capacity evaluation',
  },

  {
    category: 'social',
    displayName: 'Social Functioning',
    description: 'How well can you interact with others and handle social situations?',
    typicalThresholds: [
      { description: 'Avoid all social contact', note: 'Severe limitation' },
      { description: 'Very limited social contact', note: 'Significant limitation' },
      { description: 'Some difficulty with groups', note: 'Moderate limitation' },
      { description: 'Occasional social problems', note: 'Mild limitation' },
      { description: 'Generally manages well', note: 'Minimal limitation' },
    ],
    commonConsequences: [
      'Feel overwhelmed in groups',
      'Become anxious or irritable',
      'Difficulty communicating clearly',
      'Withdraw from activities',
      'Conflicts with others increase',
      'Avoid phone calls or meetings',
    ],
    commonAccommodations: [
      'Work independently when possible',
      'Limit group interactions',
      'Written communication preferred',
      'Quiet workspace',
      'Flexible social requirements',
      'Regular check-ins with supervisor',
    ],
    ssdiRelevance: 'Key component of mental health disability assessment',
  },

  {
    category: 'self_care',
    displayName: 'Self Care',
    description: 'How much difficulty do you have with personal care activities?',
    typicalThresholds: [
      { description: 'Need help with most tasks', note: 'Severe limitation' },
      { description: 'Need help with some tasks', note: 'Moderate limitation' },
      { description: 'Can do with extra time/rest', note: 'Mild limitation' },
      { description: 'Manage independently', note: 'Minimal limitation' },
    ],
    commonConsequences: [
      'Exhausted after bathing',
      'Difficulty with buttons or zippers',
      'Need to rest during grooming',
      'Require adaptive equipment',
      'Take much longer than normal',
      'Sometimes skip tasks due to fatigue',
    ],
    commonAccommodations: [
      'Shower chair or grab bars',
      'Adaptive clothing and tools',
      'Break tasks into smaller steps',
      'Rest periods during activities',
      'Home health aide assistance',
      'Energy conservation techniques',
    ],
    ssdiRelevance: 'Indicates severity of functional impairment',
  },
];

/**
 * Get limitation template by category
 */
export function getLimitationTemplate(category: LimitationCategory): LimitationTemplate | undefined {
  return LIMITATION_TEMPLATES.find((t) => t.category === category);
}

/**
 * Get all available limitation categories
 */
export function getAvailableLimitationCategories(): LimitationCategory[] {
  return LIMITATION_TEMPLATES.map((t) => t.category);
}

/**
 * Get common consequences for a category
 */
export function getCommonConsequences(category: LimitationCategory): string[] {
  const template = getLimitationTemplate(category);
  return template?.commonConsequences || [];
}

/**
 * Get common accommodations for a category
 */
export function getCommonAccommodations(category: LimitationCategory): string[] {
  const template = getLimitationTemplate(category);
  return template?.commonAccommodations || [];
}