import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useGlobalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import ExpenseModal from "@/app/components/ExpenseModal";

export default function PropertyDetails() {
  const insets = useSafeAreaInsets();
  const { houseId } = useGlobalSearchParams();
  const [property, setProperty] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const getPropertyDetails = async () => {
    if (!houseId) return;
    setRefreshing(true);
    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from("houses")
        .select("*")
        .eq("house_id", houseId)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select(`
          tenant_id, 
          users(first_name, last_name, email),
          rent_extensions(
            id,
            status,
            created_at
          )
        `)
        .eq("house_id", houseId);

      if (tenantError) throw tenantError;
      setTenants(tenantData);
    } catch (error) {
      console.error("Error fetching property details:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExpenseAdded = () => {
    getPropertyDetails();
  };

  useEffect(() => {
    getPropertyDetails();
  }, []);

  const renderTenant = ({ item }) => {
    const hasOpenExtension = item.rent_extensions?.some(
      (extension) => extension.status === "open"
    );

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/properties/tenant_details",
            params: { tenantId: item.tenant_id },
          })
        }
        style={styles.tenantCard}
      >
        <View style={styles.tenantInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.tenantName}>
              {item.users.first_name} {item.users.last_name}
            </Text>
            {hasOpenExtension && (
              <Text style={styles.extensionIndicator}>- open rent extension request</Text>
            )}
          </View>
          <Text style={styles.tenantEmail}>{item.users.email}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#666" />
      </TouchableOpacity>
    );
  };

  if (!property) return null;

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
        <Text style={styles.headerTitle}>Property Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.propertyInfo}>
        <Text style={styles.propertyAddress}>{property.street_address}</Text>
        <Text style={styles.propertyDetails}>
          Postcode: {property.postcode}
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.addExpenseButton}
          onPress={() => setShowExpenseModal(true)}
        >
          <MaterialIcons name="add-circle-outline" size={18} color="#007AFF" />
          <Text style={styles.addExpenseText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tenantsSection}>
        <Text style={styles.sectionTitle}>Tenants</Text>
        <FlatList
          data={tenants}
          renderItem={renderTenant}
          keyExtractor={(item) => item.tenant_id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={getPropertyDetails}
            />
          }
          style={styles.tenantsList}
        />
      </View>

      <ExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        properties={property ? [{ id: property.house_id, name: property.street_address }] : []}
        onExpenseAdded={handleExpenseAdded}
      />
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
  propertyInfo: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyAddress: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  propertyDetails: {
    fontSize: 16,
    color: "#666",
  },
  tenantsSection: {
    flex: 1,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  tenantsList: {
    paddingHorizontal: 20,
  },
  tenantCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  tenantEmail: {
    fontSize: 14,
    color: "#666",
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extensionIndicator: {
    color: '#FFA500',
    fontSize: 12,
    fontWeight: '500',
  },
  actionContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e8ff',
  },
  addExpenseText: {
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
});
