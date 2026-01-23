import { z } from 'zod';

export const SymptomEntrySchema = z.object({
  symptomId: z.string(),
  severity: z.number().min(0).max(10),
  duration: z.number().optional(),
  location: z.string().optional(),
  quality: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const EnvironmentalFactorsSchema = z.object({
  weather: z.enum(['clear', 'cloudy', 'rainy', 'stormy', 'hot', 'cold', 'humid']).optional(),
  temperature: z.enum(['cold', 'cool', 'comfortable', 'warm', 'hot']).optional(),
  stressLevel: z.number().min(0).max(10).optional(),
  notes: z.string().optional(),
});

export const SleepEntrySchema = z.object({
  hoursSlept: z.number().optional(),
  quality: z.number().min(0).max(10),
  wakeUps: z.number().optional(),
  restful: z.boolean(),
  notes: z.string().optional(),
});

export const RetrospectiveContextSchema = z.object({
  daysDelayed: z.number(),
  flaggedAt: z.string(),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export const DailyLogSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  evidenceTimestamp: z.string().optional(),
  logDate: z.string(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night', 'specific']),
  specificTime: z.string().optional(),
  symptoms: z.array(SymptomEntrySchema),
  overallSeverity: z.number().min(0).max(10),
  triggers: z.array(z.string()).optional(),
  environmentalFactors: EnvironmentalFactorsSchema.optional(),
  sleepQuality: SleepEntrySchema.optional(),
  notes: z.string().optional(),
  retrospectiveContext: RetrospectiveContextSchema.optional(),
  photos: z.array(z.string()).optional(),
  finalized: z.boolean().optional(),
  finalizedAt: z.string().optional(),
  finalizedBy: z.string().optional(),
});

export const DailyLogArraySchema = z.array(DailyLogSchema);
