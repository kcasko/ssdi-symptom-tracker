import { z } from 'zod';

export const AppointmentSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  appointmentDate: z.string(),
  providerName: z.string().optional(),
  providerType: z.string().optional(),
  purpose: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export const AppointmentArraySchema = z.array(AppointmentSchema);
