import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchableOpacity } from '@/components/ThemedTouchableOpacity';
import { analyticsApi } from '@/lib/supabase';

const EXPENSE_CATEGORIES = [
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Utilities', value: 'utilities' },
  { label: 'Taxes', value: 'taxes' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Management', value: 'management' },
  { label: 'Renovations', value: 'renovations' },
  { label: 'Other', value: 'other' },
];

export default function ExpenseModal({ visible, onClose, properties, onExpenseAdded }) {
  // Form state
  const [propertyId, setPropertyId] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      
      if (properties && properties.length === 1) {
        // Auto-select if there's only one property
        setPropertyId(properties[0].id);
        setSelectedProperty(properties[0]);
      } else {
        setPropertyId('');
        setSelectedProperty(null);
      }
    }
  }, [visible, properties]);
  
  // Handle expense submission
  const handleSubmit = async () => {
    // Validate form
    if (!propertyId) {
      Alert.alert('Error', 'Please select a property');
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    
    setLoading(true);
    
    try {
      // Update analytics directly in property_analytics table
      const expenseAmount = parseFloat(amount);
      const expenseDate = date || new Date().toISOString().split('T')[0];
      const expenseType = category;
      
      console.log(`Adding expense directly to property_analytics: ${propertyId}, ${expenseAmount}, ${expenseType}`);
      
      // Get current date info for the record
      const expenseDateObj = new Date(expenseDate);
      const month = expenseDateObj.getMonth() + 1; // 1-12
      const year = expenseDateObj.getFullYear();
      
      // Get property name
      let propertyName = "";
      if (properties && properties.length > 0) {
        const property = properties.find(p => p.id === propertyId);
        propertyName = property ? property.name : "Unknown Property";
      }
      
      // First try to find an existing record for this property/month/year
      const { data: existingRecord, error: findError } = await analyticsApi.supabase
        .from('property_analytics')
        .select('*')
        .eq('property_id', propertyId)
        .eq('month', month)
        .eq('year', year)
        .single();
      
      let response = { success: false };
      
      if (findError || !existingRecord) {
        // No record exists - create a new one
        const newRecord = {
          property_id: propertyId,
          property_name: propertyName,
          record_date: expenseDate,
          month: month,
          year: year,
          gross_income: 0, // Start with 0 income
          total_expenses: expenseAmount,
          net_profit: -expenseAmount, // Negative since it's just an expense
          // Add expense to maintenance costs if it's a maintenance expense
          maintenance_costs: expenseType.toLowerCase().includes('maintenance') ? expenseAmount : 0,
          tenant_satisfaction: 90, // Default value
          occupancy_rate: 95, // Default value
        };
        
        const { data, error } = await analyticsApi.supabase
          .from('property_analytics')
          .insert(newRecord)
          .select();
          
        if (error) {
          console.error("Error creating new analytics record:", error);
          throw new Error(error.message || "Failed to create analytics record");
        }
        
        response = { success: true, data };
      } else {
        // Update existing record
        const updatedRecord = {
          total_expenses: existingRecord.total_expenses + expenseAmount,
          net_profit: existingRecord.net_profit - expenseAmount,
        };
        
        // If it's a maintenance expense, update that field too
        if (expenseType.toLowerCase().includes('maintenance')) {
          updatedRecord.maintenance_costs = (existingRecord.maintenance_costs || 0) + expenseAmount;
        }
        
        const { data, error } = await analyticsApi.supabase
          .from('property_analytics')
          .update(updatedRecord)
          .eq('id', existingRecord.id)
          .select();
          
        if (error) {
          console.error("Error updating analytics record:", error);
          throw new Error(error.message || "Failed to update analytics record");
        }
        
        response = { success: true, data };
      }
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Expense added successfully',
          [{ text: 'OK', onPress: () => {
            onClose();
            if (onExpenseAdded) onExpenseAdded();
          }}]
        );
      } else {
        throw new Error(response.error || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Select property handler
  const handleSelectProperty = (property) => {
    setPropertyId(property.id);
    setSelectedProperty(property);
    setShowProperties(false);
  };
  
  // Select category handler
  const handleSelectCategory = (categoryItem) => {
    setCategory(categoryItem.value);
    setShowCategories(false);
  };
  
  // Format amount to always show 2 decimal places
  const formatAmount = (text) => {
    // Remove non-numeric characters except decimal point
    let formatted = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = formatted.split('.');
    if (parts.length > 2) {
      formatted = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setAmount(formatted);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Expense</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.formContainer}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Property Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Property</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowProperties(true)}
                disabled={loading}
              >
                <Text style={selectedProperty ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {selectedProperty ? selectedProperty.name : 'Select property...'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              
              {/* Property Selection Modal */}
              <Modal
                visible={showProperties}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowProperties(false)}
              >
                <TouchableOpacity 
                  style={styles.dropdownOverlay}
                  activeOpacity={1}
                  onPress={() => setShowProperties(false)}
                >
                  <View style={styles.dropdownMenu}>
                    {properties && properties.length > 0 ? (
                      properties.map((property) => (
                        <TouchableOpacity
                          key={property.id}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectProperty(property)}
                        >
                          <Text style={styles.dropdownItemText}>{property.name}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noDataText}>No properties available</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
            
            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>£</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={formatAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            </View>
            
            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowCategories(true)}
                disabled={loading}
              >
                <Text style={category ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {category ? EXPENSE_CATEGORIES.find(c => c.value === category)?.label : 'Select category...'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              
              {/* Category Selection Modal */}
              <Modal
                visible={showCategories}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCategories(false)}
              >
                <TouchableOpacity 
                  style={styles.dropdownOverlay}
                  activeOpacity={1}
                  onPress={() => setShowCategories(false)}
                >
                  <View style={styles.dropdownMenu}>
                    {EXPENSE_CATEGORIES.map((categoryItem) => (
                      <TouchableOpacity
                        key={categoryItem.value}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectCategory(categoryItem)}
                      >
                        <Text style={styles.dropdownItemText}>{categoryItem.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
            
            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter expense details..."
                multiline={true}
                numberOfLines={4}
                editable={!loading}
              />
            </View>
            
            {/* Date - using text input for simplicity */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                editable={!loading}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <ThemedTouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </ThemedTouchableOpacity>
            
            <ThemedTouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
              lightColor="#007AFF"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Add Expense</Text>
              )}
            </ThemedTouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    maxHeight: '70%',
  },
  formContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  currencySymbol: {
    fontSize: 16,
    paddingHorizontal: 12,
    color: '#333',
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    width: '80%',
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  noDataText: {
    padding: 16,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.7,
  },
}); 