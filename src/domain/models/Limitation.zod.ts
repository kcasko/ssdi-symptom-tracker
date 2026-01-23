import { z } from 'zod';

export const LimitationSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  limitationType: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
  startDate: z.string(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export const LimitationArraySchema = z.array(LimitationSchema);
