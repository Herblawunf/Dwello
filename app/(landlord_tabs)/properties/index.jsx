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
      const { data, error } = await supabase.rpc("get_landlord_houses", {
        p_landlord_id: userId,
      });
      if (data) {
        setProperties(data);
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

  const renderProperty = ({ item }) => (
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
          source={{ uri: item.image_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTapw_XWWJYkuY2JzBMXZsmTWtaGHL3p60_kw&s' }}
          style={styles.propertyImage}
        />
        <View style={styles.propertyStatus}>
          <Text style={styles.propertyStatusText}>
            {item.num_tenants > 0 ? 'Occupied' : 'Vacant'}
          </Text>
        </View>
      </View>
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle}>{item.street_address}</Text>
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
        <TouchableOpacity style={styles.addButton}>
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
});
