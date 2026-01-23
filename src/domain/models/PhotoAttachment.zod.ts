import { z } from 'zod';

export const PhotoAttachmentSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  uri: z.string(),
  addedAt: z.string(),
  capturedAt: z.string().optional(),
  notes: z.string().optional(),
});

export const PhotoAttachmentArraySchema = z.array(PhotoAttachmentSchema);
