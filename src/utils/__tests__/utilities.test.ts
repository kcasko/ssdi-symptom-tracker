/**
 * Tests for utility functions
 */

import {
  calculateDaysBetween,
  formatDate,
  getDateRangeArray,
  isWithinRange
} from '../dates';

import {
  detectFlare,
  analyzeFlarePattern
} from '../flareDetection';

import {
  analyzeTrend,
  calculateMovingAverage
} from '../trendAnalysis';

describe('Date Utilities', () => {
  describe('calculateDaysBetween', () => {
    it('should calculate days between two dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-10');
      
      const days = calculateDaysBetween(start, end);
      expect(days).toBe(9);
    });

    it('should handle same date', () => {
      const date = new Date('2024-01-01');
      const days = calculateDaysBetween(date, date);
      expect(days).toBe(0);
    });

    it('should handle reverse order', () => {
      const start = new Date('2024-01-10');
      const end = new Date('2024-01-01');
      
      const days = calculateDaysBetween(start, end);
      expect(Math.abs(days)).toBe(9);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('getDateRangeArray', () => {
    it('should generate array of dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-05');
      
      const range = getDateRangeArray(start, end);
      
      expect(range.length).toBe(5);
      expect(range[0]).toEqual(start);
    });
  });

  describe('isWithinRange', () => {
    it('should check if date is within range', () => {
      const date = new Date('2024-01-15');
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      const result = isWithinRange(date, start, end);
      expect(result).toBe(true);
    });

    it('should return false for date outside range', () => {
      const date = new Date('2024-02-15');
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      const result = isWithinRange(date, start, end);
      expect(result).toBe(false);
    });
  });
});

describe('Flare Detection', () => {
  describe('detectFlare', () => {
    it('should detect flare when pain increases significantly', () => {
      const recentPain = 8;
      const baselinePain = 4;
      
      const isFlare = detectFlare(recentPain, baselinePain);
      expect(isFlare).toBe(true);
    });

    it('should not detect flare for minor increases', () => {
      const recentPain = 5;
      const baselinePain = 4;
      
      const isFlare = detectFlare(recentPain, baselinePain);
      expect(isFlare).toBe(false);
    });

    it('should not detect flare when pain is stable', () => {
      const recentPain = 5;
      const baselinePain = 5;
      
      const isFlare = detectFlare(recentPain, baselinePain);
      expect(isFlare).toBe(false);
    });
  });

  describe('analyzeFlarePattern', () => {
    it('should identify flare patterns from pain data', () => {
      const painLevels = [4, 4, 5, 8, 9, 8, 5, 4, 4];
      
      const pattern = analyzeFlarePattern(painLevels);
      
      expect(pattern).toBeDefined();
      expect(pattern.hasFlare).toBe(true);
    });

    it('should detect no flare in stable data', () => {
      const painLevels = [5, 5, 5, 5, 5, 5, 5];
      
      const pattern = analyzeFlarePattern(painLevels);
      
      expect(pattern.hasFlare).toBe(false);
    });
  });
});

describe('Trend Analysis', () => {
  describe('analyzeTrend', () => {
    it('should detect improving trend', () => {
      const values = [8, 7, 6, 5, 4, 3, 2];
      
      const trend = analyzeTrend(values);
      
      expect(trend).toBe('improving');
    });

    it('should detect worsening trend', () => {
      const values = [2, 3, 4, 5, 6, 7, 8];
      
      const trend = analyzeTrend(values);
      
      expect(trend).toBe('worsening');
    });

    it('should detect stable trend', () => {
      const values = [5, 5, 5, 5, 5, 5, 5];
      
      const trend = analyzeTrend(values);
      
      expect(trend).toBe('stable');
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate moving average', () => {
      const values = [1, 2, 3, 4, 5];
      const windowSize = 3;
      
      const average = calculateMovingAverage(values, windowSize);
      
      expect(Array.isArray(average)).toBe(true);
      expect(average.length).toBe(values.length - windowSize + 1);
    });

    it('should handle window size equal to array length', () => {
      const values = [1, 2, 3, 4, 5];
      const windowSize = 5;
      
      const average = calculateMovingAverage(values, windowSize);
      
      expect(average.length).toBe(1);
      expect(average[0]).toBe(3); // Average of [1,2,3,4,5]
    });
  });
});
