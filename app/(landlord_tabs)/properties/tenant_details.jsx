import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useGlobalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDate } from "@/tools/formatDate";

export default function TenantDetails() {
  const insets = useSafeAreaInsets();
  const { tenantId } = useGlobalSearchParams();
  const [tenant, setTenant] = useState(null);

  const getTenantDetails = async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase.rpc("get_tenant_details", {
        p_tenant_id: tenantId,
      });
      if (data) {
        console.log(data);
        setTenant(data[0]);
        return;
      }
      console.error(error);
    } catch (error) {
      console.error("Error fetching tenant details:", error);
    }
  };

  useEffect(() => {
    getTenantDetails();
  }, []);

  if (!tenant) return null;

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
        <Text style={styles.headerTitle}>Tenant Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tenantInfo}>
        <Text style={styles.tenantName}>
          {tenant.first_name} {tenant.last_name}
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.tenantDetail}>Email: {tenant.email}</Text>
          <TouchableOpacity>
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.rentInfo}>
          <Text style={styles.rentTitle}>Rent Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.tenantDetail}>
              Monthly Rent: £{tenant.monthly_rent.toFixed(2)}
            </Text>
            <TouchableOpacity>
              <MaterialIcons name="edit" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.tenantDetail}>
              Payment Schedule: Every {tenant.months_per_payment} month
              {tenant.months_per_payment > 1 ? "s" : ""}
            </Text>
            <TouchableOpacity>
              <MaterialIcons name="edit" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.tenantDetail}>
              Next Payment: {formatDate(tenant.next_payment)}
            </Text>
            <TouchableOpacity>
              <MaterialIcons name="edit" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.documentsButton}
        onPress={() =>
          router.push({
            pathname: "/properties/secure_documents",
            params: { tenantId },
          })
        }
      >
        <MaterialIcons name="lock" size={24} color="#fff" />
        <Text style={styles.documentsButtonText}>View Secure Documents</Text>
      </TouchableOpacity>
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
  tenantInfo: {
    backgroundColor: "#fff",
    padding: 20,
    margin: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tenantName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  tenantDetail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  documentsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  documentsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  rentInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  rentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
});
