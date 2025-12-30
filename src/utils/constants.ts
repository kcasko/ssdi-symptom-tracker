/**
 * SSDI Symptom Tracker - Constants
 * App-wide constant values
 */

// App info
export const APP_NAME = 'SSDI Symptom Tracker';
export const APP_VERSION = '1.0.0';

// Storage keys
export const STORAGE_KEYS = {
  PROFILES: '@ssdi/profiles',
  ACTIVE_PROFILE: '@ssdi/activeProfile',
  DAILY_LOGS: '@ssdi/dailyLogs',
  ACTIVITY_LOGS: '@ssdi/activityLogs',
  LIMITATIONS: '@ssdi/limitations',
  MEDICATIONS: '@ssdi/medications',
  APPOINTMENTS: '@ssdi/appointments',
  REPORT_DRAFTS: '@ssdi/reportDrafts',
  SETTINGS: '@ssdi/settings',
  SCHEMA_VERSION: '@ssdi/schemaVersion',
  APP_LOCK_ENABLED: '@ssdi/appLockEnabled',
  FIRST_LAUNCH: '@ssdi/firstLaunch',
} as const;

// Current schema version for migrations
export const CURRENT_SCHEMA_VERSION = 1;

// Severity scale
export const SEVERITY = {
  MIN: 0,
  MAX: 10,
  LABELS: [
    'None',           // 0
    'Minimal',        // 1
    'Very Mild',      // 2
    'Mild',           // 3
    'Mild-Moderate',  // 4
    'Moderate',       // 5
    'Mod-Severe',     // 6
    'Severe',         // 7
    'Very Severe',    // 8
    'Extreme',        // 9
    'Worst Possible', // 10
  ] as const,
} as const;

// Duration presets (in minutes)
export const DURATION_PRESETS = {
  QUICK: [5, 10, 15, 20, 30, 45],
  STANDARD: [15, 30, 45, 60, 90, 120],
  EXTENDED: [30, 60, 120, 180, 240, 480],
} as const;

// Intensity levels for activities
export const INTENSITY_LEVELS = [
  { value: 'light', label: 'Light', description: 'Minimal exertion' },
  { value: 'moderate', label: 'Moderate', description: 'Some exertion' },
  { value: 'heavy', label: 'Heavy', description: 'Significant exertion' },
] as const;

// Impact timing
export const IMPACT_TIMING = {
  IMMEDIATE: 'immediate',
  DELAYED_MINUTES: 'delayed_minutes',
  DELAYED_HOURS: 'delayed_hours',
  NEXT_DAY: 'next_day',
} as const;

// Recovery actions
export const RECOVERY_ACTIONS = [
  { id: 'sit', label: 'Sit down', icon: 'chair' },
  { id: 'lie_down', label: 'Lie down', icon: 'bed' },
  { id: 'rest', label: 'Rest quietly', icon: 'pause' },
  { id: 'nap', label: 'Take a nap', icon: 'moon' },
  { id: 'medication', label: 'Take medication', icon: 'pill' },
  { id: 'ice', label: 'Apply ice', icon: 'snowflake' },
  { id: 'heat', label: 'Apply heat', icon: 'fire' },
  { id: 'stretch', label: 'Stretch', icon: 'body' },
  { id: 'walk', label: 'Short walk', icon: 'walk' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal' },
] as const;

// Functional limitation categories (SSDI relevant)
export const LIMITATION_CATEGORIES = {
  SITTING: 'sitting',
  STANDING: 'standing',
  WALKING: 'walking',
  LIFTING: 'lifting',
  CARRYING: 'carrying',
  REACHING: 'reaching',
  BENDING: 'bending',
  CLIMBING: 'climbing',
  CONCENTRATION: 'concentration',
  MEMORY: 'memory',
  SOCIAL: 'social',
  SELF_CARE: 'self_care',
} as const;

// Report types
export const REPORT_TYPES = {
  DAILY_SUMMARY: 'daily_summary',
  ACTIVITY_IMPACT: 'activity_impact',
  FUNCTIONAL_LIMITATIONS: 'functional_limitations',
  FULL_NARRATIVE: 'full_narrative',
} as const;

// Export formats
export const EXPORT_FORMATS = {
  TEXT: 'text',
  PDF: 'pdf',
} as const;

// Date range presets
export const DATE_RANGE_PRESETS = [
  { id: 'today', label: 'Today', days: 1 },
  { id: 'week', label: 'Last 7 days', days: 7 },
  { id: '2weeks', label: 'Last 14 days', days: 14 },
  { id: 'month', label: 'Last 30 days', days: 30 },
  { id: '3months', label: 'Last 90 days', days: 90 },
  { id: 'custom', label: 'Custom range', days: 0 },
] as const;

// Validation limits
export const VALIDATION = {
  MAX_NOTE_LENGTH: 2000,
  MAX_SYMPTOMS_PER_LOG: 20,
  MAX_ACTIVITIES_PER_DAY: 50,
  MIN_DURATION_MINUTES: 1,
  MAX_DURATION_MINUTES: 1440, // 24 hours
} as const;
