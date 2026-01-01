/**
 * Scenario-specific seed data generators for scenario testing
 */
export function generateMildScenarioSeedData(): SeedData {
  // User A: Mild, inconsistent symptoms
  const profile = createProfile('User A (Mild)', generateId());
  // (removed duplicate declaration)
  const now = new Date();
  const symptomIds = ['chronic_pain', 'fatigue', 'headache'];
  const activityIds = ['walking', 'cooking', 'desk_work'];
  const medicationNames = ['Ibuprofen', 'Acetaminophen'];
  const appointmentTypes = ['Primary Care', 'Physical Therapy'];
  const dailyLogs: DailyLog[] = [];
  const activityLogs: ActivityLog[] = [];
  const medications = [];
  const appointments = [];
  let ensuredSymptom = false;
  let ensuredActivity = false;
  for (let i = 0; i < 45; i++) {
    // Always add at least one log with all symptoms and one with all activities
    const forceSymptom = !ensuredSymptom && i === 0;
    const forceActivity = !ensuredActivity && i === 1;
    if (Math.random() < 0.4 || forceSymptom || forceActivity) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      const log = createDailyLog(generateId(), profile.id, dateString, 'morning');
      // Add all symptoms for the first log, otherwise 1-2 per log
      const symptomCount = forceSymptom ? symptomIds.length : (Math.random() < 0.5 ? 1 : 2);
      for (let j = 0; j < symptomCount; j++) {
        const sid = symptomIds[j % symptomIds.length];
        const severity = Math.random() < 0.15 ? 5 : Math.floor(Math.random() * 3) + 2;
        log.symptoms.push({ symptomId: sid, severity, notes: severity > 4 ? 'Mild flare after activity' : undefined });
      }
      log.overallSeverity = Math.max(...log.symptoms.map(s => s.severity));
      if (forceSymptom) ensuredSymptom = true;
      if (i % 10 === 0) log.notes = 'Slept poorly, weather changed.';
      dailyLogs.push(log);
      // Always add at least one activity log
      if (Math.random() < 0.3 || forceActivity) {
        const activityId = activityIds[i % activityIds.length];
        const activity = getActivityById(activityId);
        if (activity) {
          const actLog = createActivityLog(generateId(), profile.id, activity.id, activity.name, dateString);
          actLog.duration = Math.floor(Math.random() * 30) + 10;
          actLog.immediateImpact.symptoms.push({ symptomId: 'fatigue', severity: 3, onsetTiming: 'later' });
          actLog.immediateImpact.overallImpact = 3;
          if (Math.random() < 0.2) actLog.notes = 'Needed a short rest.';
          activityLogs.push(actLog);
          if (forceActivity) ensuredActivity = true;
        }
      }
      // Add medication occasionally
      if (Math.random() < 0.2) {
        medications.push({ name: medicationNames[i % medicationNames.length], date: dateString, dose: '200mg', taken: true });
      }
      // Add appointment occasionally
      if (Math.random() < 0.1) {
        appointments.push({ type: appointmentTypes[i % appointmentTypes.length], date: dateString, notes: 'Routine check.' });
      }
    }
  }
  // Occasional activity limitations, mostly normal days
  const limitations: Limitation[] = [];
  if (Math.random() < 0.5) {
    const sitting = createLimitation(generateId(), profile.id, 'sitting');
    sitting.frequency = 'rarely';
    sitting.timeThreshold = { durationMinutes: 60, confidence: 'low' };
    sitting.consequences = ['Mild discomfort'];
    limitations.push(sitting);
  }
  return { profile, dailyLogs, activityLogs, limitations };
}

export function generateModerateScenarioSeedData(): SeedData {
  // User B: Moderate, fluctuating symptoms
  const profile = createProfile('User B (Moderate)', generateId());
  const dailyLogs: DailyLog[] = [];
  const activityLogs: ActivityLog[] = [];
  const now = new Date();
  const activityIds = ['walking', 'cooking', 'desk_work', 'cleaning'];
  const symptomIds = ['chronic_pain', 'fatigue', 'brain_fog'];
  const medicationNames = ['Gabapentin', 'Naproxen'];
  const appointmentTypes = ['Neurology', 'Pain Clinic'];
  const medications = [];
  const appointments = [];
  for (let i = 0; i < 45; i++) {
    if (Math.random() < 0.7) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      const log = createDailyLog(generateId(), profile.id, dateString, 'morning');
      // Add 2-3 symptoms per log
      const symptomCount = Math.random() < 0.5 ? 2 : 3;
      for (let j = 0; j < symptomCount; j++) {
        const sid = symptomIds[j % symptomIds.length];
        const flare = Math.random() < 0.18;
        const severity = flare ? Math.floor(Math.random() * 2) + 6 : Math.floor(Math.random() * 5) + 3;
        log.symptoms.push({ symptomId: sid, severity, notes: flare ? 'Flare after activity' : undefined });
      }
      log.overallSeverity = Math.max(...log.symptoms.map(s => s.severity));
      if (i % 7 === 0) log.notes = 'Weather change, more fatigue.';
      dailyLogs.push(log);
      // Activity log: some days missed, some with recovery
      if (Math.random() < 0.5) {
        const activityId = activityIds[i % activityIds.length];
        const activity = getActivityById(activityId);
        if (activity) {
          const actLog = createActivityLog(generateId(), profile.id, activity.id, activity.name, dateString);
          actLog.duration = Math.floor(Math.random() * 40) + 20;
          const impactSeverity = Math.floor(Math.random() * 4) + 4;
          actLog.immediateImpact.symptoms.push({ symptomId: 'chronic_pain', severity: impactSeverity, onsetTiming: 'during' });
          actLog.immediateImpact.overallImpact = impactSeverity;
          if (impactSeverity > 6) {
            actLog.recoveryActions.push({ actionId: 'rest', actionName: 'Rest', helpful: true });
            actLog.recoveryDuration = 30;
            actLog.stoppedEarly = Math.random() > 0.5;
          }
          if (Math.random() < 0.2) actLog.notes = 'Needed extra rest.';
          activityLogs.push(actLog);
        }
      }
      // Add medication occasionally
      if (Math.random() < 0.3) {
        medications.push({ name: medicationNames[i % medicationNames.length], date: dateString, dose: '300mg', taken: true });
      }
      // Add appointment occasionally
      if (Math.random() < 0.15) {
        appointments.push({ type: appointmentTypes[i % appointmentTypes.length], date: dateString, notes: 'Follow-up.' });
      }
    }
  }
  // Several limitations, some days missed activities
  const limitations: Limitation[] = [];
  const standing = createLimitation(generateId(), profile.id, 'standing');
  standing.frequency = 'sometimes';
  standing.timeThreshold = { durationMinutes: 30, confidence: 'moderate' };
  standing.consequences = ['Fatigue', 'Mild pain'];
  limitations.push(standing);
  const concentration = createLimitation(generateId(), profile.id, 'concentration');
  concentration.frequency = 'sometimes';
  concentration.timeThreshold = { durationMinutes: 45, confidence: 'moderate' };
  concentration.consequences = ['Brain fog'];
  limitations.push(concentration);
  return { profile, dailyLogs, activityLogs, limitations };
}

