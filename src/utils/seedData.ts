/**
 * Seed Data Generator
 * Creates sample data for testing and development
 */

import { Profile, createProfile } from '../domain/models/Profile';
import { DailyLog, createDailyLog, addSymptom } from '../domain/models/DailyLog';
import { ActivityLog, createActivityLog, addImpact, addRecovery } from '../domain/models/ActivityLog';
import { Limitation, createLimitation } from '../domain/models/Limitation';
import { getSymptomById } from '../data/symptoms';
import { getActivityById } from '../data/activities';

export interface SeedData {
  profile: Profile;
  dailyLogs: DailyLog[];
  activityLogs: ActivityLog[];
  limitations: Limitation[];
}

/**
 * Generate sample data for testing
 */
export function generateSeedData(): SeedData {
  // Create profile
  const profile = createProfile('Test User');

  // Generate 30 days of daily logs
  const dailyLogs: DailyLog[] = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];

    let log = createDailyLog(profile.id, dateString);

    // Add 2-4 random symptoms per day
    const symptomCount = Math.floor(Math.random() * 3) + 2;
    const symptomIds = ['chronic_pain', 'fatigue', 'brain_fog', 'nausea'];

    for (let j = 0; j < symptomCount; j++) {
      const symptomId = symptomIds[j % symptomIds.length];
      const symptom = getSymptomById(symptomId);
      
      if (symptom) {
        const severity = Math.floor(Math.random() * 5) + 4; // 4-8 range
        log = addSymptom(log, {
          symptomId: symptom.id,
          symptomName: symptom.name,
          severity,
          notes: i % 5 === 0 ? 'Worse after activity' : undefined,
        });
      }
    }

    // Calculate overall severity
    const severities = log.symptoms.map(s => s.severity);
    log.overallSeverity = Math.max(...severities);

    if (i % 3 !== 0) { // Only add notes to some logs
      log.notes = 'Sample daily log entry';
    }

    dailyLogs.push(log);
  }

  // Generate activity logs
  const activityLogs: ActivityLog[] = [];
  const activityIds = ['walking', 'cooking', 'desk_work', 'cleaning'];

  for (let i = 0; i < 15; i++) {
    const date = new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];

    const activityId = activityIds[i % activityIds.length];
    const activity = getActivityById(activityId);

    if (activity) {
      let log = createActivityLog(
        profile.id,
        activity.id,
        activity.name,
        dateString,
        Math.floor(Math.random() * 60) + 15 // 15-75 minutes
      );

      // Add impact
      log = addImpact(log, {
        symptomId: 'chronic_pain',
        symptomName: 'Pain',
        severity: Math.floor(Math.random() * 4) + 5, // 5-8
      });

      // Add recovery for higher impact activities
      if (log.impacts.length > 0 && log.impacts[0].severity >= 7) {
        log = addRecovery(log, 'Rest', 30);
        log.stoppedEarly = Math.random() > 0.5;
      }

      if (i % 4 === 0) {
        log.notes = 'Had to take breaks';
      }

      activityLogs.push(log);
    }
  }

  // Generate limitations
  const limitations: Limitation[] = [];

  // Sitting limitation
  limitations.push(
    createLimitation(profile.id, 'sitting', 'usually', {
      timeThreshold: { durationMinutes: 30 },
      consequences: ['Increased pain', 'Need to change position'],
      supportingLogs: dailyLogs.slice(0, 10).map(l => l.id),
    })
  );

  // Standing limitation
  limitations.push(
    createLimitation(profile.id, 'standing', 'often', {
      timeThreshold: { durationMinutes: 20 },
      consequences: ['Fatigue', 'Increased pain'],
      supportingLogs: dailyLogs.slice(0, 8).map(l => l.id),
    })
  );

  // Walking limitation
  limitations.push(
    createLimitation(profile.id, 'walking', 'often', {
      distanceThreshold: { maxBlocks: 2 },
      consequences: ['Severe fatigue', 'Pain flare'],
      supportingLogs: activityLogs.slice(0, 5).map(l => l.id),
    })
  );

  // Lifting limitation
  limitations.push(
    createLimitation(profile.id, 'lifting', 'usually', {
      weightThreshold: { maxPounds: 10, frequency: 'occasionally' },
      consequences: ['Immediate pain increase', 'Extended recovery needed'],
      supportingLogs: [],
    })
  );

  // Concentration limitation
  limitations.push(
    createLimitation(profile.id, 'concentration', 'often', {
      timeThreshold: { durationMinutes: 60 },
      consequences: ['Brain fog', 'Unable to focus'],
      supportingLogs: dailyLogs.slice(0, 12).map(l => l.id),
    })
  );

  return {
    profile,
    dailyLogs,
    activityLogs,
    limitations,
  };
}

/**
 * Generate minimal seed data (1 profile, 7 days)
 */
export function generateMinimalSeedData(): SeedData {
  const profile = createProfile('Demo User');
  const dailyLogs: DailyLog[] = [];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];

    let log = createDailyLog(profile.id, dateString);

    const symptom = getSymptomById('chronic_pain');
    if (symptom) {
      log = addSymptom(log, {
        symptomId: symptom.id,
        symptomName: symptom.name,
        severity: 6,
      });
    }

    log.overallSeverity = 6;
    dailyLogs.push(log);
  }

  return {
    profile,
    dailyLogs,
    activityLogs: [],
    limitations: [],
  };
}
