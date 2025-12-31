/**
 * Trends Screen
 * Visual analytics and trend analysis for symptom tracking data
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useAppState } from '../state/useAppState';
import { DateRangePicker } from '../components/DateRangePicker';
import { colors as COLORS } from '../theme/colors';
import { spacing as SPACING } from '../theme/spacing';
import { typography as TYPOGRAPHY } from '../theme/typography';
import {
  processTrendData,
  generateTrendInsights,
  generateChartData,
  type TrendDataPoint,
  type TrendInsights,
} from '../utils/trendAnalysis';
import { DayQualityAnalyzer } from '../services/DayQualityAnalyzer';

const screenWidth = Dimensions.get('window').width;

type TrendType = 'symptoms' | 'severity' | 'patterns' | 'day-quality';

export function TrendsScreen() {
  const { dailyLogs } = useAppState();
  const [selectedTrend, setSelectedTrend] = useState<TrendType>('day-quality');
  
  // Use useMemo to initialize date range to avoid calling Date.now() during render
  const initialDateRange = useMemo(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  }), []);
  
  const [dateRange, setDateRange] = useState(initialDateRange);

  // Initialize day quality analyzer
  const dayAnalyzer = useMemo(() => new DayQualityAnalyzer(), []);

  // Process daily logs into trend data
  const trendData: TrendDataPoint[] = useMemo(() => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    return processTrendData(dailyLogs, start, end);
  }, [dailyLogs, dateRange]);

  // Calculate day quality ratios
  const dayRatios = useMemo(() => {
    const filteredLogs = dailyLogs.filter(log => {
      const logDate = new Date(log.logDate);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return logDate >= start && logDate <= end;
    });
    return dayAnalyzer.calculateDayRatios(filteredLogs);
  }, [dailyLogs, dateRange, dayAnalyzer]);

  // Generate insights
  const insights: TrendInsights = useMemo(() => {
    return generateTrendInsights(trendData);
  }, [trendData]);

  // Generate chart data
  const chartData = useMemo(() => {
    if (selectedTrend === 'day-quality') {
      return {
        labels: ['Good', 'Neutral', 'Bad', 'Very Bad'],
        datasets: [{
          data: [
            dayRatios.goodDays,
            dayRatios.neutralDays,
            dayRatios.badDays,
            dayRatios.veryBadDays,
          ],
        }],
      };
    }
    return generateChartData(trendData, selectedTrend);
  }, [trendData, selectedTrend, dayRatios]);

  const chartConfig = {
    backgroundGradientFrom: COLORS.gray50,
    backgroundGradientTo: COLORS.gray50,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
    style: {
      borderRadius: 16,
    },
  };

  function renderDayRatioInsights() {
    return (
      <View style={styles.dayRatioContainer}>
        <Text style={styles.sectionTitle}>Day Quality Analysis</Text>
        
        <View style={styles.ratioStatsGrid}>
          <View style={styles.ratioStatCard}>
            <Text style={[styles.ratioValue, { color: COLORS.successMain }]}> 
              {dayRatios.goodDayPercentage.toFixed(0)}%
            </Text>
            <Text style={styles.ratioLabel}>Good Days</Text>
            <Text style={styles.ratioCount}>({dayRatios.goodDays} days)</Text>
          </View>
          
          <View style={styles.ratioStatCard}>
            <Text style={[styles.ratioValue, { color: COLORS.errorMain }]}> 
              {dayRatios.badDayPercentage.toFixed(0)}%
            </Text>
            <Text style={styles.ratioLabel}>Bad Days</Text>
            <Text style={styles.ratioCount}>({dayRatios.badDays + dayRatios.veryBadDays} days)</Text>
          </View>
        </View>

        <View style={styles.functionalCapacityCard}>
          <Text style={styles.functionalCapacityTitle}>Functional Capacity</Text>
          <View style={styles.functionalCapacityBar}>
            <View 
              style={[
                styles.functionalCapacityFill, 
                { 
                  width: `${dayRatios.functionalDaysPercentage}%`,
                  backgroundColor: dayRatios.functionalDaysPercentage >= 60 
                    ? COLORS.successMain 
                    : dayRatios.functionalDaysPercentage >= 30 
                      ? COLORS.warningMain 
                      : COLORS.errorMain
                }
              ]} 
            />
          </View>
          <Text style={styles.functionalCapacityText}>
            {dayRatios.functionalDaysPercentage.toFixed(0)}% of days with adequate function
          </Text>
        </View>

        {dayRatios.worstStreak > 0 && (
          <View style={styles.streakCard}>
            <Text style={styles.streakTitle}>Symptom Patterns</Text>
            <Text style={styles.streakText}>
              Longest difficult period: <Text style={styles.streakValue}>{dayRatios.worstStreak} consecutive days</Text>
            </Text>
            {dayRatios.bestStreak > 0 && (
              <Text style={styles.streakText}>
                Longest good period: <Text style={styles.streakValue}>{dayRatios.bestStreak} consecutive days</Text>
              </Text>
            )}
          </View>
        )}

        <View style={styles.ssdiInsightsCard}>
          <Text style={styles.ssdiInsightsTitle}>SSDI Documentation Notes</Text>
          {dayRatios.badDayPercentage >= 25 && (
            <Text style={styles.ssdiInsightText}>
              • Over {dayRatios.badDayPercentage.toFixed(0)}% of days significantly impaired by symptoms
            </Text>
          )}
          {dayRatios.functionalDaysPercentage < 75 && (
            <Text style={styles.ssdiInsightText}>
              • Functional capacity limited on {(100 - dayRatios.functionalDaysPercentage).toFixed(0)}% of days
            </Text>
          )}
          {dayRatios.worstStreak >= 7 && (
            <Text style={styles.ssdiInsightText}>
              • Experienced prolonged periods of impairment ({dayRatios.worstStreak} consecutive days)
            </Text>
          )}
          {dayRatios.averageSeverity >= 5 && (
            <Text style={styles.ssdiInsightText}>
              • Average symptom severity of {dayRatios.averageSeverity.toFixed(1)}/10 indicates substantial limitation
            </Text>
          )}
        </View>
      </View>
    );
  }

  const renderChart = () => {
    if (chartData.labels[0] === 'No Data') {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available for selected date range</Text>
          <Text style={styles.noDataSubtext}>Start logging symptoms to see trends</Text>
        </View>
      );
    }

    return selectedTrend === 'patterns' || selectedTrend === 'day-quality' ? (
      <BarChart
        data={chartData}
        width={screenWidth - SPACING.xl}
        height={220}
        chartConfig={chartConfig}
        verticalLabelRotation={30}
        yAxisLabel=""
        yAxisSuffix=""
        style={styles.chart}
      />
    ) : (
      <LineChart
        data={chartData}
        width={screenWidth - SPACING.xl}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    );
  };

  const renderInsights = () => {
    if (trendData.length === 0) return null;

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.insightGrid}>
          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>{insights.averageSeverity.toFixed(1)}</Text>
            <Text style={styles.insightLabel}>Avg Severity</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>{insights.averageSymptomCount.toFixed(1)}</Text>
            <Text style={styles.insightLabel}>Avg Symptoms/Day</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightValue}>{insights.symptomsPercentage.toFixed(0)}%</Text>
            <Text style={styles.insightLabel}>Days w/ Symptoms</Text>
          </View>
        </View>
        
        {/* Additional insights */}
        <View style={styles.additionalInsights}>
          <Text style={styles.insightText}>
            <Text style={styles.insightLabel}>Trend: </Text>
            <Text style={[
              styles.trendText,
              insights.trendDirection === 'improving' && styles.improvingText,
              insights.trendDirection === 'worsening' && styles.worseningText
            ]}>
              {insights.trendDirection.charAt(0).toUpperCase() + insights.trendDirection.slice(1)}
            </Text>
          </Text>
          
          {insights.mostCommonSymptom && (
            <Text style={styles.insightText}>
              <Text style={styles.insightLabel}>Most Common: </Text>
              {insights.mostCommonSymptom}
            </Text>
          )}

          {insights.worstDay && (
            <Text style={styles.insightText}>
              <Text style={styles.insightLabel}>Worst Day: </Text>
              {insights.worstDay.date} (severity: {insights.worstDay.severity.toFixed(1)})
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Symptom Trends</Text>
        <Text style={styles.subtitle}>Visual analysis of your symptom patterns</Text>
      </View>

      <View style={styles.dateRangeContainer}>
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={(start, end) => {
            setDateRange({
              startDate: start,
              endDate: end,
            });
          }}
        />
      </View>

      <View style={styles.trendSelector}>
        <TouchableOpacity
          style={[styles.trendButton, selectedTrend === 'day-quality' && styles.trendButtonActive]}
          onPress={() => setSelectedTrend('day-quality')}
        >
          <Text style={[styles.trendButtonText, selectedTrend === 'day-quality' && styles.trendButtonTextActive]}>
            Day Quality
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.trendButton, selectedTrend === 'symptoms' && styles.trendButtonActive]}
          onPress={() => setSelectedTrend('symptoms')}
        >
          <Text style={[styles.trendButtonText, selectedTrend === 'symptoms' && styles.trendButtonTextActive]}>
            Symptom Count
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.trendButton, selectedTrend === 'severity' && styles.trendButtonActive]}
          onPress={() => setSelectedTrend('severity')}
        >
          <Text style={[styles.trendButtonText, selectedTrend === 'severity' && styles.trendButtonTextActive]}>
            Avg Severity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.trendButton, selectedTrend === 'patterns' && styles.trendButtonActive]}
          onPress={() => setSelectedTrend('patterns')}
        >
          <Text style={[styles.trendButtonText, selectedTrend === 'patterns' && styles.trendButtonTextActive]}>
            Top Symptoms
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>
          {selectedTrend === 'day-quality' && 'Good vs Bad Day Distribution'}
          {selectedTrend === 'symptoms' && 'Daily Symptom Count'}
          {selectedTrend === 'severity' && 'Average Severity Over Time'}
          {selectedTrend === 'patterns' && 'Most Common Symptoms'}
        </Text>
        {renderChart()}
      </View>

      {renderInsights()}
      
      {selectedTrend === 'day-quality' && renderDayRatioInsights()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.displayMedium,
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray700,
  },
  dateRangeContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  trendSelector: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  trendButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  trendButtonActive: {
    backgroundColor: COLORS.primaryMain,
  },
  trendButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray700,
  },
  trendButtonTextActive: {
    color: COLORS.white,
  },
  chartContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.gray900,
    marginBottom: SPACING.md,
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginVertical: SPACING.sm,
  },
  noDataText: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  noDataSubtext: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray600,
    opacity: 0.7,
  },
  insightsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  insightGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  insightValue: {
    ...TYPOGRAPHY.displaySmall,
    color: COLORS.primaryMain,
    marginBottom: SPACING.xs,
  },
  insightLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray700,
    textAlign: 'center',
  },
  additionalInsights: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  insightText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  trendText: {
    fontWeight: 'bold',
  },
  improvingText: {
    color: COLORS.successMain,
  },
  worseningText: {
    color: COLORS.errorMain,
  },
  dayRatioContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  ratioStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  ratioStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  ratioValue: {
    ...TYPOGRAPHY.displayLarge,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  ratioLabel: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  ratioCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
  },
  functionalCapacityCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  functionalCapacityTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.gray900,
    marginBottom: SPACING.md,
  },
  functionalCapacityBar: {
    height: 24,
    backgroundColor: COLORS.gray200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  functionalCapacityFill: {
    height: '100%',
    borderRadius: 12,
  },
  functionalCapacityText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray700,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: COLORS.gray100,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  streakTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.gray900,
    marginBottom: SPACING.sm,
  },
  streakText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  streakValue: {
    fontWeight: 'bold',
    color: COLORS.primary600,
  },
  ssdiInsightsCard: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary600,
  },
  ssdiInsightsTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.primary600,
    marginBottom: SPACING.md,
    fontWeight: 'bold',
  },
  ssdiInsightText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
});
