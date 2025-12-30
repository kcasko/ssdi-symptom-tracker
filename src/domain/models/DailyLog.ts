/**
 * DailyLog Model
 * Captures daily symptom entries - raw evidence layer
 */

export interface DailyLog {
  id: string;
  profileId: string;
  
  // When this log was created/edited
  createdAt: string;
  updatedAt: string;
  
  // The date this log is for (may differ from createdAt)
  logDate: string;
  
  // Time of day (morning, afternoon, evening, night, or specific time)
  timeOfDay: TimeOfDay;
  specificTime?: string; // HH:mm if provided
  
  // Symptom data
  symptoms: SymptomEntry[];
  
  // Overall severity for this log (0-10)
  overallSeverity: number;
  
  // What triggered or worsened symptoms
  triggers?: string[];
  
  // Weather/environmental factors
  environmentalFactors?: EnvironmentalFactors;
  
  // Sleep quality if logged in morning
  sleepQuality?: SleepEntry;
  
  // Free-form notes
  notes?: string;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'specific';

export interface SymptomEntry {
  symptomId: string;
  severity: number; // 0-10
  duration?: number; // minutes, if known
  location?: string; // body location if applicable
  quality?: string[]; // descriptors (sharp, dull, throbbing, etc.)
  notes?: string;
}

export interface EnvironmentalFactors {
  weather?: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'hot' | 'cold' | 'humid';
  temperature?: 'cold' | 'cool' | 'comfortable' | 'warm' | 'hot';
  stressLevel?: number; // 0-10
  notes?: string;
}

export interface SleepEntry {
  hoursSlept?: number;
  quality: number; // 0-10
  wakeUps?: number;
  restful: boolean;
  notes?: string;
}

/**
 * Create a new daily log with defaults
 */
export function createDailyLog(
  id: string,
  profileId: string,
  logDate: string,
  timeOfDay: TimeOfDay = 'morning'
): DailyLog {
  const now = new Date().toISOString();
  
  return {
    id,
    profileId,
    createdAt: now,
    updatedAt: now,
    logDate,
    timeOfDay,
    symptoms: [],
    overallSeverity: 0,
  };
}

/**
 * Calculate average severity from symptom entries
 */
export function calculateAverageSeverity(symptoms: SymptomEntry[]): number {
  if (symptoms.length === 0) return 0;
  const sum = symptoms.reduce((acc, s) => acc + s.severity, 0);
  return Math.round(sum / symptoms.length);
}

/**
 * Get the most severe symptom in a log
 */
export function getMostSevereSymptom(log: DailyLog): SymptomEntry | null {
  if (log.symptoms.length === 0) return null;
  return log.symptoms.reduce((max, s) => (s.severity > max.severity ? s : max));
}

/**
 * Check if log has any severe symptoms (7+)
 */
export function hasSevereSymptoms(log: DailyLog): boolean {
  return log.symptoms.some((s) => s.severity >= 7);
}
