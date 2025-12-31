/**
 * Weather and Environmental Correlation Analysis
 * Analyzes correlations between weather conditions, stress, and symptom severity
 */

import { DailyLog } from '../domain/models/DailyLog';

export interface WeatherCorrelation {
  weather: string;
  occurrences: number;
  averageSeverity: number;
  averageSymptomCount: number;
  impact: 'worsens' | 'improves' | 'neutral';
  correlationStrength: number;
  significantSymptomPercentage: number;
}

export interface StressCorrelation {
  hasData: boolean;
  correlation: number; // -1 to 1
  averageSeverityByStress: Record<string, number>;
  stressLevels: Array<{ level: string; avgSeverity: number; count: number }>;
}

export interface EnvironmentalAnalysis {
  weather: WeatherCorrelation[];
  stress: StressCorrelation;
  totalLogsWithWeather: number;
  totalLogsWithStress: number;
}

/**
 * Analyze weather correlations with symptom severity
 */
export function analyzeWeatherCorrelations(logs: DailyLog[]): WeatherCorrelation[] {
  if (logs.length === 0) return [];

  // Filter logs that have weather data
  const logsWithWeather = logs.filter(log => log.environmentalFactors?.weather);

  if (logsWithWeather.length === 0) return [];

  // Group by weather condition
  const weatherMap = new Map<string, {
    count: number;
    totalSeverity: number;
    severities: number[];
    symptomCounts: number[];
  }>();

  logsWithWeather.forEach(log => {
    const weather = log.environmentalFactors!.weather!;
    const existing = weatherMap.get(weather) || {
      count: 0,
      totalSeverity: 0,
      severities: [],
      symptomCounts: [],
    };

    existing.count++;
    existing.totalSeverity += log.overallSeverity;
    existing.severities.push(log.overallSeverity);
    existing.symptomCounts.push(log.symptoms.length);

    weatherMap.set(weather, existing);
  });

  // Calculate correlations
  const correlations: WeatherCorrelation[] = [];
  const overallAvgSeverity = logsWithWeather.reduce((sum, log) => sum + log.overallSeverity, 0) / logsWithWeather.length;

  weatherMap.forEach((data, weather) => {
    const averageSeverity = data.totalSeverity / data.count;
    const averageSymptomCount = data.symptomCounts.reduce((a, b) => a + b, 0) / data.count;
    
    // Calculate correlation strength (difference from overall average)
    const severityDifference = averageSeverity - overallAvgSeverity;
    const correlationStrength = Math.abs(severityDifference);
    
    // Categorize impact
    let impact: 'worsens' | 'improves' | 'neutral' = 'neutral';
    if (severityDifference > 0.5) impact = 'worsens';
    else if (severityDifference < -0.5) impact = 'improves';

    // Calculate percentage of days with significant symptoms (severity >= 5)
    const significantSymptomDays = data.severities.filter(s => s >= 5).length;
    const significantPercentage = (significantSymptomDays / data.count) * 100;

    correlations.push({
      weather,
      occurrences: data.count,
      averageSeverity: Math.round(averageSeverity * 10) / 10,
      averageSymptomCount: Math.round(averageSymptomCount * 10) / 10,
      impact,
      correlationStrength: Math.round(correlationStrength * 10) / 10,
      significantSymptomPercentage: Math.round(significantPercentage),
    });
  });

  return correlations.sort((a, b) => b.correlationStrength - a.correlationStrength);
}

/**
 * Analyze stress level correlations with symptom severity
 */
export function analyzeStressCorrelations(logs: DailyLog[]): StressCorrelation {
  const logsWithStress = logs.filter(log => 
    log.environmentalFactors?.stressLevel !== undefined
  );

  if (logsWithStress.length === 0) {
    return {
      hasData: false,
      correlation: 0,
      averageSeverityByStress: {},
      stressLevels: [],
    };
  }

  // Group by stress level ranges
  const stressRanges = {
    low: { range: [0, 3], severities: [] as number[] },
    moderate: { range: [4, 6], severities: [] as number[] },
    high: { range: [7, 10], severities: [] as number[] },
  };

  logsWithStress.forEach(log => {
    const stress = log.environmentalFactors!.stressLevel!;
    if (stress <= 3) {
      stressRanges.low.severities.push(log.overallSeverity);
    } else if (stress <= 6) {
      stressRanges.moderate.severities.push(log.overallSeverity);
    } else {
      stressRanges.high.severities.push(log.overallSeverity);
    }
  });

  // Calculate averages
  const averageSeverityByStress: Record<string, number> = {};
  const stressLevels: Array<{ level: string; avgSeverity: number; count: number }> = [];

  Object.entries(stressRanges).forEach(([level, data]) => {
    if (data.severities.length > 0) {
      const avg = data.severities.reduce((a, b) => a + b, 0) / data.severities.length;
      averageSeverityByStress[level] = Math.round(avg * 10) / 10;
      stressLevels.push({
        level,
        avgSeverity: Math.round(avg * 10) / 10,
        count: data.severities.length,
      });
    }
  });

  // Calculate correlation coefficient (simplified)
  const stressValues = logsWithStress.map(log => log.environmentalFactors!.stressLevel!);
  const severityValues = logsWithStress.map(log => log.overallSeverity);
  
  const correlation = calculateCorrelation(stressValues, severityValues);

  return {
    hasData: true,
    correlation: Math.round(correlation * 100) / 100,
    averageSeverityByStress,
    stressLevels,
  };
}

/**
 * Comprehensive environmental analysis
 */
export function analyzeEnvironmentalFactors(logs: DailyLog[]): EnvironmentalAnalysis {
  const weather = analyzeWeatherCorrelations(logs);
  const stress = analyzeStressCorrelations(logs);

  return {
    weather,
    stress,
    totalLogsWithWeather: logs.filter(log => log.environmentalFactors?.weather).length,
    totalLogsWithStress: logs.filter(log => log.environmentalFactors?.stressLevel !== undefined).length,
  };
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

/**
 * Get weather condition display name
 */
export function getWeatherDisplayName(weather: string): string {
  const displayNames: Record<string, string> = {
    clear: 'Clear/Sunny',
    cloudy: 'Cloudy',
    rainy: 'Rainy',
    stormy: 'Stormy',
    hot: 'Hot',
    cold: 'Cold',
    humid: 'Humid',
  };
  return displayNames[weather] || weather;
}

/**
 * Get impact icon/emoji for weather condition
 */
export function getWeatherImpactIcon(impact: 'worsens' | 'improves' | 'neutral'): string {
  switch (impact) {
    case 'worsens':
      return '⚠️';
    case 'improves':
      return '✓';
    case 'neutral':
      return '−';
  }
}
