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

const screenWidth = Dimensions.get('window').width;

type TrendType = 'symptoms' | 'severity' | 'patterns';

export function TrendsScreen() {
  const { dailyLogs } = useAppState();
  const [selectedTrend, setSelectedTrend] = useState<TrendType>('symptoms');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  });

  // Process daily logs into trend data
  const trendData: TrendDataPoint[] = useMemo(() => {
    return processTrendData(dailyLogs, dateRange.startDate, dateRange.endDate);
  }, [dailyLogs, dateRange]);

  // Generate insights
  const insights: TrendInsights = useMemo(() => {
    return generateTrendInsights(trendData);
  }, [trendData]);

  // Generate chart data based on selected trend type
  const chartData = useMemo(() => {
    return generateChartData(trendData, selectedTrend);
  }, [trendData, selectedTrend]);

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

  const renderTrendSelector = () => (
    <View style={styles.trendSelector}>
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
  );

  const renderChart = () => {
    if (chartData.labels[0] === 'No Data') {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available for selected date range</Text>
          <Text style={styles.noDataSubtext}>Start logging symptoms to see trends</Text>
        </View>
      );
    }

    return selectedTrend === 'patterns' ? (
      <BarChart
        data={chartData}
        width={screenWidth - SPACING.xl}
        height={220}
        chartConfig={chartConfig}
        verticalLabelRotation={30}        yAxisLabel=""
        yAxisSuffix=""        style={styles.chart}
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Symptom Trends</Text>
        <Text style={styles.subtitle}>Visual analysis of your symptom patterns</Text>
      </View>

      <View style={styles.dateRangeContainer}>
        <DateRangePicker
          startDate={dateRange.startDate.toISOString().split('T')[0]}
          endDate={dateRange.endDate.toISOString().split('T')[0]}
          onChange={(start, end) => {
            setDateRange({
              startDate: new Date(start),
              endDate: new Date(end),
            });
          }}
        />
      </View>

      {renderTrendSelector()}

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>
          {selectedTrend === 'symptoms' && 'Daily Symptom Count'}
          {selectedTrend === 'severity' && 'Average Severity Over Time'}
          {selectedTrend === 'patterns' && 'Most Common Symptoms'}
        </Text>
        {renderChart()}
      </View>

      {renderInsights()}
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
});