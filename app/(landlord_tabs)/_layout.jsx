import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            {/* Header */}
            <Text style={styles.header}>dwello</Text>
            
            {/* Balance Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Balance due</Text>
                <Text style={styles.balanceAmount}>£1,247.50</Text>
            </View>
            
            {/* Splits Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Splits</Text>
                <Text style={styles.smallText}>3 outstanding expenses</Text>
            </View>
            
            {/* Notifications Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <Text style={styles.notificationText}>Rent payment due in 3 days</Text>
            </View>
            
            {/* Quick Actions Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick actions</Text>
                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="build-outline" size={24} color="#666" />
                        <Text style={styles.actionText}>Report repair</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="add-circle-outline" size={24} color="#666" />
                        <Text style={styles.actionText}>Add expenses</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="document-text-outline" size={24} color="#666" />
                        <Text style={styles.actionText}>View documents</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
        paddingTop: 60,
    },
    header: {
        fontSize: 28,
        fontWeight: '300',
        color: '#333',
        marginBottom: 40,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
        marginBottom: 10,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: '600',
        color: '#333',
    },
    smallText: {
        fontSize: 14,
        color: '#666',
    },
    notificationText: {
        fontSize: 16,
        color: '#333',
    },
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    actionButton: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
});