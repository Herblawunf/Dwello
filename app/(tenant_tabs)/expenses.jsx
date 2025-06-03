import React, { useState } from 'react';
import {
    View,
    Pressable,
    TextInput,
    Text,
    StyleSheet,
    Platform,
    Keyboard
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const ExpensesScreen = () => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [paidBy, setPaidBy] = useState('you');
    const [splitMethod, setSplitMethod] = useState('equally');

    const handleAmountChange = (text) => {
        const regex = /^\d*(\.\d{0,2})?$/;
        if (regex.test(text) || text === '') {
            setAmount(text);
        }
    };

    const addExpense = () => {
        // Function to be implemented
    };

    const userOptions = [
        { label: 'You', value: 'you' },
        { label: 'Friend A', value: 'friend_a' },
        { label: 'Friend B', value: 'friend_b' },
    ];

    const splitOptions = [
        { label: 'Equally', value: 'equally' },
        { label: 'Unequally', value: 'unequally' },
        { label: 'By Percentage', value: 'percentage' },
        { label: 'By Shares', value: 'shares' },
    ];

    return (
        <Pressable style={styles.container} onPress={Keyboard.dismiss}>
            <View style={styles.inputSection}>
                <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={handleAmountChange}
                    textAlign="center"
                    placeholderTextColor="#aaa"
                />
                <TextInput
                    style={styles.descriptionInput}
                    placeholder="Enter description"
                    value={description}
                    onChangeText={setDescription}
                    textAlign="center"
                    placeholderTextColor="#aaa"
                />
            </View>
            
            <View style={styles.splitDetailsContainer}>
                <Text style={styles.splitText}>Paid by</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={paidBy}
                        style={styles.picker}
                        itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
                        onValueChange={(itemValue) => setPaidBy(itemValue)}
                        mode={Platform.OS === 'ios' ? 'dropdown' : 'dropdown'}
                    >
                        {userOptions.map((option) => (
                            <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                    </Picker>
                </View>
                <Text style={styles.splitText}>and split</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={splitMethod}
                        style={styles.picker}
                        itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
                        onValueChange={(itemValue) => setSplitMethod(itemValue)}
                        mode={Platform.OS === 'ios' ? 'dropdown' : 'dropdown'}
                    >
                        {splitOptions.map((option) => (
                            <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                    </Picker>
                </View>
            </View>
            
            <Pressable style={styles.addButton} onPress={addExpense}>
                <Text style={styles.addButtonText}>+</Text>
            </Pressable>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 60,
        backgroundColor: '#fff',
    },
    inputSection: {
        alignItems: 'center',
        width: '100%',
    },
    amountInput: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#333',
        borderBottomWidth: Platform.OS === 'ios' ? 1 : 0,
        borderColor: '#e0e0e0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 30,
        width: '85%',
        minHeight: 80,
    },
    descriptionInput: {
        fontSize: 24,
        fontWeight: '500',
        color: '#555',
        borderBottomWidth: Platform.OS === 'ios' ? 1 : 0,
        borderColor: '#e0e0e0',
        paddingVertical: 15,
        paddingHorizontal: 20,
        width: '85%',
        minHeight: 60,
    },
    splitDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        backgroundColor: '#f8f9fa',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginVertical: 20,
    },
    splitText: {
        fontSize: 16,
        color: '#666',
        marginHorizontal: 8,
        fontWeight: '500',
        lineHeight: Platform.OS === 'ios' ? 44 : undefined,
    },
    pickerContainer: {
        marginHorizontal: 8,
        ...(Platform.OS === 'ios' && {
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#fff',
        }),
    },
    picker: {
        width: 120,
        height: Platform.OS === 'ios' ? 44 : 40,
        backgroundColor: Platform.OS === 'android' ? '#fff' : 'transparent',
        borderRadius: Platform.OS === 'android' ? 8 : 0,
    },
    pickerItem: {
        fontSize: 16,
        height: 44,
        color: '#333',
    },
    addButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    addButtonText: {
        fontSize: 32,
        fontWeight: '300',
        color: '#fff',
        lineHeight: 32,
    },
});

export default ExpensesScreen;