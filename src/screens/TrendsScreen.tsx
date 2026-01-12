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
import { SimpleBarChart } from '../components/SimpleBarChart';
import { SimpleLineChart } from '../components/SimpleLineChart';
import { useAppState, useLogStore } from '../state/useAppState';
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
import {
  detectFlares,
  calculateFlareSummary,
  type DailyPainEntry,
  type FlareSummary,
} from '../utils/flareDetection';
import {
  analyzeEnvironmentalFactors,
  getWeatherDisplayName,
  getWeatherImpactIcon,
  type EnvironmentalAnalysis,
} from '../utils/weatherCorrelation';
import {
  analyzeMedicationCorrelations,
  getMedicationImpactIcon,
  getEffectivenessText,
  type MedicationAnalysis,
} from '../utils/medicationCorrelation';

const screenWidth = Dimensions.get('window').width;

type TrendType = 'symptoms' | 'severity' | 'patterns' | 'day-quality';

export function TrendsScreen() {
  const { dailyLogs } = useAppState();
  const medications = useLogStore(state => state.medications);
  const [selectedTrend, setSelectedTrend] = useState<TrendType>('day-quality');
  
  // Initialize date range using useMemo to avoid calling Date.now() during render
  const initialDateRange = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  }, []);
  
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

  // Detect flares and calculate summary
  const flareSummary: FlareSummary = useMemo(() => {
    const filteredLogs = dailyLogs.filter(log => {
      const logDate = new Date(log.logDate);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return logDate >= start && logDate <= end;
    });

    // Convert daily logs to pain entries
    const painEntries: DailyPainEntry[] = filteredLogs.map(log => ({
      date: log.logDate,
      painScore: log.overallSeverity,
    }));

    const flares = detectFlares(painEntries);
    return calculateFlareSummary(flares, {
      start: dateRange.startDate,
      end: dateRange.endDate,
    });
  }, [dailyLogs, dateRange]);

  // Analyze environmental correlations
  const environmentalAnalysis: EnvironmentalAnalysis = useMemo(() => {
    const filteredLogs = dailyLogs.filter(log => {
      const logDate = new Date(log.logDate);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return logDate >= start && logDate <= end;
    });

    return analyzeEnvironmentalFactors(filteredLogs);
  }, [dailyLogs, dateRange]);

  // Analyze medication correlations
  const medicationAnalysis: MedicationAnalysis = useMemo(() => {
    if (!medications || medications.length === 0) {
      return {
        correlations: [],
        totalMedications: 0,
        activeMedications: 0,
        effectiveMedications: 0,
        ineffectiveMedications: 0,
        hasInsufficientData: false,
      };
    }

    return analyzeMedicationCorrelations(medications, dailyLogs, {
      start: dateRange.startDate,
      end: dateRange.endDate,
    });
  }, [medications, dailyLogs, dateRange]);

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

  function renderFlareSummary() {
    if (flareSummary.totalFlares === 0) {
      return null;
    }

    return (
      <View style={styles.flareContainer}>
        <Text style={styles.sectionTitle}>Flare Pattern Analysis</Text>
        
        <View style={styles.flareStatsGrid}>
          <View style={styles.flareStatCard}>
            <Text style={[styles.flareValue, { color: COLORS.errorMain }]}>
              {flareSummary.totalFlares}
            </Text>
            <Text style={styles.flareLabel}>Total Flares</Text>
            <Text style={styles.flareSubtext}>in selected period</Text>
          </View>
          
          <View style={styles.flareStatCard}>
            <Text style={[styles.flareValue, { color: COLORS.warningMain }]}>
              {flareSummary.flaresPerMonth.toFixed(1)}
            </Text>
            <Text style={styles.flareLabel}>Per Month</Text>
            <Text style={styles.flareSubtext}>average frequency</Text>
          </View>
        </View>

        <View style={styles.flareDetailsGrid}>
          <View style={styles.flareDetailCard}>
            <Text style={styles.flareDetailLabel}>Average Duration</Text>
            <Text style={styles.flareDetailValue}>
              {flareSummary.averageDuration.toFixed(1)} days
            </Text>
          </View>
          
          <View style={styles.flareDetailCard}>
            <Text style={styles.flareDetailLabel}>Total Days Lost</Text>
            <Text style={styles.flareDetailValue}>
              {flareSummary.totalDaysInFlare} days
            </Text>
          </View>
          
          <View style={styles.flareDetailCard}>
            <Text style={styles.flareDetailLabel}>Average Peak Pain</Text>
            <Text style={styles.flareDetailValue}>
              {flareSummary.peakPainAverage.toFixed(1)}/10
            </Text>
          </View>
        </View>

        {flareSummary.longestFlare && (
          <View style={styles.longestFlareCard}>
            <Text style={styles.longestFlareTitle}>Longest Flare</Text>
            <Text style={styles.longestFlareText}>
              Duration: <Text style={styles.longestFlareValue}>{flareSummary.longestFlare.durationDays} days</Text>
            </Text>
            <Text style={styles.longestFlareText}>
              Period: <Text style={styles.longestFlareValue}>{flareSummary.longestFlare.startDate} to {flareSummary.longestFlare.endDate}</Text>
            </Text>
            <Text style={styles.longestFlareText}>
              Peak Pain: <Text style={styles.longestFlareValue}>{flareSummary.longestFlare.peakPain}/10</Text>
            </Text>
          </View>
        )}

        {flareSummary.recentFlares.length > 0 && (
          <View style={styles.recentFlaresCard}>
            <Text style={styles.recentFlaresTitle}>Recent Flares</Text>
            {flareSummary.recentFlares.map((flare, index) => (
              <View key={`${flare.startDate}-${index}`} style={styles.recentFlareItem}>
                <View style={styles.recentFlareHeader}>
                  <Text style={styles.recentFlareDate}>
                    {flare.startDate} → {flare.endDate}
                  </Text>
                  <Text style={styles.recentFlareDuration}>
                    {flare.durationDays} days
                  </Text>
                </View>
                <Text style={styles.recentFlarePain}>
                  Peak Pain: {flare.peakPain}/10
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.flareNotesCard}>
          <Text style={styles.flareNotesTitle}>Flare Impact Summary</Text>
          <Text style={styles.flareNotesText}>
            • Flares defined as 3+ consecutive days with pain/severity ≥6/10
          </Text>
          {flareSummary.flaresPerMonth >= 2 && (
            <Text style={styles.flareNotesText}>
              • Experiencing {flareSummary.flaresPerMonth.toFixed(1)} flares per month indicates frequent severe episodes
            </Text>
          )}
          {flareSummary.totalDaysInFlare > 0 && (
            <Text style={styles.flareNotesText}>
              • {flareSummary.totalDaysInFlare} total days lost to flares in this period
            </Text>
          )}
          {flareSummary.averageDuration >= 5 && (
            <Text style={styles.flareNotesText}>
              • Average flare duration of {flareSummary.averageDuration.toFixed(1)} days shows prolonged episodes
            </Text>
          )}
        </View>
      </View>
    );
  }

  function renderWeatherCorrelations() {
    if (environmentalAnalysis.weather.length === 0 && !environmentalAnalysis.stress.hasData) {
      return null;
    }

    return (
      <View style={styles.weatherContainer}>
        <Text style={styles.sectionTitle}>Environmental Correlations</Text>
        
        {environmentalAnalysis.weather.length > 0 && (
          <>
            <Text style={styles.weatherSubtitle}>Weather Impact on Symptoms</Text>
            <Text style={styles.weatherDataInfo}>
              Based on {environmentalAnalysis.totalLogsWithWeather} days with weather data
            </Text>
            
            <View style={styles.weatherCorrelationsGrid}>
              {environmentalAnalysis.weather.map((correlation) => (
                <View 
                  key={correlation.weather} 
                  style={[
                    styles.weatherCorrelationCard,
                    correlation.impact === 'worsens' && styles.weatherWorsensCard,
                    correlation.impact === 'improves' && styles.weatherImprovesCard,
                  ]}
                >
                  <View style={styles.weatherCardHeader}>
                    <Text style={styles.weatherCondition}>
                      {getWeatherDisplayName(correlation.weather)}
                    </Text>
                    <Text style={styles.weatherImpactIcon}>
                      {getWeatherImpactIcon(correlation.impact)}
                    </Text>
                  </View>
                  
                  <View style={styles.weatherStats}>
                    <View style={styles.weatherStat}>
                      <Text style={styles.weatherStatLabel}>Avg Severity</Text>
                      <Text style={styles.weatherStatValue}>
                        {correlation.averageSeverity}/10
                      </Text>
                    </View>
                    
                    <View style={styles.weatherStat}>
                      <Text style={styles.weatherStatLabel}>Days Logged</Text>
                      <Text style={styles.weatherStatValue}>
                        {correlation.occurrences}
                      </Text>
                    </View>
                    
                    <View style={styles.weatherStat}>
                      <Text style={styles.weatherStatLabel}>Bad Days</Text>
                      <Text style={styles.weatherStatValue}>
                        {correlation.significantSymptomPercentage}%
                      </Text>
                    </View>
                  </View>
                  
                  {correlation.impact !== 'neutral' && (
                    <Text style={styles.weatherImpactText}>
                      {correlation.impact === 'worsens' 
                        ? `Symptoms ${correlation.correlationStrength.toFixed(1)}pts worse than average`
                        : `Symptoms ${correlation.correlationStrength.toFixed(1)}pts better than average`}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
        
        {environmentalAnalysis.stress.hasData && (
          <>
            <Text style={styles.weatherSubtitle}>Stress Correlation</Text>
            <Text style={styles.weatherDataInfo}>
              Based on {environmentalAnalysis.totalLogsWithStress} days with stress data
            </Text>
            
            <View style={styles.stressCorrelationCard}>
              <View style={styles.stressHeader}>
                <Text style={styles.stressTitle}>Stress Level Impact</Text>
                <Text style={styles.stressCorrelationValue}>
                  Correlation: {(environmentalAnalysis.stress.correlation * 100).toFixed(0)}%
                </Text>
              </View>
              
              <View style={styles.stressLevelsGrid}>
                {environmentalAnalysis.stress.stressLevels.map((level) => (
                  <View key={level.level} style={styles.stressLevelCard}>
                    <Text style={styles.stressLevelLabel}>
                      {level.level.charAt(0).toUpperCase() + level.level.slice(1)} Stress
                    </Text>
                    <Text style={styles.stressLevelValue}>
                      {level.avgSeverity}/10
                    </Text>
                    <Text style={styles.stressLevelCount}>
                      {level.count} days
                    </Text>
                  </View>
                ))}
              </View>
              
              {environmentalAnalysis.stress.correlation > 0.3 && (
                <View style={styles.stressInsightCard}>
                  <Text style={styles.stressInsightText}>
                    {environmentalAnalysis.stress.correlation > 0.6 
                      ? '⚠️ Strong positive correlation: Higher stress significantly worsens symptoms'
                      : '• Moderate correlation: Stress appears to influence symptom severity'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
        
        {(environmentalAnalysis.weather.length > 0 || environmentalAnalysis.stress.hasData) && (
          <View style={styles.environmentalNotesCard}>
            <Text style={styles.environmentalNotesTitle}>Documentation Notes</Text>
            {environmentalAnalysis.weather.some(w => w.impact === 'worsens') && (
              <Text style={styles.environmentalNotesText}>
                • Environmental factors (weather) show measurable impact on symptom severity
              </Text>
            )}
            {environmentalAnalysis.stress.hasData && environmentalAnalysis.stress.correlation > 0.3 && (
              <Text style={styles.environmentalNotesText}>
                • Stress levels correlate with symptom severity, indicating environmental sensitivity
              </Text>
            )}
            <Text style={styles.environmentalNotesText}>
              • These patterns support documentation of condition variability and environmental triggers
            </Text>
          </View>
        )}
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
      <SimpleBarChart
        data={chartData}
        width={screenWidth - SPACING.lg * 2}
        height={280}
        showValues
      />
    ) : (
      <SimpleLineChart
        data={chartData}
        width={screenWidth - SPACING.lg * 2}
        height={280}
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

  function renderMedicationCorrelations() {
    if (medicationAnalysis.totalMedications === 0) {
      return null;
    }

    return (
      <View style={styles.medicationContainer}>
        <Text style={styles.sectionTitle}>Medication Correlation Analysis</Text>
        
        <View style={styles.medicationSummaryGrid}>
          <View style={styles.medicationSummaryCard}>
            <Text style={styles.medicationSummaryValue}>
              {medicationAnalysis.totalMedications}
            </Text>
            <Text style={styles.medicationSummaryLabel}>Total Meds</Text>
          </View>
          
          <View style={styles.medicationSummaryCard}>
            <Text style={[styles.medicationSummaryValue, { color: COLORS.success.main }]}>
              {medicationAnalysis.effectiveMedications}
            </Text>
            <Text style={styles.medicationSummaryLabel}>Improved</Text>
          </View>
          
          <View style={styles.medicationSummaryCard}>
            <Text style={[styles.medicationSummaryValue, { color: COLORS.error.main }]}>
              {medicationAnalysis.ineffectiveMedications}
            </Text>
            <Text style={styles.medicationSummaryLabel}>No Effect</Text>
          </View>
        </View>

        {medicationAnalysis.correlations.map((correlation) => (
          <View 
            key={correlation.medicationId} 
            style={[
              styles.medicationCorrelationCard,
              correlation.impact === 'improved' && styles.medicationImprovedCard,
              correlation.impact === 'worsened' && styles.medicationWorsenedCard,
            ]}
          >
            <View style={styles.medicationCardHeader}>
              <View style={styles.medicationNameSection}>
                <Text style={styles.medicationName}>
                  {correlation.medicationName}
                </Text>
                <Text style={styles.medicationDosage}>
                  {correlation.dosage}
                </Text>
              </View>
              <Text style={styles.medicationImpactIcon}>
                {getMedicationImpactIcon(correlation.impact)}
              </Text>
            </View>

            {correlation.purpose.length > 0 && (
              <Text style={styles.medicationPurpose}>
                For: {correlation.purpose.join(', ')}
              </Text>
            )}

            <View style={styles.medicationStatsGrid}>
              {correlation.averageSeverityBefore !== undefined && (
                <View style={styles.medicationStatItem}>
                  <Text style={styles.medicationStatLabel}>Before</Text>
                  <Text style={styles.medicationStatValue}>
                    {correlation.averageSeverityBefore}/10
                  </Text>
                </View>
              )}
              
              <View style={styles.medicationStatItem}>
                <Text style={styles.medicationStatLabel}>During</Text>
                <Text style={styles.medicationStatValue}>
                  {correlation.averageSeverityDuring}/10
                </Text>
              </View>

              {correlation.severityChange !== undefined && (
                <View style={styles.medicationStatItem}>
                  <Text style={styles.medicationStatLabel}>Change</Text>
                  <Text style={[
                    styles.medicationStatValue,
                    correlation.severityChange > 0 && { color: COLORS.success.main },
                    correlation.severityChange < 0 && { color: COLORS.error.main },
                  ]}>
                    {correlation.severityChange > 0 ? '+' : ''}{correlation.severityChange}
                  </Text>
                </View>
              )}
            </View>

            {correlation.impact !== 'insufficient_data' && correlation.severityChange !== undefined && (
              <View style={styles.medicationImpactSection}>
                <Text style={styles.medicationImpactText}>
                  {correlation.impact === 'improved' 
                    ? `✓ Symptoms improved by ${Math.abs(correlation.severityChange)} points (${correlation.changePercentage}%)`
                    : correlation.impact === 'worsened'
                      ? `⚠️ Symptoms worsened by ${Math.abs(correlation.severityChange)} points (${Math.abs(correlation.changePercentage || 0)}%)`
                      : '− No significant change in symptoms'}
                </Text>
              </View>
            )}

            {correlation.effectiveness && (
              <View style={styles.medicationEffectivenessSection}>
                <Text style={styles.medicationEffectivenessLabel}>
                  User Rating:
                </Text>
                <Text style={styles.medicationEffectivenessValue}>
                  {getEffectivenessText(correlation.effectiveness)}
                </Text>
              </View>
            )}

            <View style={styles.medicationDataQuality}>
              <Text style={styles.medicationDataQualityLabel}>
                Data Quality: {correlation.dataQuality.toUpperCase()}
              </Text>
              <Text style={styles.medicationDataQualityDetail}>
                {correlation.daysOfDataBefore > 0 && `${correlation.daysOfDataBefore} days before, `}
                {correlation.daysOfDataDuring} days during
                {correlation.daysOfDataAfter > 0 && `, ${correlation.daysOfDataAfter} days after`}
              </Text>
            </View>

            {correlation.dataQuality === 'low' && (
              <View style={styles.medicationWarning}>
                <Text style={styles.medicationWarningText}>
                  ⚠️ Limited data - correlations may not be reliable
                </Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.medicationNotesCard}>
          <Text style={styles.medicationNotesTitle}>Medication Analysis Notes</Text>
          <Text style={styles.medicationNotesText}>
            • Analysis compares symptom severity before and during medication use
          </Text>
          {medicationAnalysis.effectiveMedications > 0 && (
            <Text style={styles.medicationNotesText}>
              • {medicationAnalysis.effectiveMedications} medication(s) show measurable symptom improvement
            </Text>
          )}
          {medicationAnalysis.hasInsufficientData && (
            <Text style={styles.medicationNotesText}>
              • Some medications have limited data - continue logging for better analysis
            </Text>
          )}
          <Text style={styles.medicationNotesText}>
            • Correlation data supports treatment documentation and efficacy assessment
          </Text>
        </View>
      </View>
    );
  }

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
      
      {renderFlareSummary()}
      
      {renderWeatherCorrelations()}
      
      {renderMedicationCorrelations()}
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
  // Flare summary styles
  flareContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  flareStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  flareStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.error.light,
  },
  flareValue: {
    ...TYPOGRAPHY.displayLarge,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  flareLabel: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  flareSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
  },
  flareDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  flareDetailCard: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  flareDetailLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  flareDetailValue: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.gray900,
    fontWeight: 'bold',
  },
  longestFlareCard: {
    backgroundColor: COLORS.error.light,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  longestFlareTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.errorMain,
    marginBottom: SPACING.sm,
    fontWeight: 'bold',
  },
  longestFlareText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray800,
    marginBottom: SPACING.xs,
  },
  longestFlareValue: {
    fontWeight: 'bold',
    color: COLORS.errorMain,
  },
  recentFlaresCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  recentFlaresTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.gray900,
    marginBottom: SPACING.md,
    fontWeight: 'bold',
  },
  recentFlareItem: {
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.errorMain,
  },
  recentFlareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  recentFlareDate: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray800,
    fontWeight: '500',
  },
  recentFlareDuration: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.errorMain,
    fontWeight: 'bold',
  },
  recentFlarePain: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray700,
  },
  flareNotesCard: {
    backgroundColor: COLORS.warningLight,
    padding: SPACING.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warningMain,
  },
  flareNotesTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.warning.dark,
    marginBottom: SPACING.md,
    fontWeight: 'bold',
  },
  flareNotesText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  // Weather correlation styles
  weatherContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  weatherSubtitle: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.gray900,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  weatherDataInfo: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray600,
    marginBottom: SPACING.md,
  },
  weatherCorrelationsGrid: {
    marginBottom: SPACING.lg,
  },
  weatherCorrelationCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gray300,
  },
  weatherWorsensCard: {
    borderLeftColor: COLORS.error.main,
    backgroundColor: COLORS.error.light,
  },
  weatherImprovesCard: {
    borderLeftColor: COLORS.success.main,
    backgroundColor: COLORS.success.light,
  },
  weatherCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  weatherCondition: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.gray900,
    fontWeight: 'bold',
  },
  weatherImpactIcon: {
    fontSize: 24,
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  weatherStat: {
    flex: 1,
    alignItems: 'center',
  },
  weatherStatLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  weatherStatValue: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.gray900,
    fontWeight: 'bold',
  },
  weatherImpactText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray700,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  stressCorrelationCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  stressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stressTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.gray900,
    fontWeight: 'bold',
  },
  stressCorrelationValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary600,
    fontWeight: 'bold',
  },
  stressLevelsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  stressLevelCard: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  stressLevelLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  stressLevelValue: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.gray900,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  stressLevelCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
  },
  stressInsightCard: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: 8,
  },
  stressInsightText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray800,
    lineHeight: 20,
  },
  environmentalNotesCard: {
    backgroundColor: COLORS.primary[50],
    padding: SPACING.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary600,
  },
  environmentalNotesTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.primary600,
    marginBottom: SPACING.md,
    fontWeight: 'bold',
  },
  environmentalNotesText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  // Medication correlation styles
  medicationContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  medicationSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  medicationSummaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  medicationSummaryValue: {
    ...TYPOGRAPHY.displayMedium,
    color: COLORS.gray900,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  medicationSummaryLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray700,
  },
  medicationCorrelationCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gray300,
  },
  medicationImprovedCard: {
    borderLeftColor: COLORS.success.main,
    backgroundColor: COLORS.success.light,
  },
  medicationWorsenedCard: {
    borderLeftColor: COLORS.error.main,
    backgroundColor: COLORS.error.light,
  },
  medicationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  medicationNameSection: {
    flex: 1,
  },
  medicationName: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.gray900,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  medicationDosage: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray700,
  },
  medicationImpactIcon: {
    fontSize: 28,
    marginLeft: SPACING.sm,
  },
  medicationPurpose: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray600,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  medicationStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.gray100,
    padding: SPACING.md,
    borderRadius: 8,
  },
  medicationStatItem: {
    alignItems: 'center',
  },
  medicationStatLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  medicationStatValue: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.gray900,
    fontWeight: 'bold',
  },
  medicationImpactSection: {
    padding: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  medicationImpactText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray800,
    textAlign: 'center',
  },
  medicationEffectivenessSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    marginTop: SPACING.sm,
  },
  medicationEffectivenessLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray700,
  },
  medicationEffectivenessValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray900,
    fontWeight: 'bold',
  },
  medicationDataQuality: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  medicationDataQualityLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  medicationDataQualityDetail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
  },
  medicationWarning: {
    backgroundColor: COLORS.warning.light,
    padding: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  medicationWarningText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.warning.text,
    textAlign: 'center',
  },
  medicationNotesCard: {
    backgroundColor: COLORS.primary[100],
    padding: SPACING.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary600,
  },
  medicationNotesTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.primary600,
    marginBottom: SPACING.md,
    fontWeight: 'bold',
  },
  medicationNotesText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
});
