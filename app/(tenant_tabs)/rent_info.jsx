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
    const today = new Date();
    // Set to one month ago for testing past due date, or a future date
    // return new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    return new Date(today.getFullYear(), today.getMonth() + 1, 15); // Example: Next month's 15th
};

const handleRentPaid = () => {
    console.log('Rent Paid button pressed');
    Alert.alert('Action', 'Rent Paid action triggered.');
};

// Placeholder data for delay requests
const placeholderDelayRequests = [
    { id: '1', dateRequested: new Date(2024, 0, 15), days: 7, reason: 'Waiting for paycheck, it will arrive a few days late this month.', status: 'open' },
    { id: '2', dateRequested: new Date(2023, 11, 10), days: 5, reason: 'Unexpected car repair expenses.', status: 'accepted' },
    { id: '3', dateRequested: new Date(2023, 10, 5), days: 10, reason: 'The reason provided was insufficient for approval of such a long delay.', status: 'denied' },
    { id: '4', dateRequested: new Date(2024, 1, 20), days: 3, reason: 'Short business trip, will pay upon return.', status: 'open' },
];


const RentScreen = () => {
    const rentBalance = getRentBalance();
    const nextDueDate = getNextRentDueDate();
    const isPastDue = new Date(nextDueDate) < new Date() && nextDueDate.toDateString() !== new Date().toDateString();

    const [isDelayModalVisible, setIsDelayModalVisible] = useState(false);
    const [delayDays, setDelayDays] = useState('');
    const [delayReason, setDelayReason] = useState('');

    const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const formatDate = (date) => {
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleOpenDelayModal = () => {
        setIsDelayModalVisible(true);
    };

    const handleCloseDelayModal = () => {
        setIsDelayModalVisible(false);
        setDelayDays('');
        setDelayReason('');
    };

    const handleSubmitDelayRequest = () => {
        if (!delayDays.trim() || !delayReason.trim()) {
            Alert.alert('Validation Error', 'Please enter the number of days and a reason for the delay.');
            return;
        }
        console.log(`Rent delay requested for ${delayDays} days. Reason: ${delayReason}`);
        Alert.alert('Request Submitted', `Your request for a ${delayDays}-day rent delay has been submitted.`);
        // Here you would typically add the new request to your state/backend
        // For now, we just close the modal
        handleCloseDelayModal();
    };

    const handleOpenReasonModal = (request) => {
        // Show reason for 'open', 'accepted', or 'denied' statuses
        setSelectedRequest(request);
        setIsReasonModalVisible(true);
    };

    const handleCloseReasonModal = () => {
        setIsReasonModalVisible(false);
        setSelectedRequest(null);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'accepted':
                return <Text style={[styles.statusIcon, styles.statusIconAccepted]}>✓</Text>;
            case 'open':
                return <Text style={[styles.statusIcon, styles.statusIconOpen]}>⏳</Text>;
            case 'denied':
                return <Text style={[styles.statusIcon, styles.statusIconDenied]}>✕</Text>;
            default:
                return <Text style={styles.statusIcon}>?</Text>;
        }
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

                {/* Delay Request Log Section */}
                <View style={styles.logContainer}>
                    <Text style={styles.logTitle}>Delay Request History</Text>
                    {placeholderDelayRequests.length > 0 ? (
                        placeholderDelayRequests.map((request) => (
                            <TouchableOpacity
                                key={request.id}
                                style={styles.logItem}
                                onPress={() => handleOpenReasonModal(request)}
                            >
                                {getStatusIcon(request.status)}
                                <View style={styles.logItemTextContainer}>
                                    <Text style={styles.logItemTextPrimary}>
                                        {request.days} day(s) delay requested on {formatDate(request.dateRequested)}
                                    </Text>
                                    <Text style={styles.logItemTextSecondary}>
                                        Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </Text>
                                </View>
                                <Text style={styles.logItemChevron}>›</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noRequestsText}>No delay requests found.</Text>
                    )}
                </View>

                {/* Modal for Requesting Delay */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isDelayModalVisible}
                    onRequestClose={handleCloseDelayModal}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
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

                {/* Modal for Displaying Reason */}
                {selectedRequest && (
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={isReasonModalVisible}
                        onRequestClose={handleCloseReasonModal}
                    >
                        <View style={styles.reasonModalOverlay}>
                            <View style={styles.reasonModalView}>
                                <Text style={styles.reasonModalTitle}>Request Details</Text>
                                <Text style={styles.reasonModalDetail}>
                                    <Text style={styles.reasonModalDetailLabel}>Date Requested:</Text> {formatDate(selectedRequest.dateRequested)}
                                </Text>
                                <Text style={styles.reasonModalDetail}>
                                    <Text style={styles.reasonModalDetailLabel}>Days Requested:</Text> {selectedRequest.days}
                                </Text>
                                <Text style={styles.reasonModalDetail}>
                                    <Text style={styles.reasonModalDetailLabel}>Status:</Text> {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                                </Text>
                                <Text style={styles.reasonModalDetailLabel}>Reason:</Text>
                                <Text style={styles.reasonModalReasonText}>{selectedRequest.reason}</Text>
                                <TouchableOpacity
                                    style={styles.reasonModalCloseButton}
                                    onPress={handleCloseReasonModal}
                                >
                                    <Text style={styles.modalButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                )}
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
        // alignItems: 'center', // Keep for global centering if needed, but sections are width 100%
        // justifyContent: 'flex-start', // Removed to allow natural flow
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#333',
        textAlign: 'center',
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
        color: '#e74c3c',
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginTop: 10, // Adjusted margin
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#6c757d',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginTop: 15,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20, // Added margin before log
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
        padding: 25,
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
        color: '#333',
    },
    inputLabel: {
        fontSize: 14,
        color: '#444',
        marginBottom: 6,
        alignSelf: 'flex-start',
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 18,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    reasonInput: {
        height: 90,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    modalButton: {
        borderRadius: 8,
        paddingVertical: 14,
        elevation: 2,
        flex: 1,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
        marginRight: 8,
    },
    submitButton: {
        backgroundColor: '#007bff',
        marginLeft: 8,
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    // Styles for Delay Request Log
    logContainer: {
        width: '100%',
        marginTop: 10, // Space above the log section
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    logTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    logItemTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    logItemTextPrimary: {
        fontSize: 15,
        color: '#333',
        marginBottom: 2,
    },
    logItemTextSecondary: {
        fontSize: 13,
        color: '#666',
    },
    logItemChevron: {
        fontSize: 20,
        color: '#ccc',
    },
    statusIcon: {
        fontSize: 20,
        width: 24, // Ensure consistent width for alignment
        textAlign: 'center',
    },
    statusIconAccepted: {
        color: '#28a745', // Green
    },
    statusIconOpen: {
        color: '#fd7e14', // Orange
    },
    statusIconDenied: {
        color: '#dc3545', // Red
    },
    noRequestsText: {
        textAlign: 'center',
        color: '#777',
        paddingVertical: 10,
        fontSize: 15,
    },
    // Styles for Reason Display Modal
    reasonModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker overlay
    },
    reasonModalView: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 25,
        alignItems: 'stretch', // Changed from 'center' to 'stretch' for text alignment
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    reasonModalTitle: {
        fontSize: 20, // Slightly smaller than main modal title
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    reasonModalDetail: {
        fontSize: 16,
        color: '#444',
        marginBottom: 10,
    },
    reasonModalDetailLabel: {
        fontWeight: 'bold',
        color: '#333',
    },
    reasonModalReasonText: {
        fontSize: 15,
        color: '#555',
        marginTop: 5,
        marginBottom: 25,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#eee',
        minHeight: 60,
        textAlignVertical: 'top',
    },
    reasonModalCloseButton: {
        backgroundColor: '#007bff',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    // modalButtonText is reused for reasonModalCloseButton's text
});

export default RentScreen;