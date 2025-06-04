import React, { useState, useRef } from 'react';
import {
    View,
    Pressable,
    TextInput,
    Text,
    StyleSheet,
    Platform,
    Keyboard,
    ScrollView,
    Animated
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getHousemates } from '@/context/utils';
import { supabase } from "../../lib/supabase";
import uuid from 'react-native-uuid'

const ExpensesScreen = () => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [paidBy, setPaidBy] = useState('you');
    const [splitMethod, setSplitMethod] = useState('equally');
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleAmountChange = (text) => {
        const regex = /^\d*(\.\d{0,2})?$/;
        if (regex.test(text) || text === '') {
            setAmount(text);
        }
    };

    const animateButton = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const addExpense = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        
        animateButton();
        
        console.log("Adding expense");
        let housemates = await getHousemates();
        console.log(housemates);

        const { data: { user } } = await supabase.auth.getUser();
        let payer = paidBy === 'you' ? user.id : housemates.find(h => h === paidBy);

        const uid = uuid.v4();

        for (const housemate of housemates) {
            const splitAmount = splitMethod === 'equally' ? parseFloat(amount) / (housemates.length + 1) : parseFloat(amount);
            const expenseData = {
                expense_id: uid,
                created_at: new Date().toISOString(),
                payer_id: payer,
                housemate_id: housemate,
                is_paid: false,
                amount: splitAmount,
                description: description || 'No description',
            };

            const { error } = await supabase
                .from('expenses')
                .insert(expenseData);

            if (error) {
                console.error('Error adding expense:', error);
            }
        }

        // Clear inputs after successful submission
        setAmount('');
        setDescription('');
    };

    const userOptions = [
        { label: 'You', value: 'you'},
    ];

    const splitOptions = [
        { label: 'Equally', value: 'equally' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Pressable onPress={Keyboard.dismiss} style={styles.pressableWrapper}>
                    {/* Top Inputs */}
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
                            placeholder="Add a note"
                            value={description}
                            onChangeText={setDescription}
                            textAlign="center"
                            placeholderTextColor="#aaa"
                        />
                    </View>

                    {/* Split-By + Add Button Inline */}
                    <View style={styles.splitAndButtonContainer}>
                        <View style={styles.splitDetailsContainer}>
                            <Text style={styles.splitText}>Paid by</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={paidBy}
                                    style={styles.picker}
                                    itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
                                    onValueChange={(itemValue) => setPaidBy(itemValue)}
                                    mode="dropdown"
                                >
                                    {userOptions.map((option) => (
                                        <Picker.Item 
                                            key={option.value} 
                                            label={option.label} 
                                            value={option.value} 
                                        />
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
                                    mode="dropdown"
                                >
                                    {splitOptions.map((option) => (
                                        <Picker.Item 
                                            key={option.value} 
                                            label={option.label} 
                                            value={option.value} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Pressable style={styles.addButton} onPress={addExpense}>
                                <Text style={styles.addButtonText}>＋</Text>
                            </Pressable>
                        </Animated.View>
                    </View>
                </Pressable>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        minHeight: '100%',
        justifyContent: 'flex-start',
    },
    pressableWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    inputSection: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '600',
        color: '#333',
        borderBottomWidth: Platform.OS === 'ios' ? 1 : 0,
        borderColor: '#e0e0e0',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 20,
        width: '80%',
        minHeight: 60,
        alignSelf: 'center',
    },
    descriptionInput: {
        fontSize: 20,
        fontWeight: '500',
        color: '#555',
        borderBottomWidth: Platform.OS === 'ios' ? 1 : 0,
        borderColor: '#e0e0e0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        width: '80%',
        minHeight: 50,
        alignSelf: 'center',
    },
    splitAndButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    splitDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',
        backgroundColor: '#f8f9fa',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        flex: 1,
    },
    splitText: {
        fontSize: 10,
        color: '#666',
        marginHorizontal: 4,
        fontWeight: '500',
        lineHeight: 24,
    },
    pickerContainer: {
        marginHorizontal: 4,
        ...(Platform.OS === 'ios' && {
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 6,
            overflow: 'hidden',
            backgroundColor: '#fff',
        }),
    },
    picker: {
        width: 75,
        height: Platform.OS === 'ios' ? 32 : 36,
        backgroundColor: Platform.OS === 'android' ? '#fff' : 'transparent',
        borderRadius: Platform.OS === 'android' ? 6 : 0,
    },
    pickerItem: {
        fontSize: 11,
        height: 32,
        color: '#333',
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        marginLeft: 12,
    },
    addButtonText: {
        fontSize: 24,
        fontWeight: '500',
        color: '#fff',
        lineHeight: 24,
    },
});

export default ExpensesScreen;
