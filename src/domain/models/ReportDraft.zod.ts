import { z } from 'zod';

export const ReportDraftSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  title: z.string(),
  reportType: z.string(),
  dateRange: z.object({ start: z.string(), end: z.string() }),
  sections: z.array(z.any()), // Replace with actual section schema if available
  sourceReferences: z.array(z.any()), // Replace with actual source reference schema if available
  generatedAt: z.string(),
  lastRegeneratedAt: z.string().optional(),
  exports: z.array(z.any()), // Replace with actual export record schema if available
  status: z.string(),
  draftNotes: z.string().optional(),
});

export const ReportDraftArraySchema = z.array(ReportDraftSchema);
