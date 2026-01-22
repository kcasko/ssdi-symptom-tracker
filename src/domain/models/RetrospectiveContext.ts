/**
 * Retrospective Context
 * Captures why an entry was logged after the event date
 */

export interface RetrospectiveContext {
  // Optional preset reason (e.g., symptoms prevented logging)
  reason?: string;
  
  // Free-text note from the user
  note?: string;
  
  // When the retrospective marker was applied
  flaggedAt?: string;
  
  // Days between event date and creation at the time it was logged
  daysDelayed?: number;
}
