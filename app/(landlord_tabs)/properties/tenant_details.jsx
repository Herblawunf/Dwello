import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useGlobalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDate } from "@/tools/formatDate";
import { colors } from "@/app/theme/colors";

export default function TenantDetails() {
  const insets = useSafeAreaInsets();
  const { tenantId } = useGlobalSearchParams();
  const [tenant, setTenant] = useState(null);
  const [rentExtensions, setRentExtensions] = useState([]);
  const [denyModalVisible, setDenyModalVisible] = useState(false);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [denyReason, setDenyReason] = useState("");
  const [isRentInfoExpanded, setIsRentInfoExpanded] = useState(false);

  const getTenantDetails = async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase.rpc("get_tenant_details", {
        p_tenant_id: tenantId,
      });
      if (data) {
        console.log(data);
        setTenant(data[0]);
      }

      // Fetch rent extensions
      const { data: extensionsData, error: extensionsError } = await supabase
        .from("rent_extensions")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (extensionsError) throw extensionsError;
      setRentExtensions(extensionsData);
    } catch (error) {
      console.error("Error fetching tenant details:", error);
    }
  };

  const handleAcceptExtension = async (extensionId) => {
    try {
      const { data, error } = await supabase
        .from("rent_extensions")
        .update({ status: "accepted" })
        .eq("id", extensionId)
        .select();

      if (error) {
        console.error("Error accepting extension:", error);
        return;
      }

      console.log("Extension accepted:", data);
      setAcceptModalVisible(false);
      setSelectedExtension(null);
      getTenantDetails(); // Refresh data
    } catch (error) {
      console.error("Error accepting extension:", error);
    }
  };

  const handleDenyExtension = async () => {
    if (!denyReason.trim()) return;

    try {
      const { error } = await supabase
        .from("rent_extensions")
        .update({
          status: "denied",
          reason: denyReason,
        })
        .eq("id", selectedExtension.id);

      if (error) throw error;
      setDenyModalVisible(false);
      setDenyReason("");
      setSelectedExtension(null);
      getTenantDetails(); // Refresh data
    } catch (error) {
      console.error("Error denying extension:", error);
    }
  };

  useEffect(() => {
    getTenantDetails();
  }, []);

  const renderExtensionCard = (extension) => (
    <View key={extension.id} style={styles.extensionCard}>
      <View style={styles.extensionHeader}>
        <Text style={styles.extensionTitle}>Rent Extension Request</Text>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: 
              extension.status === "open"
                ? colors.warning + '15'
                : extension.status === "accepted"
                ? colors.success + '15'
                : colors.error + '15',
          }
        ]}>
          <Text
            style={[
              styles.extensionStatus,
              {
                color:
                  extension.status === "open"
                    ? colors.warning
                    : extension.status === "accepted"
                    ? colors.success
                    : colors.error,
              },
            ]}
          >
            {extension.status.charAt(0).toUpperCase() + extension.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.extensionDetails}>
        <Text style={styles.extensionDetail}>
          Requested on: {formatDate(extension.created_at)}
        </Text>
        <Text style={styles.extensionDetail}>
          Extension days: {extension.days}
        </Text>
        <Text style={styles.extensionDetail}>
          New date: {formatDate(extension.new_date)}
        </Text>
        <Text style={styles.extensionDetail}>Reason: {extension.reason}</Text>
        {extension.status === "denied" && (
          <Text style={[styles.extensionDetail, styles.deniedReason]}>
            Denial reason: {extension.reason}
          </Text>
        )}
      </View>

      {extension.status === "open" && (
        <View style={styles.extensionActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => {
              setSelectedExtension(extension);
              setAcceptModalVisible(true);
            }}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => {
              setSelectedExtension(extension);
              setDenyModalVisible(true);
            }}
          >
            <Text style={styles.actionButtonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tenant Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.tenantInfo}>
          <Text style={styles.tenantName}>
            {tenant.first_name} {tenant.last_name}
          </Text>
          <Text style={styles.tenantDetail}>Email: {tenant.email}</Text>
          <TouchableOpacity 
            style={styles.rentInfoHeader}
            onPress={() => setIsRentInfoExpanded(!isRentInfoExpanded)}
          >
            <Text style={styles.rentTitle}>Rent Information</Text>
            <MaterialIcons 
              name={isRentInfoExpanded ? "expand-less" : "expand-more"} 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          {isRentInfoExpanded && (
            <View style={styles.rentInfo}>
              <Text style={styles.tenantDetail}>
                Monthly Rent: £{tenant.monthly_rent.toFixed(2)}
              </Text>
              <Text style={styles.tenantDetail}>
                Payment Schedule: Every {tenant.months_per_payment} month
                {tenant.months_per_payment > 1 ? "s" : ""}
              </Text>
              <Text style={styles.tenantDetail}>
                Next Payment: {formatDate(tenant.next_payment)}
              </Text>
            </View>
          )}
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
          <MaterialIcons name="lock" size={24} color={colors.onPrimary} />
          <Text style={styles.documentsButtonText}>View Secure Documents</Text>
        </TouchableOpacity>

        {rentExtensions.length > 0 && (
          <View style={styles.extensionsSection}>
            <Text style={styles.sectionTitle}>Rent Extension Requests</Text>
            {rentExtensions.map(renderExtensionCard)}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={denyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDenyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deny Extension Request</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for denying this request:
            </Text>
            <TextInput
              style={styles.reasonInput}
              multiline
              numberOfLines={4}
              placeholder="Enter reason for denial..."
              value={denyReason}
              onChangeText={setDenyReason}
              placeholderTextColor={colors.placeholder}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDenyModalVisible(false);
                  setDenyReason("");
                  setSelectedExtension(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.onSurface }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmDenyButton]}
                onPress={handleDenyExtension}
              >
                <Text style={styles.modalButtonText}>Confirm Denial</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={acceptModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAcceptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Accept Extension Request</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to accept this rent extension request? This
              will extend the payment date to{" "}
              {selectedExtension && formatDate(selectedExtension.new_date)}.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setAcceptModalVisible(false);
                  setSelectedExtension(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.onSurface }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmAcceptButton]}
                onPress={() => handleAcceptExtension(selectedExtension.id)}
              >
                <Text style={styles.modalButtonText}>Confirm Acceptance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  tenantInfo: {
    backgroundColor: colors.surface,
    padding: 20,
    margin: 20,
    borderRadius: 16,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tenantName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.onSurface,
    marginBottom: 16,
  },
  tenantDetail: {
    fontSize: 16,
    color: colors.placeholder,
    marginBottom: 12,
  },
  documentsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    margin: 20,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  documentsButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  rentInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rentInfo: {
    marginTop: 16,
  },
  rentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.onSurface,
  },
  extensionsSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.onBackground,
    marginBottom: 16,
  },
  extensionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  extensionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  extensionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurface,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  extensionStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  extensionDetails: {
    marginBottom: 16,
  },
  extensionDetail: {
    fontSize: 14,
    color: colors.placeholder,
    marginBottom: 4,
  },
  deniedReason: {
    color: colors.error,
    marginTop: 8,
  },
  extensionActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  denyButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.onSurface,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.placeholder,
    marginBottom: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.divider,
  },
  confirmDenyButton: {
    backgroundColor: colors.error,
  },
  confirmAcceptButton: {
    backgroundColor: colors.success,
  },
  modalButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
