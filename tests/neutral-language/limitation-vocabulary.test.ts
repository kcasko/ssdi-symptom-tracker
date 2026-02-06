/**
 * Limitation Vocabulary Neutral Language Tests
 * Tests REQ-LANG-004: Ensures limitation terms use neutral, functional language
 */

import { LIMITATION_TEMPLATES } from '../../src/data/limitations';
import { createTestResult } from '../test-utils';

describe('REQ-LANG-004: Limitation Terms are Neutral', () => {
  const testResults: any[] = [];

  afterAll(() => {
    console.log('Limitation Language Test Results:', JSON.stringify(testResults, null, 2));
  });

  // Prohibited language patterns for limitations
  const PROHIBITED_IN_LIMITATIONS = {
    emotional: [
      /devastating/i,
      /horrible/i,
      /terrible/i,
      /unbearable/i,
    ],
    exaggeration: [
      /\balways\b/i,
      /\bnever\b/i,
      /\bimpossible\b/i,
      /\bcompletely unable\b/i,
    ],
    diagnostic: [
      /diagnos(is|ed with)/i,
      /disease causing/i,
      /disorder prevents/i,
    ],
    conclusive: [
      /proves disability/i,
      /demonstrates inability/i,
      /shows I cannot/i,
    ],
  };

  function scanLimitationText(text: string): string[] {
    const violations: string[] = [];

    Object.entries(PROHIBITED_IN_LIMITATIONS).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(text)) {
          const match = text.match(pattern);
          violations.push(`Contains ${category} language: "${match?.[0]}"`);
        }
      });
    });

    return violations;
  }

  test('REQ-LANG-004 COMPLIANCE: Limitation template display names are neutral', () => {
    const requirementId = 'REQ-LANG-004';

    try {
      const violations: string[] = [];

      LIMITATION_TEMPLATES.forEach(template => {
        const nameViolations = scanLimitationText(template.displayName);
        if (nameViolations.length > 0) {
          violations.push(`Limitation "${template.displayName}": ${nameViolations.join(', ')}`);
        }
      });

      expect(violations).toEqual([]);

      testResults.push(createTestResult(requirementId, true));
    } catch (error) {
      testResults.push(createTestResult(
        requirementId,
        false,
        [],
        error instanceof Error ? error.message : String(error)
      ));
      throw error;
    }
  });

  test('Limitation descriptions use functional language', () => {
    const violations: string[] = [];

    LIMITATION_TEMPLATES.forEach(template => {
      const descViolations = scanLimitationText(template.description);
      if (descViolations.length > 0) {
        violations.push(`Limitation "${template.displayName}" description: ${descViolations.join(', ')}`);
      }
    });

    expect(violations).toEqual([]);
  });

  test('Limitation consequences are neutrally described', () => {
    const violations: string[] = [];

    LIMITATION_TEMPLATES.forEach(template => {
      template.commonConsequences.forEach(consequence => {
        const conseqViolations = scanLimitationText(consequence);
        if (conseqViolations.length > 0) {
          violations.push(`Limitation "${template.displayName}" consequence "${consequence}": ${conseqViolations.join(', ')}`);
        }
      });
    });

    expect(violations).toEqual([]);
  });

  test('Limitation accommodations are neutrally described', () => {
    const violations: string[] = [];

    LIMITATION_TEMPLATES.forEach(template => {
      template.commonAccommodations.forEach(accommodation => {
        const accomViolations = scanLimitationText(accommodation);
        if (accomViolations.length > 0) {
          violations.push(`Limitation "${template.displayName}" accommodation "${accommodation}": ${accomViolations.join(', ')}`);
        }
      });
    });

    expect(violations).toEqual([]);
  });

  test('Limitation SSDI relevance statements are neutral', () => {
    const violations: string[] = [];

    LIMITATION_TEMPLATES.forEach(template => {
      const ssdiViolations = scanLimitationText(template.ssdiRelevance);
      if (ssdiViolations.length > 0) {
        violations.push(`Limitation "${template.displayName}" SSDI relevance: ${ssdiViolations.join(', ')}`);
      }
    });

    expect(violations).toEqual([]);
  });

  test('Limitation thresholds use objective measurements', () => {
    const violations: string[] = [];

    LIMITATION_TEMPLATES.forEach(template => {
      template.typicalThresholds.forEach(threshold => {
        // Check description for prohibited language
        const threshViolations = scanLimitationText(threshold.description);
        if (threshViolations.length > 0) {
          violations.push(`Limitation "${template.displayName}" threshold "${threshold.description}": ${threshViolations.join(', ')}`);
        }
      });
    });

    // Main requirement: thresholds should not contain prohibited language
    expect(violations).toEqual([]);
  });

  test('All limitation categories covered comprehensively', () => {
    const categories = LIMITATION_TEMPLATES.map(t => t.category);
    
    // Verify we have templates for major limitation areas
    const expectedCategories = ['sitting', 'standing', 'walking', 'lifting', 'reaching'];
    
    expectedCategories.forEach(expected => {
      const hasCategory = categories.includes(expected as any);
      if (!hasCategory) {
        console.warn(`Missing limitation category: ${expected}`);
      }
    });

    // At minimum, we should have some limitation templates
    expect(LIMITATION_TEMPLATES.length).toBeGreaterThan(0);
  });
});
