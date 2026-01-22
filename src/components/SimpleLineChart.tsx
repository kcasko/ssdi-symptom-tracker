/**
 * Simple Line Chart Component
 * Custom SVG-based line chart with proper label rendering
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Line } from 'react-native-svg';
import { colors as COLORS } from '../theme/colors';

interface SimpleLineChartProps {
  data: {
    labels: string[];
    datasets: { data: Array<number | null> }[];
  };
  width: number;
  height: number;
  lineColor?: string;
  showDots?: boolean;
}

export function SimpleLineChart({
  data,
  width,
  height,
  lineColor = COLORS.primaryMain,
  showDots = true,
}: SimpleLineChartProps) {
  const { labels, datasets } = data;
  const values = datasets[0]?.data || [];
  const numericValues = values.filter((v) => v !== null && !Number.isNaN(v)) as number[];

  if (labels.length === 0 || values.length === 0 || numericValues.length === 0) {
    return null;
  }

  // Chart dimensions with padding for labels
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 60; // Extra space for rotated labels

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...numericValues, 1);
  const minValue = Math.min(...numericValues, 0);
  const valueRange = maxValue - minValue || 1;

  // Calculate points
  const points = values.map((value, index) => {
    if (value === null || Number.isNaN(value)) return null;
    const x = paddingLeft + (index / (values.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    return { x, y, value };
  });

  // Create smooth path (bezier curve)
  const createSegmentPath = (segment: Array<{ x: number; y: number }>) => {
    if (segment.length < 2) return '';
    let path = `M ${segment[0].x} ${segment[0].y}`;

    for (let i = 0; i < segment.length - 1; i++) {
      const current = segment[i];
      const next = segment[i + 1];
      const midX = (current.x + next.x) / 2;

      path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
  };

  // Break into segments where gaps exist
  const segments: Array<Array<{ x: number; y: number; value: number }>> = [];
  let currentSegment: Array<{ x: number; y: number; value: number }> = [];
  points.forEach((point) => {
    if (!point) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
      return;
    }
    currentSegment.push(point);
  });
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  // Y-axis ticks
  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const val = minValue + (valueRange / yTickCount) * i;
    return Math.round(val * 10) / 10;
  });

  // Determine label interval for x-axis (show fewer labels if many data points)
  const labelInterval = Math.ceil(labels.length / 8);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Y-axis line */}
        <Line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={paddingTop + chartHeight}
          stroke={COLORS.gray300}
          strokeWidth={1}
        />

        {/* X-axis line */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={paddingLeft + chartWidth}
          y2={paddingTop + chartHeight}
          stroke={COLORS.gray300}
          strokeWidth={1}
        />

        {/* Y-axis ticks and labels */}
        {yTicks.map((tick, index) => {
          const y = paddingTop + chartHeight - ((tick - minValue) / valueRange) * chartHeight;
          return (
            <React.Fragment key={`y-tick-${index}`}>
              <Line
                x1={paddingLeft - 5}
                y1={y}
                x2={paddingLeft}
                y2={y}
                stroke={COLORS.gray300}
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 10}
                y={y + 4}
                fontSize={10}
                fill={COLORS.gray600}
                textAnchor="end"
              >
                {tick}
              </SvgText>
              {/* Grid line */}
              {index > 0 && (
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke={COLORS.gray200}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Line paths for each segment (gaps break continuity) */}
        {segments.map((segment, idx) => (
          <Path
            key={`path-${idx}`}
            d={createSegmentPath(segment)}
            stroke={lineColor}
            strokeWidth={2.5}
            fill="none"
          />
        ))}

        {/* Data points */}
        {showDots &&
          segments.flat().map((point, index) => (
            <Circle
              key={`dot-${index}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={COLORS.white}
              stroke={lineColor}
              strokeWidth={2}
            />
          ))}

        {/* X-axis labels (rotated, showing subset) */}
        {labels.map((label, index) => {
          if (index % labelInterval !== 0 && index !== labels.length - 1) {
            return null;
          }
          const x = paddingLeft + (index / (labels.length - 1 || 1)) * chartWidth;
          return (
            <SvgText
              key={`x-label-${index}`}
              x={x}
              y={paddingTop + chartHeight + 15}
              fontSize={10}
              fill={COLORS.gray700}
              textAnchor="end"
              rotation={-30}
              originX={x}
              originY={paddingTop + chartHeight + 15}
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
