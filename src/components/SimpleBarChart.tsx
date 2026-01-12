/**
 * Simple Bar Chart Component
 * Custom SVG-based bar chart with proper label rendering
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { colors as COLORS } from '../theme/colors';

interface SimpleBarChartProps {
  data: {
    labels: string[];
    datasets: { data: number[] }[];
  };
  width: number;
  height: number;
  barColor?: string;
  showValues?: boolean;
}

export function SimpleBarChart({
  data,
  width,
  height,
  barColor = COLORS.primaryMain,
  showValues = true,
}: SimpleBarChartProps) {
  const { labels, datasets } = data;
  const values = datasets[0]?.data || [];

  if (labels.length === 0 || values.length === 0) {
    return null;
  }

  // Chart dimensions with padding for labels
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 60; // Extra space for rotated labels

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...values, 1);
  const barCount = values.length;
  const barWidth = (chartWidth / barCount) * 0.6;
  const barGap = (chartWidth / barCount) * 0.4;

  // Y-axis ticks
  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) =>
    Math.round((maxValue / yTickCount) * i)
  );

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
          const y = paddingTop + chartHeight - (tick / maxValue) * chartHeight;
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

        {/* Bars and labels */}
        {values.map((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          const x = paddingLeft + (index * (chartWidth / barCount)) + barGap / 2;
          const y = paddingTop + chartHeight - barHeight;

          return (
            <React.Fragment key={`bar-${index}`}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                rx={4}
                ry={4}
              />

              {/* Value on top of bar */}
              {showValues && value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 8}
                  fontSize={11}
                  fill={COLORS.gray700}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {Number.isInteger(value) ? value : value.toFixed(1)}
                </SvgText>
              )}

              {/* X-axis label (rotated) */}
              <SvgText
                x={x + barWidth / 2}
                y={paddingTop + chartHeight + 15}
                fontSize={11}
                fill={COLORS.gray700}
                textAnchor="end"
                rotation={-30}
                originX={x + barWidth / 2}
                originY={paddingTop + chartHeight + 15}
              >
                {labels[index]}
              </SvgText>
            </React.Fragment>
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
