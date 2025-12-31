/**
 * Seed Data Generator
 * Creates sample data for testing and development
 */

import { Profile, createProfile } from '../domain/models/Profile';
import { DailyLog, createDailyLog } from '../domain/models/DailyLog';
import { ActivityLog, createActivityLog } from '../domain/models/ActivityLog';
import { Limitation, createLimitation } from '../domain/models/Limitation';
import { getSymptomById } from '../data/symptoms';
import { getActivityById } from '../data/activities';
import { generateId } from './ids';

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
  const profile = createProfile('Test User', generateId());

  // Generate 30 days of daily logs
  const dailyLogs: DailyLog[] = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];

    const log = createDailyLog(generateId(), profile.id, dateString, 'morning');

    // Add 2-4 random symptoms per day
    const symptomCount = Math.floor(Math.random() * 3) + 2;
    const symptomIds = ['chronic_pain', 'fatigue', 'brain_fog', 'nausea'];

    for (let j = 0; j < symptomCount; j++) {
      const symptomId = symptomIds[j % symptomIds.length];
      const symptom = getSymptomById(symptomId);
      
      if (symptom) {
        const severity = Math.floor(Math.random() * 5) + 4; // 4-8 range
        log.symptoms.push({
          symptomId: symptom.id,
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
      const log = createActivityLog(
        generateId(),
        profile.id,
        activity.id,
        activity.name,
        dateString
      );
      
      // Set duration
      log.duration = Math.floor(Math.random() * 60) + 15; // 15-75 minutes

      // Add impact to immediateImpact
      const impactSeverity = Math.floor(Math.random() * 4) + 5; // 5-8
      log.immediateImpact.symptoms.push({
        symptomId: 'chronic_pain',
        severity: impactSeverity,
        onsetTiming: 'during',
      });
      log.immediateImpact.overallImpact = impactSeverity;

      // Add recovery for higher impact activities
      if (impactSeverity >= 7) {
        log.recoveryActions.push({
          actionId: 'rest',
          actionName: 'Rest',
          helpful: true,
        });
        log.recoveryDuration = 30;
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
  const sitting = createLimitation(generateId(), profile.id, 'sitting');
  sitting.frequency = 'usually';
  sitting.timeThreshold = { durationMinutes: 30, confidence: 'moderate' };
  sitting.consequences = ['Increased pain', 'Need to change position'];
  limitations.push(sitting);

  // Standing limitation
  const standing = createLimitation(generateId(), profile.id, 'standing');
  standing.frequency = 'often';
  standing.timeThreshold = { durationMinutes: 20, confidence: 'moderate' };
  standing.consequences = ['Fatigue', 'Increased pain'];
  limitations.push(standing);

  // Walking limitation
  const walking = createLimitation(generateId(), profile.id, 'walking');
  walking.frequency = 'often';
  walking.distanceThreshold = { maxBlocks: 2, withRests: true };
  walking.consequences = ['Severe fatigue', 'Pain flare'];
  limitations.push(walking);

  // Lifting limitation
  const lifting = createLimitation(generateId(), profile.id, 'lifting');
  lifting.frequency = 'usually';
  lifting.weightThreshold = { maxPounds: 10, frequency: 'occasionally' };
  lifting.consequences = ['Immediate pain increase', 'Extended recovery needed'];
  limitations.push(lifting);

  // Concentration limitation
  const concentration = createLimitation(generateId(), profile.id, 'concentration');
  concentration.frequency = 'often';
  concentration.timeThreshold = { durationMinutes: 60, confidence: 'high' };
  concentration.consequences = ['Brain fog', 'Unable to focus'];
  limitations.push(concentration);

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
  const profile = createProfile('Demo User', generateId());
  const dailyLogs: DailyLog[] = [];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];

    const log = createDailyLog(generateId(), profile.id, dateString, 'morning');

    const symptom = getSymptomById('chronic_pain');
    if (symptom) {
      log.symptoms.push({
        symptomId: symptom.id,
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
