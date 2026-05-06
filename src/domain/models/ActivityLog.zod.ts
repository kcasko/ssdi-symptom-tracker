import { z } from 'zod';

const ActivitySymptomSchema = z.object({
  symptomId: z.string(),
  severity: z.number().min(0).max(10),
  onsetTiming: z.enum(['during', 'immediately_after', 'within_30min', 'within_hour', 'later']),
});

const ImpactAssessmentSchema = z.object({
  symptoms: z.array(ActivitySymptomSchema),
  overallImpact: z.number().min(0).max(10),
  functionalImpacts: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const DelayedImpactSchema = z.object({
  assessedAt: z.string(),
  hoursAfter: z.number(),
  symptoms: z.array(ActivitySymptomSchema),
  overallImpact: z.number().min(0).max(10),
  notes: z.string().optional(),
});

const RecoveryActionSchema = z.object({
  actionId: z.string(),
  actionName: z.string(),
  duration: z.number().optional(),
  helpful: z.boolean(),
  notes: z.string().optional(),
});

export const ActivityLogSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  activityDate: z.string(),
  startTime: z.string().optional(),
  activityId: z.string(),
  activityName: z.string(),
  customActivityName: z.string().optional(),
  duration: z.number(),
  plannedDuration: z.number().optional(),
  intensity: z.enum(['light', 'moderate', 'heavy']),
  immediateImpact: ImpactAssessmentSchema,
  delayedImpact: DelayedImpactSchema.optional(),
  recoveryActions: z.array(RecoveryActionSchema),
  recoveryDuration: z.number().optional(),
  stoppedEarly: z.boolean(),
  stopReason: z.string().optional(),
  assistanceNeeded: z.boolean().optional(),
  assistanceType: z.string().optional(),
  notes: z.string().optional(),
  retrospectiveContext: z.any().optional(),
  photos: z.array(z.string()).optional(),
});

export const ActivityLogArraySchema = z.array(ActivityLogSchema);
