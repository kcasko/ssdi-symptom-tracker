/**
 * Symptoms Data
 * Predefined symptom categories for consistent logging
 */

export interface SymptomDefinition {
  id: string;
  name: string;
  category: SymptomCategory;
  commonLocations?: string[];
  commonQualifiers?: string[];
  description?: string;
  tags?: string[];
}

export type SymptomCategory =
  | 'pain'
  | 'fatigue'
  | 'cognitive'
  | 'mobility'
  | 'sensory'
  | 'respiratory'
  | 'cardiovascular'
  | 'gastrointestinal'
  | 'neurological'
  | 'mental_health'
  | 'sleep'
  | 'other';

export const SYMPTOMS: SymptomDefinition[] = [
  // Pain symptoms
  {
    id: 'back_pain',
    name: 'Back Pain',
    category: 'pain',
    commonLocations: ['Lower back', 'Upper back', 'Mid back', 'Entire back'],
    commonQualifiers: ['Sharp', 'Dull', 'Aching', 'Shooting', 'Burning', 'Stabbing'],
    description: 'Pain in the back region',
    tags: ['chronic', 'musculoskeletal'],
  },
  {
    id: 'neck_pain',
    name: 'Neck Pain',
    category: 'pain',
    commonLocations: ['Base of neck', 'Side of neck', 'Back of neck'],
    commonQualifiers: ['Stiff', 'Sharp', 'Aching', 'Shooting'],
    tags: ['musculoskeletal'],
  },
  {
    id: 'joint_pain',
    name: 'Joint Pain',
    category: 'pain',
    commonLocations: ['Knees', 'Shoulders', 'Hips', 'Hands', 'Wrists', 'Ankles', 'Elbows'],
    commonQualifiers: ['Swollen', 'Stiff', 'Aching', 'Sharp', 'Throbbing'],
    tags: ['arthritis', 'musculoskeletal'],
  },
  {
    id: 'headache',
    name: 'Headache',
    category: 'pain',
    commonLocations: ['Temples', 'Forehead', 'Back of head', 'Entire head'],
    commonQualifiers: ['Throbbing', 'Pressure', 'Sharp', 'Pounding'],
    tags: ['migraine', 'tension'],
  },
  {
    id: 'muscle_pain',
    name: 'Muscle Pain',
    category: 'pain',
    commonLocations: ['Legs', 'Arms', 'Shoulders', 'Chest', 'Abdomen'],
    commonQualifiers: ['Aching', 'Cramping', 'Sore', 'Tight'],
    tags: ['fibromyalgia', 'musculoskeletal'],
  },
  {
    id: 'nerve_pain',
    name: 'Nerve Pain',
    category: 'pain',
    commonQualifiers: ['Burning', 'Shooting', 'Electric', 'Tingling', 'Numbness'],
    tags: ['neuropathy', 'neurological'],
  },

  // Fatigue symptoms
  {
    id: 'general_fatigue',
    name: 'General Fatigue',
    category: 'fatigue',
    description: 'Overall tiredness and lack of energy',
    tags: ['chronic', 'energy'],
  },
  {
    id: 'muscle_fatigue',
    name: 'Muscle Fatigue',
    category: 'fatigue',
    description: 'Muscles feel weak or tired',
    tags: ['weakness', 'musculoskeletal'],
  },
  {
    id: 'post_exertional_fatigue',
    name: 'Post-Exertional Fatigue',
    category: 'fatigue',
    description: 'Worsening fatigue after activity',
    tags: ['pem', 'chronic_fatigue'],
  },

  // Cognitive symptoms
  {
    id: 'brain_fog',
    name: 'Brain Fog',
    category: 'cognitive',
    description: 'Difficulty thinking clearly or concentrating',
    tags: ['concentration', 'memory'],
  },
  {
    id: 'memory_problems',
    name: 'Memory Problems',
    category: 'cognitive',
    description: 'Difficulty remembering things',
    tags: ['memory', 'cognitive'],
  },
  {
    id: 'concentration_difficulty',
    name: 'Concentration Difficulty',
    category: 'cognitive',
    description: 'Trouble focusing or paying attention',
    tags: ['concentration', 'focus'],
  },

  // Mobility symptoms
  {
    id: 'walking_difficulty',
    name: 'Walking Difficulty',
    category: 'mobility',
    description: 'Problems with walking or balance',
    tags: ['mobility', 'balance'],
  },
  {
    id: 'balance_problems',
    name: 'Balance Problems',
    category: 'mobility',
    description: 'Feeling unsteady or dizzy',
    tags: ['balance', 'dizziness'],
  },
  {
    id: 'weakness',
    name: 'Weakness',
    category: 'mobility',
    commonLocations: ['Arms', 'Legs', 'Hands', 'General'],
    tags: ['weakness'],
  },

  // Sensory symptoms
  {
    id: 'dizziness',
    name: 'Dizziness',
    category: 'sensory',
    description: 'Feeling dizzy or lightheaded',
    tags: ['vestibular', 'balance'],
  },
  {
    id: 'vision_problems',
    name: 'Vision Problems',
    category: 'sensory',
    commonQualifiers: ['Blurry', 'Double vision', 'Light sensitivity'],
    tags: ['vision', 'sensory'],
  },
  {
    id: 'hearing_problems',
    name: 'Hearing Problems',
    category: 'sensory',
    commonQualifiers: ['Ringing', 'Muffled', 'Loss'],
    tags: ['hearing', 'tinnitus'],
  },

  // Mental health symptoms
  {
    id: 'anxiety',
    name: 'Anxiety',
    category: 'mental_health',
    description: 'Feelings of worry, fear, or nervousness',
    tags: ['anxiety', 'mental_health'],
  },
  {
    id: 'depression',
    name: 'Depression',
    category: 'mental_health',
    description: 'Feelings of sadness or low mood',
    tags: ['depression', 'mental_health'],
  },
  {
    id: 'irritability',
    name: 'Irritability',
    category: 'mental_health',
    description: 'Feeling easily annoyed or frustrated',
    tags: ['mood', 'mental_health'],
  },

  // Sleep symptoms
  {
    id: 'insomnia',
    name: 'Insomnia',
    category: 'sleep',
    description: 'Difficulty falling or staying asleep',
    tags: ['sleep', 'insomnia'],
  },
  {
    id: 'sleep_disruption',
    name: 'Sleep Disruption',
    category: 'sleep',
    description: 'Frequent waking or restless sleep',
    tags: ['sleep', 'quality'],
  },

  // Other common symptoms
  {
    id: 'nausea',
    name: 'Nausea',
    category: 'gastrointestinal',
    description: 'Feeling sick to stomach',
    tags: ['nausea', 'gi'],
  },
  {
    id: 'shortness_of_breath',
    name: 'Shortness of Breath',
    category: 'respiratory',
    description: 'Difficulty breathing or feeling breathless',
    tags: ['breathing', 'respiratory'],
  },
  {
    id: 'heart_palpitations',
    name: 'Heart Palpitations',
    category: 'cardiovascular',
    description: 'Feeling heart racing or irregular beats',
    tags: ['heart', 'palpitations'],
  },
  {
    id: 'temperature_sensitivity',
    name: 'Temperature Sensitivity',
    category: 'sensory',
    commonQualifiers: ['Hot', 'Cold', 'Both'],
    tags: ['temperature', 'sensitivity'],
  },
  {
    id: 'restless_legs',
    name: 'Restless Legs',
    category: 'neurological',
    description: 'Uncomfortable sensations in legs with urge to move',
    tags: ['restless_legs', 'neurological'],
  },
];

