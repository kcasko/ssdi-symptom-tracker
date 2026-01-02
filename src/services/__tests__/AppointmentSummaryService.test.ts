import { AppointmentSummaryService } from '../../services/AppointmentSummaryService';
import { createMockAppointment } from '../../__tests__/testHelpers';
import { ActivityLog } from '../../domain/models/ActivityLog';
import { Limitation } from '../../domain/models/Limitation';
import { Medication } from '../../domain/models/Medication';
import { DailyLog } from '../../domain/models/DailyLog';

// Minimal fake data for deterministic, auditable tests
const fakeAppointment = createMockAppointment({ appointmentDate: '2026-01-10' });
const fakeDailyLogs: DailyLog[] = [
  { logDate: '2026-01-01', overallSeverity: 2 } as DailyLog,
  { logDate: '2026-01-02', overallSeverity: 8 } as DailyLog,
  { logDate: '2026-01-03', overallSeverity: 3 } as DailyLog
];
const fakeActivityLogs: ActivityLog[] = [];
const fakeLimitations: Limitation[] = [];
const fakeMedications: Medication[] = [];

describe('AppointmentSummaryService.generatePreparationSummary', () => {
  it('includes correct date range and summary fields', () => {
    const summary = AppointmentSummaryService.generatePreparationSummary(
      fakeAppointment,
      fakeDailyLogs,
      fakeActivityLogs,
      fakeLimitations,
      fakeMedications,
      3 // lookbackDays
    );
    expect(summary.dateRange.start).toBe('2026-01-06'); // 3 days before end date
    expect(summary.dateRange.end).toBe('2026-01-09'); // day before appointment
    expect(summary.appointment.appointmentDate).toBe('2026-01-10');
    // Protects: correct date range and inclusion of appointment
  });

  it('output is stable for same input', () => {
    const summary1 = AppointmentSummaryService.generatePreparationSummary(
      fakeAppointment,
      fakeDailyLogs,
      fakeActivityLogs,
      fakeLimitations,
      fakeMedications,
      3
    );
    const summary2 = AppointmentSummaryService.generatePreparationSummary(
      fakeAppointment,
      fakeDailyLogs,
      fakeActivityLogs,
      fakeLimitations,
      fakeMedications,
      3
    );
    expect(summary1).toEqual(summary2);
    // Protects: deterministic output
  });

  it('handles missing days and empty logs', () => {
    const summary = AppointmentSummaryService.generatePreparationSummary(
      fakeAppointment,
      [],
      [],
      [],
      [],
      3
    );
    expect(summary.recentSymptoms).toEqual([]);
    // Protects: no crash on empty input
  });
});
