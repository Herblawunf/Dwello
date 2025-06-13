import React from "react";
import { StyleSheet, View, Text, Dimensions, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width - 40; // account for parent padding
const chartHeight = 220;
const barMargin = 4;  // margin between bars

/**
 * FinancialBarChart
 * A custom bar chart built from Views, showing Net Income (matte black) and Utilities (matte gray) as smooth, modern stacks.
 * Features aligned bars, bottom-aligned labels, and a y-axis.
 * Props:
 *  - data: Array<{ net: number, util: number }>
 *  - labels: Array<string>
 *  - suffix: string (e.g., "£")
 */
export default function FinancialBarChart({ data, labels, suffix = "" }) {
  // Compute totals and max
  const totals = data.map(item => item.net + item.util);
  const rawMaxTotal = Math.max(...totals);

  // Round max to nearest 50 or 100
  const roundTo = rawMaxTotal > 500 ? 100 : 50;
  const maxTotal = Math.ceil(rawMaxTotal / roundTo) * roundTo;

  // Generate y-axis ticks at rounded intervals
  const tickCount = 5;
  const tickInterval = maxTotal / (tickCount - 1);
  const ticks = Array.from({ length: tickCount }, (_, i) =>
    Math.round((maxTotal - tickInterval * i) / roundTo) * roundTo
  ); // descending

  // Calculate bar width for a natural scrollable look (show ~6 bars at a time)
  const barCount = data.length;
  const barsVisible = 6;
  const totalBarMargins = barMargin * (barsVisible - 1);
  const barWidth = (screenWidth - totalBarMargins) / barsVisible;
  const sidePadding = (screenWidth - screenWidth) / 2;

  return (
    <View style={styles.wrapper}>
      {/* Title */}
      <Text style={styles.title}>Monthly Income</Text>
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <Ionicons name="cash-outline" size={16} color="#303030" />
          <Text style={styles.legendLabel}>Net Income</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="water-outline" size={16} color="#A0A0A0" />
          <Text style={styles.legendLabel}>Utilities</Text>
        </View>
      </View>
      {/* Chart Area */}
      <View style={[styles.chartArea, { height: chartHeight, marginTop: 12, position: 'relative', width: '100%' }]}>  
        {/* Y-axis labels */}
        <View style={styles.yAxis}>  
          {ticks.map((t, idx) => {
            const label = `${t}${suffix}`;
            return (
              <Text key={idx} style={styles.yAxisLabel}>
                {label}
              </Text>
            );
          })}
        </View>
        {/* Grid Lines */}
        <View style={{ position: 'absolute', left: 40, top: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} pointerEvents="none">
          {ticks.map((_, idx) => {
            // Don't draw a line at the bottom (last tick)
            if (idx === ticks.length - 1) return null;
            // Center the grid line at the same vertical position as the label
            const labelHeight = 16; // matches yAxisLabel lineHeight
            const top = (chartHeight / (ticks.length - 1)) * idx + labelHeight / 2;
            return (
              <View
                key={idx}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top,
                  height: 1,
                  backgroundColor: '#EDEDED',
                }}
              />
            );
          })}
        </View>
        {/* Bars and X-axis labels */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: sidePadding, paddingRight: sidePadding }}
        >
          <View style={styles.chartContainer}>
            {data.map((item, idx) => {
              const utilHeight = (item.util / maxTotal) * chartHeight;
              const netHeight = (item.net / maxTotal) * chartHeight;
              return (
                <View key={idx} style={[styles.barWrapper, { width: barWidth, marginHorizontal: barMargin / 2 }]}>
                  <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                    {/* Utilities on top */}
                    <View
                      style={{
                        width: '100%',
                        height: utilHeight,
                        backgroundColor: '#A0A0A0',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                      }}
                    />
                    {/* Net Income below */}
                    <View
                      style={{
                        width: '100%',
                        height: netHeight,
                        backgroundColor: '#303030',
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                      }}
                    />
                  </View>
                  {labels && <Text style={styles.barLabel}>{labels[idx]}</Text>}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDEDED',
    padding: 16,
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
    width: '100%',
    marginBottom: 20, // Add extra space below legend
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
  },
  chartArea: {
    flexDirection: 'row',
    width: '100%',
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginRight: 8,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#555',
    lineHeight: 16,
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barWrapper: {
    flex: 1,
    marginHorizontal: barMargin,
    alignItems: 'center',
  },
  barLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
}); 