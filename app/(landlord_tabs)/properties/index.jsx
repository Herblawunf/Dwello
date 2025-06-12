import { useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Context as AuthContext } from "@/context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";

export default function Properties() {
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
      <Text style={styles.propertyTitle}>{item.street_address}</Text>
      <Text style={styles.propertyDetails}>Postcode: {item.postcode}</Text>
      <Text style={styles.propertyDetails}>Tenants: {item.num_tenants}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Properties</Text>
      </View>
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.house_id.toString()}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={getProperties} />
        }
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  propertyCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
});
