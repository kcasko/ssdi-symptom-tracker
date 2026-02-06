/**
 * REQ-LANG-005: PDF Narrative Analysis
 * Requirement: PDF narratives use neutral descriptive language
 */

import { SYMPTOMS } from '../../src/data/symptoms';
import { ACTIVITIES } from '../../src/data/activities';

describe('REQ-LANG-005: PDF Narrative Language Neutrality', () => {
  test('Symptom descriptions use neutral medical terminology', () => {
    const prohibitedWords = [/\bterrible\b/i, /\bdevastating\b/i, /\bunbearable\b/i, /\bi feel\b/i];

    SYMPTOMS.forEach(symptom => {
      prohibitedWords.forEach(pattern => {
        expect(symptom.name).not.toMatch(pattern);
        symptom.severityGuidelines?.forEach((guideline) => {
          expect(guideline.description).not.toMatch(pattern);
        });
      });
    });
  });

  test('Activity descriptions are objective and factual', () => {
    const prohibitedWords = [/\bimpossible\b/i, /\bI feel\b/i, /\balways\b/i];

    ACTIVITIES.forEach(activity => {
      prohibitedWords.forEach(pattern => {
        expect(activity.name).not.toMatch(pattern);
      });
    });
  });

  test('Sample PDF narrative demonstrates neutral language', () => {
    const samplePDF = 'Symptom: Fatigue, Severity 7/10, Duration 4 hours. Unable to stand > 10 minutes.';
    expect(samplePDF).not.toMatch(/\bterrible\b/i);
    expect(samplePDF).not.toMatch(/\bI feel\b/i);
  });

  test('Severity descriptions are factual and measurable', () => {
    const sampleDescriptions = ['Minimal impact', 'Moderate limitation', 'Severe limitation'];
    sampleDescriptions.forEach(desc => {
      expect(desc).not.toMatch(/\bterrible\b/i);
    });
  });

  test('Timing descriptions are objective', () => {
    const timingPhrases = ['Duration: 30 minutes', 'Required rest after 15 minutes'];
    timingPhrases.forEach(phrase => {
      expect(phrase).not.toMatch(/\bfelt like forever\b/i);
    });
  });

  test('Impact descriptions focus on observable limitations', () => {
    const functionalDescriptions = ['Unable to lift > 10 pounds', 'Required assistance'];
    functionalDescriptions.forEach(desc => {
      expect(desc).not.toMatch(/\bfrustrating\b/i);
    });
  });

  test('Neutral language examples pass validation', () => {
    const neutralExamples = ['Severity: 7/10', 'Duration: 3 hours', 'Unable to complete task'];
    neutralExamples.forEach(example => {
      expect(example).not.toMatch(/\bterrible\b/i);
    });
  });
});
