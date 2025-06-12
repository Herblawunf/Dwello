import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import FinancialBarChart from "./data_analytics";
import { TouchableOpacity as RNTouchableOpacity } from "react-native";

export default function LandlordDashboardScreen() {
    const router = useRouter();

    // Placeholder data - replace with actual data fetching logic
    const [income, setIncome] = useState(5250.75);
    const [expenses, setExpenses] = useState(1105.30);
    const [rentDue, setRentDue] = useState(850.00);

    // Sample monthly stats for the stacked bar chart
    const [monthlyStats] = useState([
        { net: 1000, util: 400 }, // Jan
        { net: 1000, util: 550 }, // Feb
        { net: 900,  util: 300 }, // Mar
        { net: 1000, util: 350 }, // Apr
        { net: 700, util: 200 }, // May
        { net: 600, util: 200 }, // Jun
        { net: 900, util: 300 }, // Jul
        { net: 1100, util: 400 }, // Aug
        { net: 950, util: 350 }, // Sep
        { net: 1050, util: 500 }, // Oct
        { net: 1200, util: 600 }, // Nov
        { net: 1150, util: 450 }, // Dec
    ]);
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const handleGoToChat = () => {
        router.push("/chats");
    };

    const handleGoToAnalytics = () => {
        router.push("/analytics");
    };

    return (
        <View style={styles.container}>
            {/* HEADER WITH TITLE + CHAT ICON */}
            <View style={styles.topBar}>
                <Text style={styles.header}>dwello</Text>
                <TouchableOpacity onPress={handleGoToChat} style={styles.chatButton}>
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Horizontal Scroll Panel for Key Metrics */}
            <View style={styles.section}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                >
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryBoxTitle}>Monthly Income</Text>
                        <Text style={styles.summaryBoxAmount}>£{income.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryBoxTitle}>Monthly Expenses</Text>
                        <Text style={styles.summaryBoxAmount}>£{expenses.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryBoxTitle}>Upcoming Rent Due</Text>
                        <Text style={styles.summaryBoxAmount}>£{rentDue.toFixed(2)}</Text>
                    </View>
                </ScrollView>
            </View>

            {/* Financial Overview Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Overview</Text>
                <View style={{ alignItems: 'center', width: '100%' }}>
                  <FinancialBarChart
                    data={monthlyStats}
                    labels={monthLabels}
                    suffix="£"
                  />
                </View>
                <TouchableOpacity
                    style={styles.moreAnalyticsButton}
                    onPress={handleGoToAnalytics}
                >
                    <Text style={styles.moreAnalyticsText}>View detailed analytics</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 25,
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
    },
    chatButton: {
        padding: 10,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "500",
        color: "#333",
        marginBottom: 15,
    },
    scrollViewContent: {
        paddingVertical: 5,
    },
    summaryBox: {
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        padding: 20,
        marginRight: 15,
        width: 160,
        height: 110,
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    summaryBoxTitle: {
        fontSize: 14,
        fontWeight: "500",
        color: "#555",
    },
    summaryBoxAmount: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginTop: 8,
    },
    moreAnalyticsButton: {
        marginTop: 10,
        alignSelf: "center",
    },
    moreAnalyticsText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#007AFF",
    },
});