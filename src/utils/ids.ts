import { v4 as uuidv4 } from 'uuid';

/**
 * SSDI Symptom Tracker - ID Utilities
 * Stable, unique identifiers for all records
 */

/**
 * Generate a new UUID v4
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a prefixed ID for easier debugging
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${uuidv4()}`;
}

/**
 * Generate IDs for specific entity types
 */
export const ids = {
  profile: () => generatePrefixedId('profile'),
  dailyLog: () => generatePrefixedId('daily'),
  activityLog: () => generatePrefixedId('activity'),
  limitation: () => generatePrefixedId('limit'),
  medication: () => generatePrefixedId('med'),
  appointment: () => generatePrefixedId('appt'),
  reportDraft: () => generatePrefixedId('report'),
  section: () => generatePrefixedId('section'),
  textBlock: () => generatePrefixedId('block'),
};

/**
 * Validate that a string is a valid UUID
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Allow prefixed IDs
  const uuidPart = id.includes('_') ? id.split('_').pop() : id;
  if (!uuidPart) return false;
  
  // UUID v4 regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuidPart);
}

/**
 * Extract the prefix from a prefixed ID
 */
export function getIdPrefix(id: string): string | null {
  if (!id || !id.includes('_')) return null;
  return id.split('_')[0];
}

/**
 * Compare two IDs for equality
 */
export function idsEqual(id1: string | null | undefined, id2: string | null | undefined): boolean {
  if (!id1 || !id2) return false;
  return id1 === id2;
}
