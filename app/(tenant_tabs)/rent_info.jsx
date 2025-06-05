import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Modal,
    TextInput,
    Alert,
    Keyboard, // Import Keyboard
    TouchableWithoutFeedback // Import TouchableWithoutFeedback
} from 'react-native';

const getRentBalance = () => {
    return 1200.50; // Placeholder amount
};

const getNextRentDueDate = () => {
    // Placeholder date - for testing past date, set it to something like '2023-01-01'
    // return new Date('2023-01-01');
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
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

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [delayDays, setDelayDays] = useState('');
    const [delayReason, setDelayReason] = useState('');

    const formatDate = (date) => {
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleOpenDelayModal = () => {
        setIsModalVisible(true);
    };

    const handleCloseDelayModal = () => {
        setIsModalVisible(false);
        setDelayDays(''); // Reset fields on close
        setDelayReason('');
    };

    const handleSubmitDelayRequest = () => {
        if (!delayDays.trim() || !delayReason.trim()) {
            Alert.alert('Validation Error', 'Please enter the number of days and a reason for the delay.');
            return;
        }
        // Placeholder for submission logic
        console.log(`Rent delay requested for ${delayDays} days. Reason: ${delayReason}`);
        Alert.alert('Request Submitted', `Your request for a ${delayDays}-day rent delay has been submitted.`);
        handleCloseDelayModal();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Rent</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rent Balance Owed</Text>
                    <Text style={styles.amountText}>£{rentBalance.toFixed(2)}</Text>
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

                <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenDelayModal}>
                    <Text style={styles.secondaryButtonText}>Request Rent Delay</Text>
                </TouchableOpacity>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isModalVisible}
                    onRequestClose={handleCloseDelayModal}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                {/* This inner TouchableWithoutFeedback prevents taps inside the modal content from dismissing the keyboard */}
                                <View style={styles.modalView}>
                                    <Text style={styles.modalTitle}>Request Rent Payment Delay</Text>

                                    <Text style={styles.inputLabel}>Number of Days for Extension</Text>
                                    <TextInput
                                        style={styles.input}
                                        onChangeText={setDelayDays}
                                        value={delayDays}
                                        placeholder="e.g., 7"
                                        keyboardType="numeric"
                                    />

                                    <Text style={styles.inputLabel}>Reason for Delay</Text>
                                    <TextInput
                                        style={[styles.input, styles.reasonInput]}
                                        onChangeText={setDelayReason}
                                        value={delayReason}
                                        placeholder="Briefly explain your reason"
                                        multiline={true}
                                        numberOfLines={3}
                                    />

                                    <View style={styles.modalButtonContainer}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.cancelButton]}
                                            onPress={handleCloseDelayModal}
                                        >
                                            <Text style={styles.modalButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.submitButton]}
                                            onPress={handleSubmitDelayRequest}
                                        >
                                            <Text style={styles.modalButtonText}>Submit</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
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
    // Styles for delay request feature
    secondaryButton: {
        backgroundColor: '#6c757d', // Gray color for secondary action
        paddingVertical: 12, // Slightly smaller padding
        paddingHorizontal: 30,
        borderRadius: 8,
        marginTop: 15,
        width: '100%',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 25, // Increased padding for better spacing
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22, // Slightly larger modal title
        fontWeight: 'bold',
        marginBottom: 25, // Increased margin
        textAlign: 'center',
        color: '#333',
    },
    inputLabel: {
        fontSize: 14,
        color: '#444', // Darker label
        marginBottom: 6,
        alignSelf: 'flex-start',
    },
    input: {
        width: '100%',
        height: 50, // Increased height
        borderColor: '#ccc', // Slightly darker border
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 18, // Increased margin
        fontSize: 16,
        backgroundColor: '#fff', // White background for input
    },
    reasonInput: {
        height: 90, // Taller for multiline
        textAlignVertical: 'top',
        paddingTop: 12, // Adjust padding for text alignment
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15, // Adjusted margin
    },
    modalButton: {
        borderRadius: 8,
        paddingVertical: 14, // Increased padding
        elevation: 2,
        flex: 1, // Distribute space equally
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
        marginRight: 8, // Gap between buttons
    },
    submitButton: {
        backgroundColor: '#007bff',
        marginLeft: 8, // Gap between buttons
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default RentScreen;