/**
 * Test helper functions for creating mock data
 */

import { DailyLog, SymptomEntry, TimeOfDay, SleepEntry } from '../domain/models/DailyLog';
import { Limitation, LimitationCategory, LimitationFrequency, VariabilityLevel } from '../domain/models/Limitation';
import { WorkHistory, JobDuty, PhysicalDemands, WorkImpact, DutyImpact } from '../domain/models/WorkHistory';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Appointment, AppointmentPurpose } from '../domain/models/Appointment';
import { Medication, MedicationFrequency } from '../domain/models/Medication';

export function createMockDailyLog(overrides?: Partial<DailyLog>): DailyLog {
  const now = new Date().toISOString();
  return {
    id: 'log1',
    profileId: 'profile1',
    createdAt: now,
    updatedAt: now,
    logDate: '2024-01-01',
    timeOfDay: 'morning' as TimeOfDay,
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
  const now = new Date().toISOString();
  return {
    id: 'lim1',
    profileId: 'profile1',
    createdAt: now,
    updatedAt: now,
    category: 'standing' as LimitationCategory,
    frequency: 'constant' as LimitationFrequency,
    consequences: ['Pain increases', 'Fatigue worsens'],
    variability: 'moderate' as VariabilityLevel,
    isActive: true,
    ...overrides
  };
}

export function createMockWorkHistory(overrides?: Partial<WorkHistory>): WorkHistory {
  const now = new Date().toISOString();
  return {
    id: 'job1',
    profileId: 'profile1',
    jobTitle: 'Test Job',
    employer: 'Test Employer',
    startDate: '2020-01-01',
    hoursPerWeek: 40,
    stillEmployed: false,
    wasFullTime: true,
    physicalDemands: {
      exertionLevel: 'light',
      liftingRequired: { maxWeightPounds: 20, frequency: 'occasional' },
      standing: { required: true, maxHoursPerDay: 4 },
      walking: { required: true, maxHoursPerDay: 2 }
    } as PhysicalDemands,
    duties: [],
    skillsRequired: [],
    disabilityRelated: false,
    ...overrides
  };
}

export function mockJobDuty(overrides?: Partial<JobDuty>): JobDuty {
  return {
    id: 'duty1',
    description: 'Test duty',
    frequency: 'frequently',
    physicalRequirements: [],
    isEssential: true,
    ...overrides
  };
}

export function createMockSymptomEntry(overrides?: Partial<SymptomEntry>): SymptomEntry {
  return {
    symptomId: 'symptom1',
    severity: 5,
    duration: 60,
    ...overrides
  };
}

export function createMockSleepEntry(overrides?: Partial<SleepEntry>): SleepEntry {
  return {
    hoursSlept: 6,
    quality: 5,
    restful: false,
    ...overrides
  };
}

export function createMockActivityLog(overrides?: Partial<ActivityLog>): ActivityLog {
  const now = new Date().toISOString();
  return {
    id: 'activity1',
    profileId: 'profile1',
    createdAt: now,
    updatedAt: now,
    activityDate: now.split('T')[0],
    activityId: 'housework',
    activityName: 'Housework',
    duration: 60,
    intensity: 'moderate',
    immediateImpact: {
      symptoms: [],
      overallImpact: 3
    },
    recoveryActions: [],
    stoppedEarly: false,
    ...overrides
  };
}

export function createMockAppointment(overrides?: Partial<Appointment>): Appointment {
  const now = new Date().toISOString();
  return {
    id: 'appt1',
    profileId: 'profile1',
    createdAt: now,
    updatedAt: now,
    appointmentDate: '2024-01-15T10:00:00.000Z',
    providerName: 'Dr. Test',
    specialty: 'Primary Care',
    purpose: 'routine_checkup' as AppointmentPurpose,
    ...overrides
  };
}

export function createMockMedication(overrides?: Partial<Medication>): Medication {
  const now = new Date().toISOString();
  return {
    id: 'med1',
    profileId: 'profile1',
    createdAt: now,
    updatedAt: now,
    name: 'Test Medication',
    dosage: '100mg',
    frequency: 'daily' as MedicationFrequency,
    startDate: '2024-01-01',
    prescribedBy: 'Dr. Test',
    purpose: 'Pain management',
    active: true,
    ...overrides
  };
}
