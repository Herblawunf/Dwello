import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { Context as AuthContext } from "@/context/AuthContext";
import { useContext } from "react";

export default function TenantDocuments() {
  const insets = useSafeAreaInsets();
  const { state: { userId } } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .list(userId);

      if (error) throw error;

      // Filter for PDF files only
      const pdfFiles = data.filter(file => file.name.toLowerCase().endsWith('.pdf'));
      setDocuments(pdfFiles || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPress = (document) => {
    router.push({
      pathname: "/(tenant_tabs)/pdf_viewer",
      params: { documentName: document.name }
    });
  };

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Documents</Text>
        <View style={{ width: 24 }} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              fetchDocuments();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="folder-open" size={48} color="#999" />
          <Text style={styles.emptyText}>No documents found</Text>
        </View>
      ) : (
        <View style={styles.documentList}>
          {documents.map((doc) => (
            <TouchableOpacity
              key={doc.name}
              style={styles.documentItem}
              onPress={() => handleDocumentPress(doc)}
            >
              <View style={styles.documentInfo}>
                <MaterialIcons name="description" size={24} color="#007AFF" />
                <Text style={styles.documentName}>{doc.name}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
          <View style={{ height: 80 }} />
        </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  documentList: {
    padding: 16,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  documentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  documentName: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
}); 