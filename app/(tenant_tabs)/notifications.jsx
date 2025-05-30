import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';

const getUncompletedNotifications = () => {
    // Fake notifications data
    return [
        {
            id: '1',
            title: 'Rent Due Tomorrow',
            message: 'Your rent payment of $1,200 is due tomorrow.',
            timestamp: '2 hours ago',
            type: 'payment'
        },
        {
            id: '2',
            title: 'Maintenance Request Update',
            message: 'Your AC repair request has been scheduled for Friday.',
            timestamp: '5 hours ago',
            type: 'maintenance'
        },
        {
            id: '3',
            title: 'New Message',
            message: 'You have a new message from your landlord.',
            timestamp: '1 day ago',
            type: 'message'
        },
        {
            id: '4',
            title: 'Lease Renewal Notice',
            message: 'Your lease expires in 60 days. Contact us to renew.',
            timestamp: '2 days ago',
            type: 'lease'
        }
    ];
};

const NotificationItem = ({ item }) => (
    <View style={styles.notificationItem}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.timestamp}</Text>
    </View>
);

const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        setNotifications(getUncompletedNotifications());
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <FlatList
                data={notifications}
                renderItem={({ item }) => <NotificationItem item={item} />}
                keyExtractor={(item) => item.id}
                style={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    list: {
        flex: 1,
        paddingHorizontal: 20,
    },
    notificationItem: {
        backgroundColor: '#fff',
        padding: 16,
        marginVertical: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
});

export default NotificationsScreen;