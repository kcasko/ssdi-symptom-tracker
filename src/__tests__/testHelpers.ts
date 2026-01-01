/**
 * Test helper functions for creating mock data
 */

import { DailyLog, SymptomEntry, TimeOfDay } from '../domain/models/DailyLog';
import { Limitation } from '../domain/models/Limitation';
import { WorkHistory, JobDuty } from '../domain/models/WorkHistory';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Appointment } from '../domain/models/Appointment';
import { Medication } from '../domain/models/Medication';

export function createMockDailyLog(overrides?: Partial<DailyLog>): DailyLog {
  const now = new Date().toISOString();
  return {
    id: 'log1',
    profileId: 'profile1',
    createdAt: now,
    updatedAt: now,
    logDate: '2024-01-01',
    timeOfDay: 'morning',
    symptoms: [],
    overallSeverity: 5,
    ...overrides
  };
}

export function createMockDailyLogs(count: number, baseOverrides?: Partial<DailyLog>): DailyLog[] {
  return Array(count).fill(null).map((_, i) => {
    const date = new Date(2024, 0, i + 1);
    return createMockDailyLog({
      id: `log${i}`,
      logDate: date.toISOString().split('T')[0],
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      ...baseOverrides
    });
  });
}

export function createMockLimitation(overrides?: Partial<Limitation>): Limitation {
  return {
    id: 'lim1',
    profileId: 'profile1',
    category: 'mobility',
    description: 'Test limitation',
    severity: 'moderate',
    dateStarted: new Date('2024-01-01'),
    impacts: ['work'],
    accommodationsNeeded: [],
    ...overrides
  };
}

export function createMockWorkHistory(overrides?: Partial<WorkHistory>): WorkHistory {
  return {
    id: 'job1',
    profileId: 'profile1',
    jobTitle: 'Test Job',
    employer: 'Test Employer',
    startDate: new Date('2020-01-01'),
    hoursPerWeek: 40,
    duties: [],
    physicalDemands: {
      exertionLevel: 'light',
      liftingRequirement: { maxWeight: 20, frequentWeight: 10 },
      standingHours: 4,
      walkingHours: 2,
      sittingHours: 2
    },
    ...overrides
  };
}

export function createMockJobDuty(overrides?: Partial<JobDuty>): JobDuty {
  return {
    description: 'Test duty',
    frequency: 'frequent',
    physicalRequirements: {},
    essential: true,
    ...overrides
  };
}

export function createMockActivityLog(overrides?: Partial<ActivityLog>): ActivityLog {
  return {
    id: 'activity1',
    profileId: 'profile1',
    logDate: '2024-01-01',
    activityType: 'housework',
    duration: 60,
    difficultyLevel: 'moderate',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

export function createMockAppointment(overrides?: Partial<Appointment>): Appointment {
  return {
    id: 'appt1',
    profileId: 'profile1',
    date: new Date('2024-01-15'),
    providerName: 'Dr. Test',
    type: 'doctor',
    purpose: 'Test appointment',
    location: 'Test Clinic',
    ...overrides
  };
}

export function createMockMedication(overrides?: Partial<Medication>): Medication {
  return {
    id: 'med1',
    profileId: 'profile1',
    name: 'Test Medication',
    dosage: '100mg',
    frequency: 'daily',
    startDate: new Date('2024-01-01'),
    ...overrides
  };
}
