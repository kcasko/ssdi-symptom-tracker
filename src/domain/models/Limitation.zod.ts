import { z } from 'zod';

const TimeThresholdSchema = z.object({
  durationMinutes: z.number(),
  minDurationMinutes: z.number().optional(),
  maxDurationMinutes: z.number().optional(),
  confidence: z.enum(['low', 'moderate', 'high']),
});

const WeightThresholdSchema = z.object({
  maxPounds: z.number(),
  frequency: z.enum(['never', 'rarely', 'occasionally', 'frequently']),
  notes: z.string().optional(),
});

const DistanceThresholdSchema = z.object({
  maxFeet: z.number().optional(),
  maxBlocks: z.number().optional(),
  withRests: z.boolean(),
  restFrequency: z.string().optional(),
  notes: z.string().optional(),
});

export const LimitationSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  category: z.string(),
  timeThreshold: TimeThresholdSchema.optional(),
  weightThreshold: WeightThresholdSchema.optional(),
  distanceThreshold: DistanceThresholdSchema.optional(),
  frequency: z.string(),
  consequences: z.array(z.string()),
  accommodations: z.array(z.string()).optional(),
  variability: z.string(),
  variabilityNotes: z.string().optional(),
  isActive: z.boolean(),
  notes: z.string().optional(),
});

export const LimitationArraySchema = z.array(LimitationSchema);
