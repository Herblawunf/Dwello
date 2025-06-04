import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    Modal, 
    FlatList,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView
} from 'react-native';
import { supabase } from '@/lib/supabase';

export default function Contact() {
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const reasons = [
        { label: 'General Inquiry', value: 'general' },
        { label: 'Maintenance request', value: 'maintenance' },
        { label: 'Other', value: 'other' },
    ];

    const handleSend = async () => {
        // Dismiss keyboard before showing alert
        Keyboard.dismiss();

        const { data: { user } } = await supabase.auth.getUser();

        const requestData = {
            user_id: user.id,
            reason: reason,
            description: message,
        }

        const { error } = await supabase
                        .from('requests')
                        .insert(requestData);
        
        if (error) {
            console.error('Error adding request:', error);
        }

        // Clear form
        setReason('');
        setMessage('');
        setAttachments([]);
        Alert.alert('Success', 'Message sent successfully!');
    };

    const handleAttachPicture = () => {
        Keyboard.dismiss();
        Alert.alert('Info', 'Picture attachment feature coming soon!');
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.container}>
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.title}>Contact your landlord</Text>
                    
                    <View style={styles.section}>
                        <Text style={styles.label}>Reason for Contact</Text>
                        <TouchableOpacity 
                            style={styles.dropdownButton} 
                            onPress={() => {
                                Keyboard.dismiss();
                                setShowDropdown(true);
                            }}
                        >
                            <Text style={styles.dropdownText}>
                                {reason ? reasons.find(r => r.value === reason)?.label : 'Select a reason...'}
                            </Text>
                            <Text style={styles.dropdownArrow}>▼</Text>
                        </TouchableOpacity>
                    </View>

                    <Modal
                        visible={showDropdown}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowDropdown(false)}
                    >
                        <TouchableOpacity 
                            style={styles.modalOverlay} 
                            onPress={() => setShowDropdown(false)}
                        >
                            <View style={styles.dropdownModal}>
                                <FlatList
                                    data={reasons}
                                    keyExtractor={(item) => item.value}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setReason(item.value);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownItemText}>{item.label}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    <View style={styles.section}>
                        <Text style={styles.label}>Message</Text>
                        <TextInput
                            style={styles.textInput}
                            multiline
                            numberOfLines={6}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Enter your message here..."
                            textAlignVertical="top"
                            returnKeyType="done"
                            blurOnSubmit={true}
                            onSubmitEditing={dismissKeyboard}
                        />
                    </View>

                    <TouchableOpacity style={styles.attachButton} onPress={handleAttachPicture}>
                        <Text style={styles.attachButtonText}>📎 Attach Pictures</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownModal: {
        backgroundColor: '#fff',
        borderRadius: 8,
        width: '80%',
        maxHeight: 300,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dropdownItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        minHeight: 120,
    },
    attachButton: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    attachButtonText: {
        fontSize: 16,
        color: '#666',
    },
    sendButton: {
        backgroundColor: '#000000',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});