import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useGlobalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import * as WebBrowser from 'expo-web-browser';

export default function SecureDocuments() {
  const insets = useSafeAreaInsets();
  const { tenantId } = useGlobalSearchParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDocuments = async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .list(tenantId);

      if (error) {
        console.error('Error fetching documents:', error);
        Alert.alert('Error', 'Failed to fetch documents');
        return;
      }

      // Filter for PDF files only
      const pdfFiles = data.filter(file => file.name.toLowerCase().endsWith('.pdf'));
      setDocuments(pdfFiles);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDocuments();
  }, [tenantId]);

  const handleDocumentPress = async (document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(`${tenantId}/${document.name}`, 60); // URL valid for 60 seconds

      if (error) throw error;

      // Open the PDF in the device's browser
      await WebBrowser.openBrowserAsync(data.signedUrl);
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const renderDocument = ({ item }) => (
    <TouchableOpacity
      style={styles.documentItem}
      onPress={() => handleDocumentPress(item)}
    >
      <MaterialIcons name="description" size={24} color="#007AFF" />
      <Text style={styles.documentName}>{item.name}</Text>
      <MaterialIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Documents</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="folder-open" size={48} color="#666" />
          <Text style={styles.emptyText}>No documents found</Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 20,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
}); 