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
    const [paidBy, setPaidBy] = useState('you');
    const [splitMethod, setSplitMethod] = useState('equally');

    const handleAmountChange = (text) => {
        const regex = /^\d*(\.\d{0,2})?$/;
        if (regex.test(text) || text === '') {
            setAmount(text);
        }
    };

    const userOptions = [
        { label: 'You', value: 'you' },
    ];

    const splitOptions = [
        { label: 'Equally', value: 'equally' },
    ];

    return (
        <Pressable style={styles.container} onPress={Keyboard.dismiss}>
            <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={handleAmountChange}
                textAlign="center"
                placeholderTextColor="#aaa"
            />
            <View style={styles.splitDetailsContainer}>
                <Text style={styles.splitText}>Paid by</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={paidBy}
                        style={styles.picker}
                        itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
                        onValueChange={(itemValue) => setPaidBy(itemValue)}
                        mode={Platform.OS === 'ios' ? 'dropdown' : 'dropdown'} // Explicitly set mode
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
                        mode={Platform.OS === 'ios' ? 'dropdown' : 'dropdown'} // Explicitly set mode
                    >
                        {splitOptions.map((option) => (
                            <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                    </Picker>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    amountInput: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#333',
        borderBottomWidth: Platform.OS === 'ios' ? 1 : 0,
        borderColor: '#ddd',
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 40,
        width: '80%',
        minHeight: 80,
    },
    splitDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    splitText: {
        fontSize: 18,
        color: '#555',
        marginHorizontal: 5,
        lineHeight: Platform.OS === 'ios' ? 44 : undefined, // Match picker height
    },
    pickerContainer: {
        marginHorizontal: 5,
        // Simplified container styling for iOS
        ...(Platform.OS === 'ios' && {
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            overflow: 'hidden', // Ensure picker respects container bounds
        }),
    },
    picker: {
        width: 130,
        // Fixed height for both platforms to ensure touch area
        height: Platform.OS === 'ios' ? 44 : 40,
        backgroundColor: Platform.OS === 'android' ? '#f0f0f0' : 'transparent',
        borderRadius: Platform.OS === 'android' ? 8 : 0,
    },
    pickerItem: {
        // iOS picker item styling
        fontSize: 16,
        height: 44, // Standard iOS touch target height
        color: '#333',
    },
});

export default ExpensesScreen;