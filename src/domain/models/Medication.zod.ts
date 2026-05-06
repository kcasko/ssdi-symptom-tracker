import { z } from 'zod';

export const MedicationSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  name: z.string(),
  genericName: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  purpose: z.array(z.string()).optional(),
  prescriber: z.string().optional(),
  isActive: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sideEffects: z.array(z.string()).optional(),
  effectiveness: z.string().optional(),
  effectivenessNotes: z.string().optional(),
  notes: z.string().optional(),
  discontinuedReason: z.string().optional(),
});

export const MedicationArraySchema = z.array(MedicationSchema);
