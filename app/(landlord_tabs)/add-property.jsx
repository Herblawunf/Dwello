import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AddPropertyScreen() {
  const router = useRouter();
  const [streetAddress, setStreetAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!streetAddress || !postcode) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('properties')
        .insert([
          {
            street_address: streetAddress,
            postcode: postcode,
            landlord_id: user.id
          }
        ]);

      if (error) throw error;
      
      alert('Property added successfully!');
      router.back();
    } catch (error) {
      alert('Error adding property: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Add Property",
          headerBackTitle: "Back",
        }} 
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={streetAddress}
              onChangeText={setStreetAddress}
              placeholder="Enter street address"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Postcode</Text>
            <TextInput
              style={styles.input}
              value={postcode}
              onChangeText={setPostcode}
              placeholder="Enter postcode"
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Adding...' : 'Add Property'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 