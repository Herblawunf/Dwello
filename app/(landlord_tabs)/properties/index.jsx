import { useState, useCallback, useContext } from "react";
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
import { router } from "expo-router";
import { Context as AuthContext } from "@/context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";
import { colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { setOpenExtensions } from "../_layout";

export default function Properties() {
  const insets = useSafeAreaInsets();
  const [properties, setProperties] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const {
    state: { userId },
  } = useContext(AuthContext);

  const getProperties = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('houses')
        .select(`
          house_id,
          street_address,
          postcode,
          image,
          tenants!left(
            tenant_id,
            rent_extensions!left(
              status
            )
          )
        `)
        .eq('landlord_id', userId);

      if (data) {
        // Transform the data to match the expected format and sort by number of tenants
        const transformedData = data
          .map(house => ({
            ...house,
            num_tenants: house.tenants?.length || 0,
            has_open_extension: house.tenants?.some(tenant => 
              tenant.rent_extensions?.some(extension => extension.status === 'open')
            ) || false
          }))
          .sort((a, b) => b.num_tenants - a.num_tenants); // Sort in descending order
        
        // Update the global open extensions state
        const hasAnyOpenExtensions = transformedData.some(house => house.has_open_extension);
        setOpenExtensions(hasAnyOpenExtensions);
        
        console.log('Properties data:', JSON.stringify(transformedData, null, 2));
        setProperties(transformedData);
        return;
      }
      console.error(error);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      getProperties();
    }, [getProperties])
  );

  const renderProperty = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/properties/property_details",
            params: { houseId: item.house_id },
          })
        }
        style={styles.propertyCard}
      >
        <View style={styles.propertyImageContainer}>
          <Image
            source={{ uri: item.image || 'https://gjfyiqdpysudxfiodvbf.supabase.co/storage/v1/object/public/houses//how-to-design-a-house.jpg' }}
            style={styles.propertyImage}
            onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
          />
          <View style={styles.propertyStatus}>
            <Text style={styles.propertyStatusText}>
              {item.num_tenants > 0 ? 'Occupied' : 'Vacant'}
            </Text>
          </View>
        </View>
        <View style={styles.propertyInfo}>
          <View style={styles.titleContainer}>
            <Text style={styles.propertyTitle}>{item.street_address}</Text>
            {item.has_open_extension && (
              <View style={styles.extensionDot} />
            )}
          </View>
          <View style={styles.propertyDetailsContainer}>
            <View style={styles.propertyDetail}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={styles.propertyDetails}>{item.postcode}</Text>
            </View>
            <View style={styles.propertyDetail}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={styles.propertyDetails}>{item.num_tenants} Tenants</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>My Properties</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/add-property')}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.house_id.toString()}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={getProperties}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.onSurface,
  },
  addButton: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyImageContainer: {
    position: 'relative',
    height: 160,
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
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.onSurface,
    marginBottom: 8,
  },
  propertyDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  propertyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyDetails: {
    fontSize: 14,
    color: colors.placeholder,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extensionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
});
