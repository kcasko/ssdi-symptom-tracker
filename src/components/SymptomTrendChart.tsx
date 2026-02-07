/**
 * Symptom Trend Chart Component
 * Visualizes symptom severity over time
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { DailyLog } from '../domain/models/DailyLog';

interface SymptomTrendChartProps {
  logs: DailyLog[];
  symptomId: string;
  title?: string;
  height?: number;
}

interface DataPoint {
  date: string;
  severity: number;
}

export const SymptomTrendChart: React.FC<SymptomTrendChartProps> = ({
  logs,
  symptomId,
  title,
  height = 200,
}) => {
  const width = Dimensions.get('window').width - spacing.lg * 2;
  const chartWidth = width - 60; // Leave space for Y-axis labels
  const chartHeight = height - 60; // Leave space for X-axis labels
  const padding = { top: 20, right: 10, bottom: 40, left: 50 };

  // Extract and sort data points
  const dataPoints = useMemo(() => {
    const points: DataPoint[] = [];
    
    logs.forEach((log) => {
      const symptom = log.symptoms.find((s) => s.symptomId === symptomId);
      if (symptom) {
        points.push({
          date: log.logDate,
          severity: symptom.severity,
        });
      }
    });

    return points.sort((a, b) => a.date.localeCompare(b.date));
  }, [logs, symptomId]);

  if (dataPoints.length === 0) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={[styles.emptyState, { height }]}>
          <Text style={styles.emptyText}>No data to display</Text>
        </View>
      </View>
    );
  }

  // Calculate scales
  const maxSeverity = 10;
  const xScale = chartWidth / Math.max(dataPoints.length - 1, 1);
  const yScale = chartHeight / maxSeverity;

  // Generate polyline points
  const linePoints = dataPoints
    .map((point, index) => {
      const x = padding.left + index * xScale;
      const y = padding.top + (maxSeverity - point.severity) * yScale;
      return `${x},${y}`;
    })
    .join(' ');

  // Generate date labels (show every nth label to avoid crowding)
  const labelInterval = Math.ceil(dataPoints.length / 5);
  const dateLabels = dataPoints.filter((_, index) => index % labelInterval === 0);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height}>
        {/* Y-axis grid lines and labels */}
        {[0, 2, 4, 6, 8, 10].map((severity) => {
          const y = padding.top + (maxSeverity - severity) * yScale;
          return (
            <React.Fragment key={`grid-${severity}`}>
              <Line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke={colors.gray200}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <SvgText
                x={padding.left - 10}
                y={y + 4}
                fontSize="12"
                fill={colors.gray600}
                textAnchor="end"
              >
                {severity}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Trend line */}
        <Polyline
          points={linePoints}
          fill="none"
          stroke={colors.primaryMain}
          strokeWidth="3"
        />

        {/* Data points */}
        {dataPoints.map((point, index) => {
          const x = padding.left + index * xScale;
          const y = padding.top + (maxSeverity - point.severity) * yScale;
          return (
            <Circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r="4"
              fill={colors.primaryMain}
              stroke={colors.white}
              strokeWidth="2"
            />
          );
        })}

        {/* X-axis labels */}
        {dateLabels.map((point, index) => {
          const originalIndex = dataPoints.indexOf(point);
          const x = padding.left + originalIndex * xScale;
          const y = padding.top + chartHeight + 20;
          const dateLabel = new Date(point.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={y}
              fontSize="10"
              fill={colors.gray600}
              textAnchor="middle"
            >
              {dateLabel}
            </SvgText>
          );
        })}

        {/* X-axis line */}
        <Line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke={colors.gray400}
          strokeWidth="2"
        />

        {/* Y-axis line */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke={colors.gray400}
          strokeWidth="2"
        />
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primaryMain }]} />
          <Text style={styles.legendText}>Severity (0-10)</Text>
        </View>
        <Text style={styles.legendSubtext}>
          {dataPoints.length} entries
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 4,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.gray600,
  },
  legend: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
  },
  legendSubtext: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
});
