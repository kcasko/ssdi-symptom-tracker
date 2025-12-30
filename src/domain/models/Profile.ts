/**
 * Profile Model
 * Represents a user profile for multi-profile support
 */

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Optional identifying info (can be excluded from exports)
  dateOfBirth?: string;
  primaryConditions?: string[];
  
  // Profile settings
  settings: ProfileSettings;
}

export interface ProfileSettings {
  // Default symptom set for quick logging
  defaultSymptoms: string[];
  
  // Default activities for quick logging
  defaultActivities: string[];
  
  // Reminder preferences
  reminders: {
    dailyLogEnabled: boolean;
    dailyLogTime?: string; // HH:mm format
    activityPromptEnabled: boolean;
  };
  
  // Report preferences
  reportPreferences: {
    includeDetailedNotes: boolean;
    defaultDateRange: string; // preset id
  };
}

/**
 * Create a new profile with defaults
 */
export function createProfile(name: string, id: string): Profile {
  const now = new Date().toISOString();
  
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    settings: {
      defaultSymptoms: [],
      defaultActivities: [],
      reminders: {
        dailyLogEnabled: false,
        activityPromptEnabled: false,
      },
      reportPreferences: {
        includeDetailedNotes: true,
        defaultDateRange: 'week',
      },
    },
  };
}

/**
 * Update profile timestamp
 */
export function touchProfile(profile: Profile): Profile {
  return {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
}
