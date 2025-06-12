import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width - 40; // account for parent padding

/**
 * FinancialBarChart
 * A reusable bar chart component for displaying monthly income data inside a rounded square container.
 * Props:
 *  - data: Array<number> (e.g., [800, 950, 1100, ...])
 *  - labels: Array<string> (e.g., ["Jan", "Feb", "Mar", ...])
 *  - suffix: string (e.g., "£")
 */
export default function FinancialBarChart({ data, labels, suffix = "" }) {
  return (
    <View style={styles.wrapper}>
      <BarChart
        data={{ labels, datasets: [{ data }] }}
        width={screenWidth - styles.wrapper.padding * 2} // adjust chart width for wrapper padding
        height={220}
        yAxisSuffix={suffix}
        chartConfig={{
          backgroundColor: "#F8F9FA",
          backgroundGradientFrom: "#F8F9FA",
          backgroundGradientTo: "#F8F9FA",
          decimalPlaces: 1
        ,
          color: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(85, 85, 85, ${opacity})`,
          style: { borderRadius: 12 },
          propsForBackgroundLines: { strokeDasharray: "" }
        }}
        style={styles.chartStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDEDED",
    padding: 16,          // increased padding for gap
    overflow: "hidden",
    alignItems: "center"
  },
  chartStyle: {
    borderRadius: 12,
    marginVertical: 4,      // small vertical gap inside wrapper
    marginHorizontal: 20
  }
});
