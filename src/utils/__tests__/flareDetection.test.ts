import { detectFlares, DailyPainEntry } from '../flareDetection';

// Fake datasets for deterministic, auditable tests
const noFlare: DailyPainEntry[] = [
  { date: '2026-01-01', painScore: 2 },
  { date: '2026-01-02', painScore: 3 },
  { date: '2026-01-03', painScore: 2 }
];

const singleFlare: DailyPainEntry[] = [
  { date: '2026-01-01', painScore: 6 },
  { date: '2026-01-02', painScore: 7 },
  { date: '2026-01-03', painScore: 8 }
];

const brokenStreak: DailyPainEntry[] = [
  { date: '2026-01-01', painScore: 6 },
  { date: '2026-01-02', painScore: 7 },
  { date: '2026-01-03', painScore: 2 }, // breaks streak
  { date: '2026-01-04', painScore: 8 },
  { date: '2026-01-05', painScore: 8 },
  { date: '2026-01-06', painScore: 8 }
];

const backToBackFlares: DailyPainEntry[] = [
  { date: '2026-01-01', painScore: 6 },
  { date: '2026-01-02', painScore: 7 },
  { date: '2026-01-03', painScore: 8 },
  { date: '2026-01-04', painScore: 6 },
  { date: '2026-01-05', painScore: 7 },
  { date: '2026-01-06', painScore: 8 }
];

const multipleEntriesPerDay: DailyPainEntry[] = [
  { date: '2026-01-01', painScore: 5 },
  { date: '2026-01-01', painScore: 9 }, // highest wins
  { date: '2026-01-02', painScore: 7 },
  { date: '2026-01-03', painScore: 8 }
];

const missingDays: DailyPainEntry[] = [
  { date: '2026-01-01', painScore: 6 },
  { date: '2026-01-03', painScore: 7 }, // missing 2026-01-02
  { date: '2026-01-04', painScore: 8 }
];

describe('detectFlares', () => {
  it('returns no flares for stable low pain', () => {
    expect(detectFlares(noFlare)).toEqual([]);
    // Protects: false positives, ensures stable input yields no flares
  });

  it('detects a single flare', () => {
    const flares = detectFlares(singleFlare);
    expect(flares.length).toBe(1);
    expect(flares[0].startDate).toBe('2026-01-01');
    expect(flares[0].endDate).toBe('2026-01-03');
    // Protects: correct detection of a single flare
  });

  it('detects broken streaks as separate flares', () => {
    const flares = detectFlares(brokenStreak);
    expect(flares.length).toBe(1);
    expect(flares[0].startDate).toBe('2026-01-04');
    expect(flares[0].endDate).toBe('2026-01-06');
    // Protects: streaks broken by low pain are not merged
  });

    it('should merge back-to-back flares into a single event', () => {
      const entries: DailyPainEntry[] = [
        { date: '2026-01-01', painScore: 6 },
        { date: '2026-01-02', painScore: 7 },
        { date: '2026-01-03', painScore: 8 },
        { date: '2026-01-04', painScore: 6 },
        { date: '2026-01-05', painScore: 7 },
        { date: '2026-01-06', painScore: 8 }
      ];
      const flares = detectFlares(entries);
      expect(flares.length).toBe(1);
      expect(flares[0].startDate).toBe('2026-01-01');
      expect(flares[0].endDate).toBe('2026-01-06');
      // Protects: consecutive flares are merged
    });

  it('uses highest pain score for multiple entries per day', () => {
    const flares = detectFlares(multipleEntriesPerDay);
    expect(flares.length).toBe(1);
    expect(flares[0].peakPain).toBe(9);
    // Protects: daily aggregation uses max value
  });

  it('missing days break streaks', () => {
    const flares = detectFlares(missingDays);
    expect(flares.length).toBe(0);
    // Protects: missing days break flare streaks
  });

  it('is deterministic for same input', () => {
    const result1 = detectFlares(singleFlare);
    const result2 = detectFlares(singleFlare);
    expect(result1).toEqual(result2);
    // Protects: output is stable and deterministic
  });
});
