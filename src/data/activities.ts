/**
 * Activities Data
 * Predefined activity categories for consistent logging
 */

export interface ActivityDefinition {
  id: string;
  name: string;
  category: ActivityCategory;
  description?: string;
  typicalDuration?: number; // minutes
  intensityGuide?: IntensityGuide;
  tags?: string[];
}

export type ActivityCategory =
  | 'household'
  | 'personal_care'
  | 'work'
  | 'exercise'
  | 'social'
  | 'errands'
  | 'medical'
  | 'leisure'
  | 'transportation'
  | 'other';

export interface IntensityGuide {
  light: string;
  moderate: string;
  heavy: string;
}

export const ACTIVITIES: ActivityDefinition[] = [
  // Household activities
  {
    id: 'cleaning_house',
    name: 'House Cleaning',
    category: 'household',
    description: 'General house cleaning tasks',
    typicalDuration: 60,
    intensityGuide: {
      light: 'Dusting, organizing',
      moderate: 'Vacuuming, mopping',
      heavy: 'Deep cleaning, scrubbing'
    },
    tags: ['cleaning', 'home'],
  },
  {
    id: 'laundry',
    name: 'Laundry',
    category: 'household',
    description: 'Washing, drying, folding clothes',
    typicalDuration: 30,
    intensityGuide: {
      light: 'Loading/unloading machines',
      moderate: 'Folding, hanging clothes',
      heavy: 'Carrying heavy baskets, making beds'
    },
    tags: ['laundry', 'home'],
  },
  {
    id: 'cooking',
    name: 'Cooking',
    category: 'household',
    description: 'Preparing meals',
    typicalDuration: 45,
    intensityGuide: {
      light: 'Simple prep, microwaving',
      moderate: 'Cooking on stove, chopping',
      heavy: 'Extended cooking, heavy lifting'
    },
    tags: ['cooking', 'meal_prep'],
  },
  {
    id: 'dishes',
    name: 'Washing Dishes',
    category: 'household',
    description: 'Cleaning dishes and kitchen',
    typicalDuration: 20,
    intensityGuide: {
      light: 'Loading dishwasher',
      moderate: 'Hand washing dishes',
      heavy: 'Deep kitchen cleaning'
    },
    tags: ['dishes', 'kitchen'],
  },
  {
    id: 'yard_work',
    name: 'Yard Work',
    category: 'household',
    description: 'Outdoor maintenance tasks',
    typicalDuration: 60,
    intensityGuide: {
      light: 'Watering plants, light pruning',
      moderate: 'Raking, weeding',
      heavy: 'Mowing, heavy digging'
    },
    tags: ['outdoor', 'maintenance'],
  },

  // Personal care
  {
    id: 'showering',
    name: 'Showering/Bathing',
    category: 'personal_care',
    description: 'Personal hygiene activities',
    typicalDuration: 15,
    tags: ['hygiene', 'self_care'],
  },
  {
    id: 'dressing',
    name: 'Getting Dressed',
    category: 'personal_care',
    description: 'Putting on clothes and shoes',
    typicalDuration: 10,
    tags: ['dressing', 'self_care'],
  },
  {
    id: 'grooming',
    name: 'Grooming',
    category: 'personal_care',
    description: 'Hair care, dental care, etc.',
    typicalDuration: 15,
    tags: ['grooming', 'hygiene'],
  },

  // Work activities
  {
    id: 'desk_work',
    name: 'Desk Work',
    category: 'work',
    description: 'Computer work, paperwork',
    typicalDuration: 120,
    intensityGuide: {
      light: 'Light typing, reading',
      moderate: 'Extended computer work',
      heavy: 'Intensive focus tasks'
    },
    tags: ['computer', 'sitting', 'cognitive'],
  },
  {
    id: 'standing_work',
    name: 'Standing Work',
    category: 'work',
    description: 'Work requiring standing',
    typicalDuration: 60,
    tags: ['standing', 'work'],
  },
  {
    id: 'physical_work',
    name: 'Physical Work',
    category: 'work',
    description: 'Manual labor or physical tasks',
    typicalDuration: 60,
    intensityGuide: {
      light: 'Light assembly, organizing',
      moderate: 'Walking, carrying light items',
      heavy: 'Heavy lifting, construction'
    },
    tags: ['physical', 'labor'],
  },

  // Exercise
  {
    id: 'walking',
    name: 'Walking',
    category: 'exercise',
    description: 'Walking for exercise or leisure',
    typicalDuration: 30,
    intensityGuide: {
      light: 'Slow, leisurely pace',
      moderate: 'Brisk walking',
      heavy: 'Fast pace, hills'
    },
    tags: ['cardio', 'low_impact'],
  },
  {
    id: 'stretching',
    name: 'Stretching',
    category: 'exercise',
    description: 'Stretching exercises',
    typicalDuration: 15,
    tags: ['flexibility', 'gentle'],
  },
  {
    id: 'physical_therapy',
    name: 'Physical Therapy',
    category: 'exercise',
    description: 'PT exercises and activities',
    typicalDuration: 45,
    tags: ['therapy', 'rehabilitation'],
  },
  {
    id: 'swimming',
    name: 'Swimming',
    category: 'exercise',
    description: 'Swimming or water exercises',
    typicalDuration: 30,
    intensityGuide: {
      light: 'Gentle water walking',
      moderate: 'Easy swimming',
      heavy: 'Vigorous swimming'
    },
    tags: ['water', 'low_impact'],
  },
  {
    id: 'yoga',
    name: 'Yoga',
    category: 'exercise',
    description: 'Yoga practice',
    typicalDuration: 45,
    tags: ['flexibility', 'mindfulness'],
  },

  // Social activities
  {
    id: 'socializing',
    name: 'Socializing',
    category: 'social',
    description: 'Spending time with friends/family',
    typicalDuration: 90,
    tags: ['social', 'relationships'],
  },
  {
    id: 'phone_calls',
    name: 'Phone Calls',
    category: 'social',
    description: 'Making or receiving phone calls',
    typicalDuration: 30,
    tags: ['communication', 'cognitive'],
  },

  // Errands
  {
    id: 'grocery_shopping',
    name: 'Grocery Shopping',
    category: 'errands',
    description: 'Shopping for groceries',
    typicalDuration: 60,
    intensityGuide: {
      light: 'Quick trip, small basket',
      moderate: 'Regular shopping cart',
      heavy: 'Large shopping trip'
    },
    tags: ['shopping', 'walking', 'carrying'],
  },
  {
    id: 'other_errands',
    name: 'Other Errands',
    category: 'errands',
    description: 'Banking, post office, etc.',
    typicalDuration: 45,
    tags: ['errands', 'tasks'],
  },
  {
    id: 'driving',
    name: 'Driving',
    category: 'transportation',
    description: 'Operating a vehicle',
    typicalDuration: 30,
    intensityGuide: {
      light: 'Short, familiar routes',
      moderate: 'Normal city driving',
      heavy: 'Long distance, stressful'
    },
    tags: ['driving', 'sitting', 'cognitive'],
  },

  // Medical
  {
    id: 'medical_appointment',
    name: 'Medical Appointment',
    category: 'medical',
    description: 'Doctor visits, treatments',
    typicalDuration: 60,
    tags: ['medical', 'appointments'],
  },

  // Leisure
  {
    id: 'reading',
    name: 'Reading',
    category: 'leisure',
    description: 'Reading books, magazines, etc.',
    typicalDuration: 60,
    tags: ['cognitive', 'leisure'],
  },
  {
    id: 'watching_tv',
    name: 'Watching TV',
    category: 'leisure',
    description: 'Television or streaming',
    typicalDuration: 120,
    tags: ['leisure', 'sedentary'],
  },
  {
    id: 'hobbies',
    name: 'Hobbies/Crafts',
    category: 'leisure',
    description: 'Creative or hobby activities',
    typicalDuration: 90,
    intensityGuide: {
      light: 'Light crafts, organizing',
      moderate: 'Extended crafting',
      heavy: 'Physical hobbies'
    },
    tags: ['creative', 'fine_motor'],
  },

  // Other
  {
    id: 'other_activity',
    name: 'Other Activity',
    category: 'other',
    description: 'Custom activity not listed',
    tags: ['custom'],
  },
];

