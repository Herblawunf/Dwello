import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const getRentBalance = () => {
    return 1200.50; // Placeholder amount
};

const getNextRentDueDate = () => {
    // Placeholder date - for testing past date, set it to something like '2023-01-01'
    // return new Date('2023-01-01');
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth;
};

const handleRentPaid = () => {
    // Placeholder function for rent paid action
    console.log('Rent Paid button pressed');
};

const RentScreen = () => {
    const rentBalance = getRentBalance();
    const nextDueDate = getNextRentDueDate();
    const isPastDue = new Date(nextDueDate) < new Date() && nextDueDate.toDateString() !== new Date().toDateString();

    const formatDate = (date) => {
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Rent</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rent Balance Owed</Text>
                    <Text style={styles.amountText}>${rentBalance.toFixed(2)}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Next Rent Due</Text>
                    <Text style={[styles.dateText, isPastDue && styles.pastDueDate]}>
                        {formatDate(nextDueDate)}
                    </Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleRentPaid}>
                    <Text style={styles.buttonText}>Rent Paid</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#333',
    },
    section: {
        width: '100%',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 8,
    },
    amountText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#2c3e50',
    },
    dateText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#2c3e50',
    },
    pastDueDate: {
        color: '#e74c3c', // Red color for past due dates
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default RentScreen;