/**
 * Get symptoms by category
 */
export function getSymptomsByCategory(category: SymptomCategory): SymptomDefinition[] {
  return SYMPTOMS.filter((s) => s.category === category);
}

/**
 * Get symptom by ID
 */
export function getSymptomById(id: string): SymptomDefinition | undefined {
  return SYMPTOMS.find((s) => s.id === id);
}

/**
 * Search symptoms by name or tags
 */
export function searchSymptoms(query: string): SymptomDefinition[] {
  const lowercaseQuery = query.toLowerCase();
  return SYMPTOMS.filter(
    (s) =>
      s.name.toLowerCase().includes(lowercaseQuery) ||
      s.description?.toLowerCase().includes(lowercaseQuery) ||
      s.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  );
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: SymptomCategory): string {
  const names: Record<SymptomCategory, string> = {
    pain: 'Pain',
    fatigue: 'Fatigue',
    cognitive: 'Cognitive',
    mobility: 'Mobility',
    sensory: 'Sensory',
    respiratory: 'Respiratory',
    cardiovascular: 'Cardiovascular',
    gastrointestinal: 'Gastrointestinal',
    neurological: 'Neurological',
    mental_health: 'Mental Health',
    sleep: 'Sleep',
    other: 'Other',
  };
  return names[category] || category;
}

export const SYMPTOM_CATEGORIES = Object.keys(SYMPTOMS.reduce((acc, symptom) => {
  acc[symptom.category] = true;
  return acc;
}, {} as Record<string, boolean>)) as SymptomCategory[];
