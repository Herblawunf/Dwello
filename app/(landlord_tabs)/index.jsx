import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function LandlordDashboard() {
    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                data: [4000, 4500, 3800, 5200, 4800, 5500, 5800, 5200, 4900, 5300, 4700, 6000],
                color: () => '#4CAF50', // Income - Green
            },
            {
                data: [2000, 2200, 1800, 2500, 2300, 2800, 2600, 2400, 2100, 2700, 2200, 2900],
                color: () => '#F44336', // Expenses - Red
            },
        ],
        legend: ['Income', 'Expenses'],
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>dwello</Text>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.scrollContainer}
            >
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Income</Text>
                    <Text style={styles.cardValue}>$6,000</Text>
                </View>
                
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Expenses</Text>
                    <Text style={styles.cardValue}>$2,900</Text>
                </View>
                
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Rent Due</Text>
                    <Text style={styles.cardValue}>$3,200</Text>
                </View>
            </ScrollView>

            <View style={styles.chartContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 0, paddingTop: 0 }}
                    contentContainerStyle={{ flexGrow: 0 }}
                >
                    <BarChart
                        data={chartData}
                        width={width * 2}
                        height={220}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        style={styles.chart}
                    />
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'left',
        marginBottom: 30,
    },
    scrollContainer: {
        marginBottom: 0,
    },
    card: {
        backgroundColor: '#fff',
        width: 120,
        height: 120,
        marginRight: 15,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    chartContainer: {
        alignItems: 'center',
        marginTop: 5,
        paddingTop: 5,
    },
    chart: {
        borderRadius: 12,
        marginTop: 5,
    },
});