import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// import { supabase } from "@/lib/supabase"; // Uncomment if you need to fetch data

export default function LandlordDashboardScreen() {
    const router = useRouter();

    // Placeholder data - replace with actual data fetching logic
    const [income, setIncome] = useState(5250.75);
    const [expenses, setExpenses] = useState(1105.30);
    const [rentDue, setRentDue] = useState(850.00);

    // Example data fetching function (replace with your actual logic)
    // useEffect(() => {
    //   const fetchDashboardData = async () => {
    //     try {
    //       // const { data: incomeData, error: incomeError } = await supabase.rpc('get_total_income');
    //       // const { data: expensesData, error: expensesError } = await supabase.rpc('get_total_expenses');
    //       // const { data: rentDueData, error: rentDueError } = await supabase.rpc('get_total_rent_due');
    //       // if (incomeData) setIncome(incomeData.total_income);
    //       // if (expensesData) setExpenses(expensesData.total_expenses);
    //       // if (rentDueData) setRentDue(rentDueData.total_rent_due);
    //       // Handle errors as needed
    //     } catch (error) {
    //       console.error("Failed to fetch dashboard data:", error);
    //     }
    //   };
    //   fetchDashboardData();
    // }, []);

    const handleGoToChat = () => {
        router.push("/chats"); // Adjust route if necessary
    };

    const handleGoToAnalytics = () => {
        router.push("/analytics"); // Route for analytics page
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

            {/* Bar Chart Placeholder Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Overview</Text>
                <TouchableOpacity
                    style={styles.barChartPlaceholder}
                    onPress={handleGoToAnalytics}
                >
                    <Ionicons name="bar-chart-outline" size={60} color="#E0E0E0" />
                    <Text style={styles.barChartText}>Tap to view detailed analytics</Text>
                </TouchableOpacity>
            </View>

            {/* Optional: Quick Actions for Landlord */}
            {/*
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/landlord/properties')}>
                        <Ionicons name="business-outline" size={24} color="#666" />
                        <Text style={styles.actionText}>Properties</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/landlord/tenants')}>
                        <Ionicons name="people-outline" size={24} color="#666" />
                        <Text style={styles.actionText}>Tenants</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/landlord/maintenance')}>
                        <Ionicons name="build-outline" size={24} color="#666" />
                        <Text style={styles.actionText}>Maintenance</Text>
                    </TouchableOpacity>
                </View>
            </View>
            */}
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
        marginTop: 20,
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 25,
    },
    header: {
        fontSize: 28,
        fontWeight: "300", // Matching tenant style
        fontWeight: "bold", // Matching tenant style (this will likely take precedence)
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
        textAlign: "left", 
        marginTop: 8,
    },
    barChartPlaceholder: {
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        padding: 20,
        height: 220,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EDEDED", 
    },
    barChartText: {
        marginTop: 15,
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
    },
    quickActionsContainer: {
        flexDirection: "row",
        justifyContent: "space-around", 
        flexWrap: "wrap",
    },
    actionButton: {
        width: "30%", 
        aspectRatio: 1.1, 
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    actionText: {
        fontSize: 12,
        color: "#555",
        textAlign: "center",
        marginTop: 8,
        fontWeight: "500",
    },
});