import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, StackedBarChart, LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width - 40;
const chartHeight = 220;
const BAR_WIDTH = 60; // Width allocated for each bar

export default function FinancialBarChart({ data, labels, suffix = '', propertyBreakdown = [] }) {
  const [chartType, setChartType] = useState('bar');
  const [dataType, setDataType] = useState('monthly');

  const dataTypes = [
    { key: 'monthly', label: 'Monthly Income', icon: 'cash-outline', color: '#007AFF', secondaryColor: '#4CAF50' },
    { key: 'gross', label: 'Gross Income', icon: 'trending-up-outline', color: '#FF6B35', secondaryColor: '#FFD93D' },
    { key: 'expenses', label: 'Expenses', icon: 'wallet-outline', color: '#FF4757', secondaryColor: '#FFA502' },
    { key: 'net', label: 'Net Income', icon: 'analytics-outline', color: '#2ED573', secondaryColor: '#1E90FF' }
  ];

  const chartTypes = [
    { type: 'bar', icon: 'bar-chart-outline', label: 'Bar' },
    { type: 'line', icon: 'trending-up-outline', label: 'Line' },
    { type: 'pie', icon: 'pie-chart-outline', label: 'Pie' }
  ];

  const currentDataType = dataTypes.find(dt => dt.key === dataType);
  const currentChartType = chartTypes.find(ct => ct.type === chartType);

  const barLineData = useMemo(() => {
    if (!data?.length) return { primary: [], secondary: [], gross: [], expenses: [], net: [] };
    return {
      primary: data.map(item => item.net),
      secondary: data.map(item => item.util),
      gross: data.map(item => item.net + item.util),
      expenses: data.map(item => item.util),
      net: data.map(item => item.net)
    };
  }, [data]);

  const pieData = useMemo(() => {
    const colors = ['#007AFF', '#4CAF50', '#FF6B35', '#FF4757', '#2ED573', '#FFD93D'];
    return propertyBreakdown
      .map((property, idx) => {
        let value;
        switch (dataType) {
          case 'gross': value = property.gross_income; break;
          case 'expenses': value = property.expenses; break;
          case 'net': value = property.net_profit; break;
          case 'monthly':
          default: value = property.total_income;
        }
        return { 
          name: `${property.name} (${suffix}${Math.round(value)})`, 
          population: value, 
          color: colors[idx % colors.length], 
          legendFontColor: '#666', 
          legendFontSize: 11 
        };
      })
      .filter(item => item.population > 0);
  }, [propertyBreakdown, dataType, suffix]);

  // Calculate the minimum chart width needed to display all bars
  const getBarChartWidth = () => {
    return Math.max(screenWidth, (labels?.length || 1) * BAR_WIDTH + 60); // Add padding
  };

  // Calculate y-axis ticks rounded to hundreds
  const getYAxisTicks = (data) => {
    if (!data?.length) return [0, 100, 200, 300, 400];
    
    let maxValue = 0;
    if (dataType === 'monthly') {
      maxValue = Math.max(...data.map((item, i) => barLineData.primary[i] + barLineData.secondary[i]));
    } else if (dataType === 'gross') {
      maxValue = Math.max(...barLineData.gross);
    } else if (dataType === 'expenses') {
      maxValue = Math.max(...barLineData.expenses);
    } else {
      maxValue = Math.max(...barLineData.net);
    }
    
    // Add 20% buffer
    maxValue = maxValue * 1.2;
    
    // Round to nearest hundred
    maxValue = Math.ceil(maxValue / 100) * 100;
    
    // Generate 5 evenly spaced ticks
    const tickInterval = maxValue / 4;
    return [0, tickInterval, tickInterval * 2, tickInterval * 3, maxValue];
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: () => currentDataType.color,
    labelColor: () => '#666',
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: currentDataType.color },
    propsForLabels: { fontSize: 10 },
    formatYLabel: (value) => {
      const num = Math.round(parseFloat(value) / 100) * 100;
      return num.toString();
    }
  };

  const toggleChartType = () => {
    const next = chartTypes[(chartTypes.findIndex(ct => ct.type === chartType) + 1) % chartTypes.length].type;
    setChartType(next);
  };

  const toggleDataType = () => {
    const next = dataTypes[(dataTypes.findIndex(dt => dt.key === dataType) + 1) % dataTypes.length].key;
    setDataType(next);
  };

  if ((!data?.length && chartType !== 'pie') || (chartType === 'pie' && pieData.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentDataType.color} />
        <Text style={styles.loadingText}>Loading financial data...</Text>
      </View>
    );
  }

  // ========================= Helper for y-axis labels ========================= //
  const renderYAxis = (ticks) => (
    <View style={styles.yAxisLabels}>
      {ticks.slice().reverse().map((t, idx) => (
        <Text key={idx} style={styles.yAxisLabel}>{`${suffix}${t}`}</Text>
      ))}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{currentDataType.label}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={toggleDataType}>
          <Ionicons name={currentDataType.icon} size={18} color={currentDataType.color} />
          <Text style={styles.buttonText}>{currentDataType.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleChartType}>
          <Ionicons name={currentChartType.icon} size={18} color={currentDataType.color} />
          <Text style={styles.buttonText}>{currentChartType.label}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartArea}>
        {chartType === 'bar' && (
          <View style={styles.barWrapper}>
            {renderYAxis(getYAxisTicks(data))}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              scrollEventThrottle={16}
              nestedScrollEnabled
              contentContainerStyle={styles.scrollContainer}
            >
              {dataType === 'monthly' ? (
                <StackedBarChart
                  data={{
                    labels,
                    legend: ['Net', 'Expenses'],
                    data: barLineData.primary.map((_, i) => [barLineData.primary[i], barLineData.secondary[i]]),
                    barColors: [currentDataType.color, currentDataType.secondaryColor]
                  }}
                  width={getBarChartWidth()}
                  height={chartHeight}
                  chartConfig={{ ...chartConfig, barPercentage: 0.6, withInnerLines: false, withHorizontalLabels: false }}
                  style={styles.chart}
                  fromZero
                  verticalLabelRotation={30}
                />
              ) : (
                <BarChart
                  data={{
                    labels,
                    datasets: [{
                      data: dataType === 'gross' ? barLineData.gross : dataType === 'expenses' ? barLineData.expenses : barLineData.net
                    }]
                  }}
                  width={getBarChartWidth()}
                  height={chartHeight}
                  chartConfig={{ ...chartConfig, barPercentage: 0.6, withInnerLines: false, withHorizontalLabels: false }}
                  style={styles.chart}
                  fromZero
                  verticalLabelRotation={30}
                />
              )}
            </ScrollView>
          </View>
        )}
        
        {chartType === 'line' && (
          <LineChart
            data={{
              labels,
              datasets: dataType === 'monthly'
                ? [ 
                    { data: barLineData.primary, color: () => currentDataType.color },
                    { data: barLineData.secondary, color: () => currentDataType.secondaryColor } 
                  ]
                : [ 
                    { data: dataType === 'gross'
                        ? barLineData.gross
                        : dataType === 'expenses'
                          ? barLineData.expenses
                          : barLineData.net 
                    } 
                  ]
            }}
            width={screenWidth - 20}
            height={chartHeight}
            chartConfig={chartConfig}
            fromZero
            yAxisSuffix={suffix}
            verticalLabelRotation={30}
            style={styles.chart}
            segments={5}
          />
        )}
        
        {chartType === 'pie' && (
          <View style={styles.pieContainer}>
            <PieChart
              data={pieData}
              width={screenWidth}
              height={chartHeight}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[screenWidth / 4, 0]}
              absolute
              hasLegend={true}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 8 
  },
  loadingContainer: { 
    padding: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    color: '#666', 
    fontSize: 16 
  },
  titleContainer: { 
    alignItems: 'center', 
    marginBottom: 8 
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1A1A1A' 
  },
  controls: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16
  },
  button: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    backgroundColor: '#F8F9FA', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E9ECEF' 
  },
  buttonText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#007AFF', 
    marginLeft: 6 
  },
  chartArea: { 
    alignItems: 'center',
    height: chartHeight + 20,
    justifyContent: 'center'
  },
  scrollContainer: {
    paddingRight: 20,
    alignItems: 'flex-end',
    paddingBottom: 4
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8
  },
  pieContainer: { 
    width: '100%', 
    alignItems: 'center',
    justifyContent: 'center'
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  yAxisLabels: {
    height: chartHeight,
    justifyContent: 'space-between',
    paddingRight: 6
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#666'
  }
}); 