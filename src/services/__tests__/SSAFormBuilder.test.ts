/**
 * Tests for SSA Form Builder
 */

import { SSAFormBuilder } from '../SSAFormBuilder';
import { RFC } from '../../domain/models/RFC';
import { WorkImpact } from '../../domain/models/WorkHistory';
import { DailyLog } from '../../domain/models/DailyLog';
import { Limitation } from '../../domain/models/Limitation';
import { ActivityLog } from '../../domain/models/ActivityLog';
import { Appointment } from '../../domain/models/Appointment';
import { Medication } from '../../domain/models/Medication';

describe('SSAFormBuilder', () => {
  const mockRFC: RFC = {
    id: 'rfc1',
    profileId: 'profile1',
    assessmentDate: new Date('2024-01-15'),
    workCapacityLevel: 'sedentary',
    canWorkFullTime: false,
    exertionalCapacity: {
      sitting: {
        hoursWithoutBreak: 1,
        totalHoursPerDay: 4,
        supportingEvidence: ['log1', 'log2']
      },
      standing: {
        hoursWithoutBreak: 0.5,
        totalHoursPerDay: 2,
        supportingEvidence: ['log1', 'log2']
      },
      walking: {
        hoursWithoutBreak: 0.25,
        totalHoursPerDay: 1,
        supportingEvidence: ['log1', 'log2']
      },
      maxLiftingCapacity: {
        occasionalWeight: 5,
        frequentWeight: 2,
        supportingEvidence: ['log1', 'log2']
      },
      pushPull: {
        limited: true,
        description: 'Severely limited',
        supportingEvidence: ['log1']
      }
    },
    posturalLimitations: {
      stooping: { frequency: 'never', reason: 'Back pain', supportingEvidence: ['log1'] },
      kneeling: { frequency: 'never', reason: 'Back pain', supportingEvidence: ['log1'] },
      crouching: { frequency: 'rarely', reason: 'Back pain', supportingEvidence: ['log1'] },
      crawling: { frequency: 'never', reason: 'Back pain', supportingEvidence: ['log1'] },
      climbing: { frequency: 'never', reason: 'Back pain', supportingEvidence: ['log1'] },
      balancing: { frequency: 'occasionally', reason: 'Dizziness', supportingEvidence: ['log1'] }
    },
    manipulativeLimitations: {
      reaching: { limited: false, description: '', supportingEvidence: [] },
      handling: { limited: false, description: '', supportingEvidence: [] },
      fingering: { limited: false, description: '', supportingEvidence: [] },
      feeling: { limited: false, description: '', supportingEvidence: [] }
    },
    environmentalLimitations: {
      heights: { mustAvoid: true, severity: 'severe', description: 'Fall risk', supportingEvidence: ['log1'] },
      movingMachinery: { mustAvoid: true, severity: 'moderate', description: 'Safety risk', supportingEvidence: [] },
      temperature: { mustAvoid: false, severity: 'none', description: '', supportingEvidence: [] },
      chemicals: { mustAvoid: false, severity: 'none', description: '', supportingEvidence: [] },
      dust: { mustAvoid: false, severity: 'none', description: '', supportingEvidence: [] },
      noise: { mustAvoid: false, severity: 'none', description: '', supportingEvidence: [] },
      vibration: { mustAvoid: false, severity: 'none', description: '', supportingEvidence: [] }
    },
    mentalLimitations: {
      concentration: { limited: true, description: 'Cannot focus >30 min', supportingEvidence: ['log1'] },
      memory: { limited: true, description: 'Short-term memory issues', supportingEvidence: ['log1'] },
      socialInteraction: { limited: false, description: '', supportingEvidence: [] },
      pace: { limited: true, description: 'Cannot maintain production pace', supportingEvidence: ['log1'] },
      adaptation: { limited: false, description: '', supportingEvidence: [] }
    },
    requiredAccommodations: ['Frequent breaks', 'Sitting workspace'],
    evidenceSummary: {
      totalLogs: 30,
      dateRangeStart: new Date('2024-01-01'),
      dateRangeEnd: new Date('2024-01-30'),
      consistentPatterns: true,
      worseningTrends: false
    }
  };

  const mockWorkImpact: WorkImpact = {
    workHistory: {
      id: 'job1',
      profileId: 'profile1',
      jobTitle: 'Warehouse Worker',
      employer: 'ABC Warehouse',
      startDate: new Date('2020-01-01'),
      endDate: new Date('2023-12-31'),
      hoursPerWeek: 40,
      duties: [],
      physicalDemands: {
        exertionLevel: 'heavy',
        liftingRequirement: { maxWeight: 50, frequentWeight: 25 },
        standingHours: 6,
        walkingHours: 5,
        sittingHours: 1
      }
    },
    canReturnToJob: false,
    dutyImpacts: [],
    overallImpactStatement: 'Cannot return to warehouse work due to lifting limitations',
    overallImpactScore: 85
  };

  const mockDailyLogs: DailyLog[] = Array(30).fill(null).map((_, i) => ({
    id: `log${i}`,
    profileId: 'profile1',
    date: new Date(`2024-01-${(i % 30) + 1}`),
    symptoms: [{ name: 'Pain', severity: 7, duration: 480 }],
    overallPainLevel: 7,
    fatigueLevel: 6,
    sleepQuality: 'poor',
    sleepHours: 5,
    notes: ''
  }));

  const mockLimitations: Limitation[] = [{
    id: 'lim1',
    profileId: 'profile1',
    category: 'mobility',
    description: 'Cannot stand >1 hour',
    severity: 'severe',
    dateStarted: new Date('2024-01-01'),
    impacts: ['work'],
    accommodationsNeeded: []
  }];

  const mockActivityLogs: ActivityLog[] = [];
  const mockAppointments: Appointment[] = [{
    id: 'appt1',
    profileId: 'profile1',
    date: new Date('2024-01-15'),
    providerName: 'Dr. Smith',
    type: 'doctor',
    purpose: 'Back pain evaluation',
    location: 'Medical Center'
  }];
  const mockMedications: Medication[] = [{
    id: 'med1',
    profileId: 'profile1',
    name: 'Ibuprofen',
    dosage: '800mg',
    frequency: 'daily',
    startDate: new Date('2024-01-01')
  }];

  describe('buildFormPackage', () => {
    it('should build complete SSA form package', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        mockAppointments,
        mockMedications
      );

      expect(formPackage).toBeDefined();
      expect(formPackage.generatedDate).toBeInstanceOf(Date);
      expect(formPackage.disabilityReport).toBeDefined();
      expect(formPackage.functionReport).toBeDefined();
      expect(formPackage.workHistoryReport).toBeDefined();
      expect(formPackage.rfcSummary).toBeDefined();
    });

    it('should include disability report with all sections', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        mockAppointments,
        mockMedications
      );

      const report = formPackage.disabilityReport;
      expect(Array.isArray(report.conditions)).toBe(true);
      expect(Array.isArray(report.workHistory)).toBe(true);
      expect(Array.isArray(report.medications)).toBe(true);
      expect(Array.isArray(report.medicalTreatment)).toBe(true);
      expect(report.education).toBeDefined();
    });

    it('should include function report with abilities', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        mockAppointments,
        mockMedications
      );

      const report = formPackage.functionReport;
      expect(Array.isArray(report.affectedAbilities)).toBe(true);
      expect(report.evidenceSummary).toBeDefined();
    });

    it('should include work history report', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        mockAppointments,
        mockMedications
      );

      const report = formPackage.workHistoryReport;
      expect(Array.isArray(report.jobs)).toBe(true);
      expect(typeof report.canDoAnyPastWork).toBe('boolean');
      expect(Array.isArray(report.reasonsCannotDoPastWork)).toBe(true);
    });

    it('should include RFC summary', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        mockAppointments,
        mockMedications
      );

      const summary = formPackage.rfcSummary;
      expect(summary.workCapacityLevel).toBe(mockRFC.workCapacityLevel);
      expect(summary.canWorkFullTime).toBe(mockRFC.canWorkFullTime);
      expect(summary.sittingCapacity).toBeDefined();
      expect(summary.standingCapacity).toBeDefined();
    });

    it('should generate narratives', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        mockAppointments,
        mockMedications
      );

      expect(formPackage.whyCannotWork).toBeDefined();
      expect(formPackage.whyCannotWork.length).toBeGreaterThan(0);
      expect(formPackage.howConditionsLimit).toBeDefined();
      expect(formPackage.howConditionsLimit.length).toBeGreaterThan(0);
    });

    it('should assess data quality', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        mockAppointments,
        mockMedications
      );

      const quality = formPackage.dataQuality;
      expect(typeof quality.sufficientLoggingHistory).toBe('boolean');
      expect(typeof quality.consistentLogging).toBe('boolean');
      expect(typeof quality.validatedRFC).toBe('boolean');
      expect(typeof quality.validatedWorkImpact).toBe('boolean');
      expect(Array.isArray(quality.missingData)).toBe(true);
      expect(Array.isArray(quality.recommendations)).toBe(true);
    });

    it('should include warnings for insufficient data', () => {
      // Test with minimal data
      const shortLogs = mockDailyLogs.slice(0, 10);
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        shortLogs,
        mockLimitations,
        mockActivityLogs,
        [],
        []
      );

      expect(Array.isArray(formPackage.warnings)).toBe(true);
    });
  });

  describe('data validation', () => {
    it('should validate RFC is required', () => {
      expect(() => {
        SSAFormBuilder.buildFormPackage(
          null as any,
          [mockWorkImpact],
          mockDailyLogs,
          mockLimitations,
          mockActivityLogs,
          mockAppointments,
          mockMedications
        );
      }).toThrow();
    });

    it('should handle empty work impacts', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        mockAppointments,
        mockMedications
      );

      expect(formPackage.workHistoryReport.jobs.length).toBe(0);
      expect(formPackage.warnings.length).toBeGreaterThan(0);
    });

    it('should handle minimal appointments', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        [],
        mockMedications
      );

      const hasWarning = formPackage.dataQuality.missingData.some(
        d => d.includes('appointment')
      );
      expect(hasWarning).toBe(true);
    });
  });

  describe('formatting', () => {
    it('should format capacity statements correctly', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        mockAppointments,
        mockMedications
      );

      const summary = formPackage.rfcSummary;
      expect(summary.sittingCapacity).toContain('hour');
      expect(summary.standingCapacity).toContain('hour');
      expect(summary.liftingCapacity).toContain('lbs');
    });

    it('should format postural limitations as readable strings', () => {
      const formPackage = SSAFormBuilder.buildFormPackage(
        mockRFC,
        [mockWorkImpact],
        mockDailyLogs,
        mockLimitations,
        mockActivityLogs,
        mockAppointments,
        mockMedications
      );

      const limitations = formPackage.rfcSummary.posturalLimitations;
      expect(Array.isArray(limitations)).toBe(true);
      limitations.forEach(lim => {
        expect(typeof lim).toBe('string');
        expect(lim.length).toBeGreaterThan(0);
      });
    });
  });
});
