import { z } from 'zod';

export const MedicationSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  name: z.string(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  isActive: z.boolean(),
  startDate: z.string(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export const MedicationArraySchema = z.array(MedicationSchema);