/**
 * Get activities by category
 */
export function getActivitiesByCategory(category: ActivityCategory): ActivityDefinition[] {
  return ACTIVITIES.filter((a) => a.category === category);
}

/**
 * Get activity by ID
 */
export function getActivityById(id: string): ActivityDefinition | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}

/**
 * Search activities by name or tags
 */
export function searchActivities(query: string): ActivityDefinition[] {
  const lowercaseQuery = query.toLowerCase();
  return ACTIVITIES.filter(
    (a) =>
      a.name.toLowerCase().includes(lowercaseQuery) ||
      a.description?.toLowerCase().includes(lowercaseQuery) ||
      a.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  );
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: ActivityCategory): string {
  const names: Record<ActivityCategory, string> = {
    household: 'Household',
    personal_care: 'Personal Care',
    work: 'Work',
    exercise: 'Exercise',
    social: 'Social',
    errands: 'Errands',
    medical: 'Medical',
    leisure: 'Leisure',
    transportation: 'Transportation',
    other: 'Other',
  };
  return names[category] || category;
}

export const ACTIVITY_CATEGORIES = Object.keys(ACTIVITIES.reduce((acc, activity) => {
  acc[activity.category] = true;
  return acc;
}, {} as Record<string, boolean>)) as ActivityCategory[];