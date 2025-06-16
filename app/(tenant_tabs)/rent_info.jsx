import React, { useState, useEffect, useContext } from "react";
import { supabase } from "@/lib/supabase";
import { analyticsApi } from "@/lib/supabase";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const RentScreen = () => {
  const router = useRouter();
  const [rentInfo, setRentInfo] = useState({});
  const [rentExtensions, setRentExtensions] = useState([]);
  const [isDelayModalVisible, setIsDelayModalVisible] = useState(false);
  const [delayDays, setDelayDays] = useState("");
  const [delayReason, setDelayReason] = useState("");

  const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isContractTermsExpanded, setIsContractTermsExpanded] = useState(false);
  const [lateFees, setLateFees] = useState({
    dailyRate: 0,
    gracePeriod: 0,
    maxFee: 0
  });
  const [escalationClause, setEscalationClause] = useState({
    annualIncrease: 0,
    nextReviewDate: null
  });

  const {
    state: { userId },
  } = useContext(AuthContext);

  useEffect(() => {
    getRentInfo();
    getRentExtensions();
    getContractDetails();
  }, []);

  const getRentInfo = async () => {
    try {
      const { data: rentData, error } = await supabase.rpc(
        "get_tenant_payment_info",
        {
          p_tenant_id: userId,
        }
      );
      if (error) throw error;

      // Get active rent extension if any
      const { data: extensions } = await supabase.rpc("get_rent_extensions", {
        p_user_id: userId,
      });

      let nextPayment = new Date(rentData["0"].next_payment);

      // Check for accepted extensions with later dates
      if (extensions && extensions.length > 0) {
        const acceptedExtensions = extensions.filter(
          (ext) => ext.status === "accepted"
        );
        const latestExtension = acceptedExtensions.reduce((latest, ext) => {
          const extDate = new Date(ext.new_date);
          return extDate > latest ? extDate : latest;
        }, nextPayment);

        nextPayment = latestExtension;
      }

      const newRentData = {
        ...rentData["0"],
        next_payment: nextPayment.toISOString(),
        isPastDue: nextPayment <= new Date(),
      };

      setRentInfo(newRentData);
      console.log(newRentData);
    } catch (error) {
      console.error("Error in getRentInfo:", error);
    }
  };

  const getRentExtensions = async () => {
    try {
      const { data, error } = await supabase
        .from("rent_extensions")
        .select("*")
        .eq("tenant_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error in getRentExtensions:", error);
        throw error;
      }
      
      console.log("Rent extensions data:", data);
      setRentExtensions(data || []);
    } catch (error) {
      console.error("Error fetching rent extensions:", error);
      Alert.alert(
        "Error",
        "Failed to fetch rent extension history. Please try again later."
      );
    }
  };

  const getContractDetails = async () => {
    try {
      // Sample data for contract terms
      const sampleData = {
        late_fee_daily_rate: 15.00,
        late_fee_grace_period: 3,
        late_fee_max: 150.00,
        annual_rent_increase: 3.5,
        next_rent_review_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString() // 6 months from now
      };
      
      setLateFees({
        dailyRate: sampleData.late_fee_daily_rate,
        gracePeriod: sampleData.late_fee_grace_period,
        maxFee: sampleData.late_fee_max
      });
      
      setEscalationClause({
        annualIncrease: sampleData.annual_rent_increase,
        nextReviewDate: sampleData.next_rent_review_date
      });

      // Comment out the actual database call for now
      /*
      const { data, error } = await supabase.rpc("get_tenant_contract_details", {
        p_tenant_id: userId,
      });
      if (error) throw error;
      
      if (data) {
        setLateFees({
          dailyRate: data.late_fee_daily_rate || 0,
          gracePeriod: data.late_fee_grace_period || 0,
          maxFee: data.late_fee_max || 0
        });
        setEscalationClause({
          annualIncrease: data.annual_rent_increase || 0,
          nextReviewDate: data.next_rent_review_date
        });
      }
      */
    } catch (error) {
      console.error("Error fetching contract details:", error);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleOpenDelayModal = () => {
    setIsDelayModalVisible(true);
  };

  const handleCloseDelayModal = () => {
    setIsDelayModalVisible(false);
    setDelayDays("");
    setDelayReason("");
  };

  const handleSubmitDelayRequest = async () => {
    if (!delayDays.trim() || !delayReason.trim()) {
      Alert.alert(
        "Validation Error",
        "Please enter the number of days and a reason for the delay."
      );
      return;
    }

    try {
      const { data, error } = await supabase.rpc("create_rent_extension", {
        p_user_id: userId,
        p_days: parseInt(delayDays),
        p_reason: delayReason,
      });

      if (error) throw error;

      await getRentExtensions(); // Refresh the extensions list
      Alert.alert(
        "Request Submitted",
        `Your request for a ${delayDays}-day rent delay has been submitted.`
      );
      handleCloseDelayModal();
    } catch (error) {
      console.error("Error submitting delay request:", error);
      Alert.alert(
        "Error",
        "Failed to submit rent delay request. Please try again."
      );
    }
  };

  const handleOpenReasonModal = (request) => {
    // Show reason for 'open', 'accepted', or 'denied' statuses
    setSelectedRequest(request);
    setIsReasonModalVisible(true);
  };

  const handleCloseReasonModal = () => {
    setIsReasonModalVisible(false);
    setSelectedRequest(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "accepted":
        return (
          <Text style={[styles.statusIcon, styles.statusIconAccepted]}>✓</Text>
        );
      case "open":
        return (
          <Text style={[styles.statusIcon, styles.statusIconOpen]}>⏳</Text>
        );
      case "denied":
        return (
          <Text style={[styles.statusIcon, styles.statusIconDenied]}>✕</Text>
        );
      default:
        return <Text style={styles.statusIcon}>?</Text>;
    }
  };

  const handleRentPaid = async () => {
    if (!rentInfo.isPastDue) {
      Alert.alert(
        "Payment Not Due",
        "Rent payment is not due yet. Next payment is due on " +
          formatDate(new Date(rentInfo.next_payment))
      );
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      "Confirm Payment",
      "Are you sure you want to mark this rent as paid?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              // First update the next payment date
              const { data, error } = await supabase.rpc("update_next_payment", {
                p_user_id: userId,
              });
              
              if (error) throw error;
              
              // Get the property ID associated with this tenant
              const { data: tenantData, error: tenantError } = await supabase
                .from('tenants')
                .select('house_id')
                .eq('tenant_id', userId)
                .single();
                
              if (tenantError) throw tenantError;
              
              if (tenantData && tenantData.house_id) {
                const propertyId = tenantData.house_id;
                const rentAmount = rentInfo.monthly_rent * rentInfo.months_per_payment;
                
                // Update property analytics with the rent income
                console.log(`Adding rent payment to property_analytics: Property ID: ${propertyId}, Amount: ${rentAmount}`);
                
                await analyticsApi.updateAnalyticsForIncome(
                  propertyId, 
                  rentAmount,
                  'Rent'
                );
              }
              
              getRentInfo();
              Alert.alert("Success", "Rent payment recorded.");
            } catch (error) {
              console.error("Error processing rent payment:", error);
              Alert.alert("Error", "Failed to process payment. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Rent Information</Text>
          <View style={styles.backButton} />
        </View>

        {/* Main Balance Card */}
        <View style={styles.mainCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            £{rentInfo.isPastDue ? (rentInfo.monthly_rent * rentInfo.months_per_payment).toFixed(2) : "0.00"}
          </Text>
          <View style={styles.balanceDetails}>
            <View style={styles.balanceDetailItem}>
              <Text style={styles.detailLabel}>Next Payment</Text>
              <Text style={[styles.detailValue, rentInfo.isPastDue && styles.pastDueText]}>
                {formatDate(new Date(rentInfo.next_payment))}
              </Text>
            </View>
            <View style={styles.balanceDetailItem}>
              <Text style={styles.detailLabel}>Payment Frequency</Text>
              <Text style={styles.detailValue}>
                {rentInfo.months_per_payment === 1 ? "Monthly" : `Every ${rentInfo.months_per_payment} months`}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.primaryAction,
              !rentInfo.isPastDue && styles.disabledAction
            ]} 
            onPress={handleRentPaid}
            disabled={!rentInfo.isPastDue}
          >
            <Ionicons 
              name="checkmark-circle-outline" 
              size={24} 
              color={rentInfo.isPastDue ? colors.onPrimary : colors.disabled} 
            />
            <Text style={[
              styles.actionButtonText,
              !rentInfo.isPastDue && styles.disabledActionText
            ]}>Mark as Paid</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]} 
            onPress={handleOpenDelayModal}
          >
            <Ionicons name="time-outline" size={24} color={colors.onSecondary} />
            <Text style={[styles.actionButtonText, { color: colors.onSecondary }]}>Request Delay</Text>
          </TouchableOpacity>
        </View>

        {/* Contract Terms Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setIsContractTermsExpanded(!isContractTermsExpanded)}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Contract Terms</Text>
            </View>
            <Ionicons 
              name={isContractTermsExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          
          {isContractTermsExpanded && (
            <View style={styles.contractContent}>
              {/* Late Fees Section */}
              <View style={styles.contractSubsection}>
                <Text style={styles.subsectionTitle}>Late Payment Fees</Text>
                <View style={styles.contractDetailRow}>
                  <Text style={styles.contractDetailLabel}>Daily Rate</Text>
                  <Text style={styles.contractDetailValue}>£{lateFees.dailyRate.toFixed(2)}</Text>
                </View>
                <View style={styles.contractDetailRow}>
                  <Text style={styles.contractDetailLabel}>Grace Period</Text>
                  <Text style={styles.contractDetailValue}>{lateFees.gracePeriod} days</Text>
                </View>
                <View style={styles.contractDetailRow}>
                  <Text style={styles.contractDetailLabel}>Maximum Fee</Text>
                  <Text style={styles.contractDetailValue}>£{lateFees.maxFee.toFixed(2)}</Text>
                </View>
              </View>

              {/* Escalation Clause Section */}
              <View style={styles.contractSubsection}>
                <Text style={styles.subsectionTitle}>Rent Review</Text>
                <View style={styles.contractDetailRow}>
                  <Text style={styles.contractDetailLabel}>Annual Increase</Text>
                  <Text style={styles.contractDetailValue}>{escalationClause.annualIncrease}%</Text>
                </View>
                <View style={styles.contractDetailRow}>
                  <Text style={styles.contractDetailLabel}>Next Review</Text>
                  <Text style={styles.contractDetailValue}>
                    {escalationClause.nextReviewDate ? formatDate(new Date(escalationClause.nextReviewDate)) : 'Not scheduled'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Delay Request History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Delay Requests</Text>
            </View>
          </View>
          
          {rentExtensions.length > 0 ? (
            rentExtensions.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestItem}
                onPress={() => handleOpenReasonModal(request)}
              >
                <View style={styles.requestStatus}>
                  {getStatusIcon(request.status)}
                </View>
                <View style={styles.requestContent}>
                  <Text style={styles.requestTitle}>
                    {request.days} day{request.days !== 1 ? 's' : ''} delay requested
                  </Text>
                  <Text style={styles.requestDate}>
                    {formatDate(new Date(request.created_at))}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
              <Text style={styles.emptyStateText}>No delay requests</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for Requesting Delay */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDelayModalVisible}
        onRequestClose={handleCloseDelayModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>
                  Request Rent Payment Delay
                </Text>
                <Text style={styles.inputLabel}>
                  Number of Days for Extension
                </Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setDelayDays}
                  value={delayDays}
                  placeholder="e.g., 7"
                  keyboardType="numeric"
                />
                <Text style={styles.inputLabel}>Reason for Delay</Text>
                <TextInput
                  style={[styles.input, styles.reasonInput]}
                  onChangeText={setDelayReason}
                  value={delayReason}
                  placeholder="Briefly explain your reason"
                  multiline={true}
                  numberOfLines={3}
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCloseDelayModal}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleSubmitDelayRequest}
                  >
                    <Text style={styles.modalButtonText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal for Displaying Reason */}
      {selectedRequest && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={isReasonModalVisible}
          onRequestClose={handleCloseReasonModal}
        >
          <View style={styles.reasonModalOverlay}>
            <View style={styles.reasonModalView}>
              <Text style={styles.reasonModalTitle}>Request Details</Text>
              <Text style={styles.reasonModalDetail}>
                <Text style={styles.reasonModalDetailLabel}>
                  Date Requested:
                </Text>
                <Text>
                  {" "}
                  {formatDate(new Date(selectedRequest.created_at))}
                </Text>
              </Text>
              <Text style={styles.reasonModalDetail}>
                <Text style={styles.reasonModalDetailLabel}>
                  Days Requested:
                </Text>
                <Text> {selectedRequest.days}</Text>
              </Text>
              <Text style={styles.reasonModalDetail}>
                <Text style={styles.reasonModalDetailLabel}>Status:</Text>
                <Text>
                  {" "}
                  {selectedRequest.status.charAt(0).toUpperCase() +
                    selectedRequest.status.slice(1)}
                </Text>
              </Text>
              <Text style={styles.reasonModalDetailLabel}>Reason:</Text>
              <Text style={styles.reasonModalReasonText}>
                {selectedRequest.reason}
              </Text>
              <TouchableOpacity
                style={styles.reasonModalCloseButton}
                onPress={handleCloseReasonModal}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onBackground,
  },
  mainCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: colors.onBackground,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.placeholder,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 16,
  },
  balanceDetailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.placeholder,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.onSurface,
    fontWeight: '500',
  },
  pastDueText: {
    color: colors.error,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: colors.primary,
  },
  secondaryAction: {
    backgroundColor: colors.secondary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.onBackground,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
  },
  contractContent: {
    padding: 16,
  },
  contractSubsection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 12,
  },
  contractDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contractDetailLabel: {
    fontSize: 14,
    color: colors.placeholder,
  },
  contractDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  requestStatus: {
    width: 40,
    alignItems: 'center',
  },
  requestContent: {
    flex: 1,
    marginLeft: 12,
  },
  requestTitle: {
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 14,
    color: colors.placeholder,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.placeholder,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backdrop,
  },
  modalView: {
    width: "90%",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 25,
    alignItems: "stretch",
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
    color: colors.onSurface,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.placeholder,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.onSurface,
  },
  reasonInput: {
    height: 90,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 14,
    elevation: 2,
    flex: 1,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.secondary,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  modalButtonText: {
    color: colors.onPrimary,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  reasonModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backdrop,
  },
  reasonModalView: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 25,
    alignItems: "stretch",
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  reasonModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: colors.onSurface,
  },
  reasonModalDetail: {
    fontSize: 16,
    color: colors.placeholder,
    marginBottom: 10,
  },
  reasonModalDetailLabel: {
    fontWeight: "bold",
    color: colors.onSurface,
  },
  reasonModalReasonText: {
    fontSize: 15,
    color: colors.onSurface,
    marginTop: 5,
    marginBottom: 25,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.divider,
    minHeight: 60,
    textAlignVertical: "top",
  },
  reasonModalCloseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  statusIcon: {
    fontSize: 20,
    width: 24,
    textAlign: "center",
  },
  statusIconAccepted: {
    color: colors.success,
  },
  statusIconOpen: {
    color: colors.warning,
  },
  statusIconDenied: {
    color: colors.error,
  },
  disabledAction: {
    backgroundColor: colors.primary + '15', // 15% opacity of primary color
    borderWidth: 0,
  },
  disabledActionText: {
    color: colors.primary + '80', // 80% opacity of primary color
  },
});

export default RentScreen;