export function generateSevereScenarioSeedData(): SeedData {
  // User C: Severe, persistent symptoms
  const profile = createProfile('User C (Severe)', generateId());
  const dailyLogs: DailyLog[] = [];
  const activityLogs: ActivityLog[] = [];
  const now = new Date();
  const activityIds = ['walking', 'cooking', 'desk_work', 'cleaning'];
  const symptomIds = ['chronic_pain', 'fatigue', 'nausea', 'brain_fog'];
  const medicationNames = ['Morphine', 'Prednisone'];
  const appointmentTypes = ['Pain Specialist', 'Rheumatology'];
  const medications = [];
  const appointments = [];
  for (let i = 0; i < 60; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];
    const log = createDailyLog(generateId(), profile.id, dateString, 'morning');
    // Add 3-4 symptoms per log
    const symptomCount = Math.random() < 0.5 ? 3 : 4;
    for (let j = 0; j < symptomCount; j++) {
      const sid = symptomIds[j % symptomIds.length];
      const flare = Math.random() < 0.4;
      const severity = flare ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 3) + 6;
      log.symptoms.push({ symptomId: sid, severity, notes: flare ? 'Severe flare, unable to function' : undefined });
    }
    log.overallSeverity = Math.max(...log.symptoms.map(s => s.severity));
    if (i % 5 === 0) log.notes = 'Severe fatigue, unable to complete tasks.';
    dailyLogs.push(log);
    // Activity log: frequent inability to complete tasks
    if (Math.random() < 0.7) {
      const activityId = activityIds[i % activityIds.length];
      const activity = getActivityById(activityId);
      if (activity) {
        const actLog = createActivityLog(generateId(), profile.id, activity.id, activity.name, dateString);
        actLog.duration = Math.floor(Math.random() * 20) + 10;
        const impactSeverity = Math.max(...log.symptoms.map(s => s.severity));
        actLog.immediateImpact.symptoms.push({ symptomId: 'chronic_pain', severity: impactSeverity, onsetTiming: 'during' });
        actLog.immediateImpact.overallImpact = impactSeverity;
        actLog.stoppedEarly = true;
        actLog.recoveryActions.push({ actionId: 'rest', actionName: 'Rest', helpful: true });
        actLog.recoveryDuration = 60;
        actLog.notes = 'Could not finish activity.';
        activityLogs.push(actLog);
      }
    }
    // Add medication daily
    medications.push({ name: medicationNames[i % medicationNames.length], date: dateString, dose: '10mg', taken: true });
    // Add appointment every 10 days
    if (i % 10 === 0) {
      appointments.push({ type: appointmentTypes[i % appointmentTypes.length], date: dateString, notes: 'Specialist follow-up.' });
    }
  }
  // Multiple limitations, regular medication and appointments
  const limitations: Limitation[] = [];
  const walking = createLimitation(generateId(), profile.id, 'walking');
  walking.frequency = 'always';
  walking.distanceThreshold = { maxBlocks: 1, withRests: true };
  walking.consequences = ['Severe fatigue', 'Pain flare'];
  limitations.push(walking);
  const lifting = createLimitation(generateId(), profile.id, 'lifting');
  lifting.frequency = 'always';
  lifting.weightThreshold = { maxPounds: 5, frequency: 'never' };
  lifting.consequences = ['Immediate pain increase', 'Extended recovery needed'];
  limitations.push(lifting);
  const concentration = createLimitation(generateId(), profile.id, 'concentration');
  concentration.frequency = 'always';
  concentration.timeThreshold = { durationMinutes: 20, confidence: 'low' };
  concentration.consequences = ['Unable to focus', 'Brain fog'];
  limitations.push(concentration);
  return { profile, dailyLogs, activityLogs, limitations };
}
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
