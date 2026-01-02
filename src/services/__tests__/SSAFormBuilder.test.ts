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
    assessmentStartDate: '2024-01-01',
    assessmentEndDate: '2024-01-30',
    generatedAt: '2024-01-30T00:00:00Z',
    overallRating: 'sedentary',
    canWorkFullTime: false,
    exertionalLimitations: {
      sitting: {
        maxContinuousMinutes: 60,
        maxTotalHours: 4,
        requiresBreaks: true,
        breakFrequencyMinutes: 60,
        evidence: ['log1', 'log2']
      },
      standing: {
        maxContinuousMinutes: 30,
        maxTotalHours: 2,
        requiresBreaks: true,
        breakFrequencyMinutes: 30,
        evidence: ['log1', 'log2']
      },
      walking: {
        maxContinuousMinutes: 15,
        maxTotalHours: 1,
        requiresAssistiveDevice: false,
        evidence: ['log1', 'log2']
      },
      lifting: {
        maxWeightPoundsOccasional: 5,
        maxWeightPoundsFrequent: 2,
        maxWeightPoundsConstant: 0,
        evidence: ['log1', 'log2']
      },
      pushPull: {
        limitedBeyondLifting: true,
        maxForcePounds: 10,
        evidence: ['log1']
      }
    },
    posturalLimitations: {
      stooping: 'never',
      kneeling: 'never',
      crouching: 'occasional',
      crawling: 'never',
      climbing: {
        stairs: 'occasional',
        ladders: 'never',
        ramps: 'occasional'
      },
      balancing: 'occasional',
      evidence: { stooping: ['log1'], kneeling: ['log1'], crouching: ['log1'], crawling: ['log1'], climbing: ['log1'], balancing: ['log1'] }
    },
    manipulativeLimitations: {
      reaching: {
        overhead: 'never',
        forward: 'frequent',
        lateral: 'frequent'
      },
      handling: 'frequent',
      fingering: 'frequent',
      feeling: 'unlimited',
      evidence: { reaching: ['log1'], handling: [], fingering: [], feeling: [] }
    },
    environmentalLimitations: {
      heights: true,
      movingMechanicalParts: true,
      operatingVehicle: false,
      humidity: 'unlimited',
      wetness: 'unlimited',
      dust: 'unlimited',
      odors: 'unlimited',
      fumes: 'unlimited',
      temperature: {
        extremeCold: false,
        extremeHeat: false,
        rapidChanges: false
      },
      noise: {
        loudNoise: false,
        constantNoise: false
      },
      vibration: 'unlimited',
      evidence: { heights: ['log1'], movingMechanicalParts: [], other: [] }
    },
    mentalLimitations: {
      concentration: {
        maxContinuousMinutes: 30,
        requiresFrequentBreaks: true,
        distractedByPain: true,
        distractedBySymptoms: false,
        evidence: ['log1']
      },
      memory: {
        shortTermImpaired: true,
        longTermImpaired: false,
        forgetsMedications: false,
        forgetsAppointments: false,
        evidence: ['log1']
      },
      social: {
        limitedPublicContact: false,
        limitedCoworkerContact: false,
        limitedSupervisorContact: false,
        evidenceOfIsolation: false,
        evidence: []
      },
      pace: {
        belowNormalPace: true,
        cannotMeetQuotas: true,
        requiresFlexibleSchedule: false,
        unpredictableAbsences: false,
        evidence: ['log1']
      },
      adaptation: {
        difficultyWithChange: false,
        needsRoutine: false,
        stressIntolerant: false,
        evidence: []
      }
    },
    requiresAccommodations: ['Frequent breaks', 'Sitting workspace'],
    evidenceSummary: {
      totalDailyLogs: 30,
      totalActivityLogs: 0,
      totalLimitations: 1,
      totalPhotos: 0,
      consistentPatterns: ['Daily pain'],
      worseningTrends: [],
      medicationEffects: [],
      mostSevereSymptomDays: ['log1', 'log2'],
      activityLimitations: [],
      functionalDeclines: ['lim1'],
      dateRangeDays: 30,
      averageLogsPerWeek: 7,
      hasPhotographicEvidence: false,
      hasMedicalCorroboration: true
    }
  };

  const mockWorkImpact: WorkImpact = {
    workHistoryId: 'job1',
    jobTitle: 'Warehouse Worker',
    canReturnToThisJob: false,
    impactScore: 85,
    dutyImpacts: [],
    evidenceBase: {
      dailyLogIds: ['log1', 'log2'],
      activityLogIds: [],
      limitationIds: ['lim1'],
      photoIds: []
    },
    impactStatements: ['Cannot return to warehouse work due to lifting limitations'],
    analysisStartDate: '2024-01-01',
    analysisEndDate: '2024-01-30',
    generatedAt: '2024-01-30T00:00:00Z'
  };

  const mockDailyLogs: DailyLog[] = Array(30).fill(null).map((_, i) => ({
    id: `log${i}`,
    profileId: 'profile1',
    createdAt: `2024-01-${String((i % 30) + 1).padStart(2, '0')}T00:00:00Z`,
    updatedAt: `2024-01-${String((i % 30) + 1).padStart(2, '0')}T00:00:00Z`,
    logDate: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
    timeOfDay: 'evening' as const,
    symptoms: [{ symptomId: 's1', severity: 7, location: 'back', notes: '' }],
    overallSeverity: 7,
    sleepQuality: {
      hoursSlept: 5,
      quality: 3,
      wakeUps: 2,
      restful: false
    },
    notes: ''
  }));

  const mockLimitations: Limitation[] = [{
    id: 'lim1',
    profileId: 'profile1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    category: 'standing',
    timeThreshold: {
      durationMinutes: 60,
      confidence: 'high'
    },
    frequency: 'always',
    consequences: ['Cannot work full shift'],
    variability: 'consistent',
    notes: 'Cannot stand >1 hour',
    isActive: true
  }];

  const mockActivityLogs: ActivityLog[] = [];
  const mockAppointments: Appointment[] = [{
    id: 'appt1',
    profileId: 'profile1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    appointmentDate: '2024-01-15',
    providerName: 'Dr. Smith',
    providerType: 'primary_care' as const,
    facilityName: 'Medical Center',
    purpose: 'follow_up' as const,
    purposeDetails: 'Back pain evaluation',
    status: 'completed' as const
  }];
  const mockMedications: Medication[] = [{
    id: 'med1',
    profileId: 'profile1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    name: 'Ibuprofen',
    dosage: '800mg',
    frequency: 'as_needed' as const,
    purpose: ['Pain management'],
    startDate: '2024-01-01',
    isActive: true
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
      expect(summary.workCapacityLevel).toBe(mockRFC.overallRating);
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
