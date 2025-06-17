import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, StackedBarChart, LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width - 40;
const chartHeight = 220;
const BAR_WIDTH = 60; // Width allocated for each bar

export default function FinancialBarChart({ data, labels, suffix = '', propertyBreakdown }) {
  // Ensure propertyBreakdown is always an array
  propertyBreakdown = Array.isArray(propertyBreakdown) ? propertyBreakdown : [];

  const [chartType, setChartType] = useState('bar');
  const [dataType, setDataType] = useState('monthly');

  // Modern futuristic color palette
  const modernColors = {
    primary: '#6C5CE7',      // Soft purple
    secondary: '#00CEC9',    // Teal
    accent1: '#74B9FF',      // Soft blue
    accent2: '#81ECEC',      // Light cyan
    accent3: '#A29BFE',      // Lavender
    accent4: '#DFEAFF',      // Very light blue
    accent5: '#E5FCFF',      // Very light cyan
    text: '#2D3436',         // Dark gray for text
    lightText: '#636E72'     // Medium gray for secondary text
  };

  const dataTypes = [
    { key: 'monthly', label: 'Monthly Income', icon: 'cash-outline', color: modernColors.primary, secondaryColor: modernColors.secondary },
    { key: 'gross', label: 'Gross Income', icon: 'trending-up-outline', color: modernColors.accent1, secondaryColor: modernColors.accent3 },
    { key: 'expenses', label: 'Expenses', icon: 'wallet-outline', color: modernColors.secondary, secondaryColor: modernColors.accent2 },
    { key: 'net', label: 'Net Income', icon: 'analytics-outline', color: modernColors.accent3, secondaryColor: modernColors.accent1 }
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
    const roundToHundred = (val) => Math.round(val / 100) * 100;
    return {
      primary: data.map(item => roundToHundred(item.net)),
      secondary: data.map(item => roundToHundred(item.util)),
      gross: data.map(item => roundToHundred(item.net + item.util)),
      expenses: data.map(item => roundToHundred(item.util)),
      net: data.map(item => roundToHundred(item.net))
    };
  }, [data]);

  const pieData = useMemo(() => {
    // Use modern color palette for pie chart
    const pieColors = [
      modernColors.primary,
      modernColors.secondary,
      modernColors.accent1,
      modernColors.accent2,
      modernColors.accent3,
      modernColors.accent4
    ];
    
    // Calculate total for percentage calculation
    let total = 0;
    propertyBreakdown.forEach(property => {
      let value;
      switch (dataType) {
        case 'gross': value = property.gross_income; break;
        case 'expenses': value = property.expenses; break;
        case 'net': value = property.net_profit; break;
        case 'monthly':
        default: value = property.total_income;
      }
      if (value > 0) total += value;
    });
    
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
        
        // Calculate percentage
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        
        return { 
          name: property.name, // Remove percentage from name as we'll display it in custom legend
          population: value, 
          color: pieColors[idx % pieColors.length], 
          legendFontColor: modernColors.lightText, 
          legendFontSize: 10,
          percentage: percentage,
          propertyName: property.name // Store original name for custom legend
        };
      })
      .filter(item => item.population > 0);
  }, [propertyBreakdown, dataType, suffix, modernColors]);

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
    labelColor: () => modernColors.lightText,
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: currentDataType.color },
    propsForLabels: { fontSize: 10 },
    formatYLabel: (value) => {
      // Round to nearest hundred
      const num = Math.round(parseFloat(value) / 100) * 100;
      // Format with commas for thousands and pound prefix
      return `£${Math.round(num).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    },
    // Completely hide data labels on bars
    formatTopBarValue: () => '',
    // Ensure no data values are shown on bars
    showBarTops: false
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

  // Calculate pie chart width based on data
  const getPieChartContainerWidth = () => {
    return Math.max(screenWidth, pieData.length * 120); // Ensure enough width for the chart and legend
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{currentDataType.label}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={toggleDataType}>
          <Ionicons name={currentDataType.icon} size={18} color={currentDataType.color} />
          <Text style={[styles.buttonText, {color: currentDataType.color}]}>{currentDataType.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleChartType}>
          <Ionicons name={currentChartType.icon} size={18} color={currentDataType.color} />
          <Text style={[styles.buttonText, {color: currentDataType.color}]}>{currentChartType.label}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartArea}>
        {chartType === 'bar' && (
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
                chartConfig={{
                  ...chartConfig,
                  barPercentage: 0.6,
                  withInnerLines: true,
                  fillShadowGradientOpacity: 0.85,
                  useShadowColorFromDataset: false,
                  decimalPlaces: 0,
                  propsForBackgroundLines: {
                    strokeWidth: 1,
                    strokeDasharray: '',
                    stroke: 'rgba(56, 56, 56, 0.1)'
                  }
                }}
                decimalPlaces={0}
                formatYLabel={(value) => {
                  const num = Math.round(parseFloat(value));
                  return `£${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
                }}
                hideLegend={true}
                segments={5}
                paddingRight={80}
                withHorizontalLabels={true}
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
                chartConfig={{
                  ...chartConfig,
                  barPercentage: 0.6,
                  withInnerLines: true,
                  fillShadowGradientOpacity: 0.85,
                  useShadowColorFromDataset: false,
                  decimalPlaces: 0,
                  propsForBackgroundLines: {
                    strokeDasharray: '', // solid line
                    stroke: '#EEEEEE',
                    strokeWidth: 1
                  }
                }}
                style={styles.chart}
                fromZero
                verticalLabelRotation={30}
                showValuesOnTopOfBars={false} // Disable values on top of bars
                withHorizontalLabels={true}
                segments={5}
                yAxisInterval={1} // To show all horizontal lines
                hidePointsAtIndex={[]}
              />
            )}
          </ScrollView>
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
            withDots={true}
            withShadow={false}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
          />
        )}
        
        {chartType === 'pie' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            decelerationRate="fast"
            scrollEventThrottle={16}
            contentContainerStyle={[styles.scrollContainer, { width: getPieChartContainerWidth() }]}
          >
            <View style={styles.pieChartWithLegendContainer}>
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={pieData}
                  width={screenWidth * 0.6}
                  height={chartHeight}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  center={[screenWidth * 0.15, 0]} 
                  absolute
                  hasLegend={false} // Disable default legend
                  avoidFalseZero={true}
                />
              </View>
              
              <View style={styles.pieLegendContainer}>
                {pieData.map((item, index) => (
                  <View key={index} style={styles.pieLegendItem}>
                    <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
                    <View style={styles.legendTextContainer}>
                      <Text style={styles.legendPropertyName} numberOfLines={1} ellipsizeMode="tail">
                        {item.propertyName}
                      </Text>
                      <Text style={styles.legendValue}>
                        £{Math.round(item.population).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </Text>
                      <Text style={styles.legendPercentage}>
                        {item.percentage}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
      {/* Custom legend */}
      {(chartType === 'bar' || chartType === 'line') && dataType === 'monthly' && (
        <View style={styles.customLegendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColorBox, { backgroundColor: currentDataType.color }]} />
            <Text style={styles.legendLabel}>Net</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColorBox, { backgroundColor: currentDataType.secondaryColor }]} />
            <Text style={styles.legendLabel}>Expenses</Text>
          </View>
        </View>
      )}
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
    justifyContent: 'center',
    marginLeft: -20 // Adjust to prevent legend overflow
  },
  pieChartWithLegendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10
  },
  pieChartContainer: {
    width: screenWidth * 0.6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pieLegendContainer: {
    width: screenWidth * 0.4,
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#EEEEEE',
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 5
  },
  legendTextContainer: {
    flex: 1,
  },
  legendPropertyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 2
  },
  legendValue: {
    fontSize: 11,
    color: '#636E72',
    fontWeight: '500'
  },
  legendPercentage: {
    fontSize: 10,
    color: '#636E72',
    fontWeight: '400'
  },
  customLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6
  },
  legendColorBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 8
  },
  legendLabel: {
    fontSize: 10,
    color: '#636E72'
  }
}); 