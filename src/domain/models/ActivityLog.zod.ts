import { z } from 'zod';

export const ActivityLogSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  activityDate: z.string(),
  activityType: z.string(),
  description: z.string().optional(),
  durationMinutes: z.number().optional(),
  impact: z.string().optional(),
  retrospectiveContext: z.any().optional(), // Replace with actual schema if available
  photos: z.array(z.string()).optional(),
  finalized: z.boolean().optional(),
  finalizedAt: z.string().optional(),
  finalizedBy: z.string().optional(),
});

export const ActivityLogArraySchema = z.array(ActivityLogSchema);
