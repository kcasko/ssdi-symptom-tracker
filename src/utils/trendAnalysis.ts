/**
 * Trend Analysis Utilities
 * Helper functions for processing symptom data into chart-ready formats
 */

import { DailyLog } from '../domain/models/DailyLog';
import { getSymptomById } from '../data/symptoms';
import { formatDate, DISPLAY_DATE_SHORT } from './dates';

export interface TrendDataPoint {
  date: string;
  timestamp: number;
  averageSeverity: number;
  symptomCount: number;
  symptoms: Array<{ symptomId: string; severity: number }>;
}

export interface SymptomFrequency {
  symptomId: string;
  name: string;
  frequency: number;
  averageSeverity: number;
  daysLogged: number;
}

export interface TrendInsights {
  averageSeverity: number;
  averageSymptomCount: number;
  daysWithSymptoms: number;
  totalDays: number;
  symptomsPercentage: number;
  trendDirection: 'improving' | 'worsening' | 'stable';
  mostCommonSymptom: string | null;
  worstDay: { date: string; severity: number } | null;
  bestDay: { date: string; severity: number } | null;
}

/**
 * Processes daily logs into trend data points
 */
export function processTrendData(
  dailyLogs: DailyLog[],
  startDate: Date,
  endDate: Date
): TrendDataPoint[] {
  const filteredLogs = dailyLogs.filter(log => {
    const logDate = new Date(log.logDate);
    return logDate >= startDate && logDate <= endDate;
  });

  return filteredLogs
    .map(log => {
      const logDate = new Date(log.logDate);
      return {
        date: formatDate(logDate, DISPLAY_DATE_SHORT),
        timestamp: logDate.getTime(),
        averageSeverity: log.symptoms.length > 0 
          ? log.symptoms.reduce((sum, s) => sum + s.severity, 0) / log.symptoms.length 
          : 0,
        symptomCount: log.symptoms.length,
        symptoms: log.symptoms.map(s => ({
          symptomId: s.symptomId,
          severity: s.severity
        })),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Calculates symptom frequency and severity statistics
 */
export function calculateSymptomFrequencies(trendData: TrendDataPoint[]): SymptomFrequency[] {
  const symptomStats: Record<string, {
    count: number;
    totalSeverity: number;
    daysLogged: Set<string>;
  }> = {};

  trendData.forEach(dataPoint => {
    dataPoint.symptoms.forEach(symptom => {
      if (!symptomStats[symptom.symptomId]) {
        symptomStats[symptom.symptomId] = {
          count: 0,
          totalSeverity: 0,
          daysLogged: new Set(),
        };
      }

      symptomStats[symptom.symptomId].count++;
      symptomStats[symptom.symptomId].totalSeverity += symptom.severity;
      symptomStats[symptom.symptomId].daysLogged.add(dataPoint.date);
    });
  });

  return Object.entries(symptomStats)
    .map(([symptomId, stats]) => {
      const symptomDefinition = getSymptomById(symptomId);
      return {
        symptomId,
        name: symptomDefinition?.name || 'Unknown Symptom',
        frequency: stats.count,
        averageSeverity: stats.count > 0 ? stats.totalSeverity / stats.count : 0,
        daysLogged: stats.daysLogged.size,
      };
    })
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Generates insights and analysis from trend data
 */
export function generateTrendInsights(trendData: TrendDataPoint[]): TrendInsights {
  if (trendData.length === 0) {
    return {
      averageSeverity: 0,
      averageSymptomCount: 0,
      daysWithSymptoms: 0,
      totalDays: 0,
      symptomsPercentage: 0,
      trendDirection: 'stable',
      mostCommonSymptom: null,
      worstDay: null,
      bestDay: null,
    };
  }

  const totalDays = trendData.length;
  const daysWithSymptoms = trendData.filter(d => d.symptomCount > 0).length;
  const averageSeverity = trendData.reduce((sum, d) => sum + d.averageSeverity, 0) / totalDays;
  const averageSymptomCount = trendData.reduce((sum, d) => sum + d.symptomCount, 0) / totalDays;
  const symptomsPercentage = (daysWithSymptoms / totalDays) * 100;

  // Find worst and best days
  const daysWithData = trendData.filter(d => d.symptomCount > 0);
  const worstDay = daysWithData.length > 0 
    ? daysWithData.reduce((worst, current) => 
        current.averageSeverity > worst.averageSeverity ? current : worst
      )
    : null;
  
  const bestDay = daysWithData.length > 0
    ? daysWithData.reduce((best, current) => 
        current.averageSeverity < best.averageSeverity ? current : best
      )
    : null;

  // Calculate trend direction (compare first and last quarters)
  const quarterSize = Math.max(1, Math.floor(trendData.length / 4));
  const firstQuarter = trendData.slice(0, quarterSize);
  const lastQuarter = trendData.slice(-quarterSize);
  
  const firstQuarterAvg = firstQuarter.reduce((sum, d) => sum + d.averageSeverity, 0) / firstQuarter.length;
  const lastQuarterAvg = lastQuarter.reduce((sum, d) => sum + d.averageSeverity, 0) / lastQuarter.length;
  
  let trendDirection: 'improving' | 'worsening' | 'stable' = 'stable';
  const threshold = 0.5; // Minimum change to consider a trend
  
  if (lastQuarterAvg - firstQuarterAvg > threshold) {
    trendDirection = 'worsening';
  } else if (firstQuarterAvg - lastQuarterAvg > threshold) {
    trendDirection = 'improving';
  }

  // Find most common symptom
  const symptomFrequencies = calculateSymptomFrequencies(trendData);
  const mostCommonSymptom = symptomFrequencies.length > 0 
    ? symptomFrequencies[0].name 
    : null;

  return {
    averageSeverity,
    averageSymptomCount,
    daysWithSymptoms,
    totalDays,
    symptomsPercentage,
    trendDirection,
    mostCommonSymptom,
    worstDay: worstDay ? {
      date: worstDay.date,
      severity: worstDay.averageSeverity
    } : null,
    bestDay: bestDay ? {
      date: bestDay.date,
      severity: bestDay.averageSeverity
    } : null,
  };
}

/**
 * Generates chart data for different visualization types
 */
export interface ChartDataSet {
  data: number[];
  color?: (opacity: number) => string;
  strokeWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataSet[];
}

export function generateChartData(
  trendData: TrendDataPoint[],
  type: 'symptoms' | 'severity' | 'patterns',
  maxDataPoints: number = 14
): ChartData {
  if (trendData.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{ data: [0] }],
    };
  }

  // Limit data points for readability
  const limitedData = trendData.slice(-maxDataPoints);

  // Calculate label interval to avoid overcrowding (show ~7 labels max)
  const labelInterval = Math.max(1, Math.ceil(limitedData.length / 7));

  // Helper to create sparse labels (show every Nth label, empty string for others)
  const createSparseLabels = (data: TrendDataPoint[]) =>
    data.map((d, i) => (i % labelInterval === 0 ? d.date : ''));

  switch (type) {
    case 'symptoms':
      return {
        labels: createSparseLabels(limitedData),
        datasets: [{
          data: limitedData.map(d => d.symptomCount),
          color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
          strokeWidth: 2,
        }],
      };

    case 'severity':
      return {
        labels: createSparseLabels(limitedData),
        datasets: [{
          data: limitedData.map(d => d.averageSeverity),
          color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
          strokeWidth: 2,
        }],
      };
    
    case 'patterns': {
      const symptomFreqs = calculateSymptomFrequencies(trendData);
      const topSymptoms = symptomFreqs.slice(0, 5); // Show top 5 symptoms

      return {
        labels: topSymptoms.map(sf => {
          // Shorten label: first word only, max 6 chars
          const words = sf.name.split(' ');
          const label = words[0];
          return label.length > 6 ? label.substring(0, 6) : label;
        }),
        datasets: [{
          data: topSymptoms.map(sf => sf.frequency),
        }],
      };
    }
    
    default:
      return { labels: [], datasets: [{ data: [] }] };
  }
}