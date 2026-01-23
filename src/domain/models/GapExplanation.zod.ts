import { z } from 'zod';

export const GapExplanationSchema = z.object({
  id: z.string().optional(),
  profileId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string(),
  note: z.string().optional(),
});

export const GapExplanationArraySchema = z.array(GapExplanationSchema);
