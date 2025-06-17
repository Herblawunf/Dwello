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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useGlobalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import ExpenseModal from "@/app/components/ExpenseModal";
import { colors } from "@/app/theme/colors";

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
      
      // Sort tenants: those with open extensions first
      const sortedTenants = tenantData.sort((a, b) => {
        const aHasOpenExtension = a.rent_extensions?.some(ext => ext.status === 'open');
        const bHasOpenExtension = b.rent_extensions?.some(ext => ext.status === 'open');
        
        if (aHasOpenExtension && !bHasOpenExtension) return -1;
        if (!aHasOpenExtension && bHasOpenExtension) return 1;
        return 0;
      });
      
      setTenants(sortedTenants);
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
        style={[
          styles.tenantCard,
          hasOpenExtension && styles.tenantCardWithExtension
        ]}
      >
        <View style={styles.tenantInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.tenantName}>
              {item.users.first_name} {item.users.last_name}
            </Text>
            {hasOpenExtension && (
              <View style={styles.extensionBadge}>
                <Text style={styles.extensionText}>Open Extension</Text>
              </View>
            )}
          </View>
          <Text style={styles.tenantEmail}>{item.users.email}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.placeholder} />
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Property Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.propertyImageContainer}>
        <Image
          source={{ uri: property.image || 'https://gjfyiqdpysudxfiodvbf.supabase.co/storage/v1/object/public/houses//how-to-design-a-house.jpg' }}
          style={styles.propertyImage}
          onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
        />
        <View style={styles.propertyStatus}>
          <Text style={styles.propertyStatusText}>
            {tenants.length > 0 ? 'Occupied' : 'Vacant'}
          </Text>
        </View>
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
          <MaterialIcons name="add-circle-outline" size={18} color={colors.primary} />
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
              colors={[colors.primary]}
              tintColor={colors.primary}
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.onBackground,
  },
  propertyImageContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  propertyStatus: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  propertyStatusText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  propertyInfo: {
    backgroundColor: colors.surface,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyAddress: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.onSurface,
    marginBottom: 8,
  },
  propertyDetails: {
    fontSize: 16,
    color: colors.placeholder,
  },
  tenantsSection: {
    flex: 1,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.onBackground,
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
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tenantCardWithExtension: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurface,
    marginBottom: 4,
  },
  tenantEmail: {
    fontSize: 14,
    color: colors.placeholder,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  extensionBadge: {
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  extensionText: {
    color: colors.warning,
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
    backgroundColor: colors.primary + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  addExpenseText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
});
