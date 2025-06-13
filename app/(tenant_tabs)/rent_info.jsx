import React, { useState, useEffect, useContext } from "react";
import { supabase } from "@/lib/supabase";
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
} from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";

const RentScreen = () => {
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

    try {
      const { data, error } = await supabase.rpc("update_next_payment", {
        p_user_id: userId,
      });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(error);
    }
    getRentInfo();
    Alert.alert("Success", "Rent payment recorded.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Rent Information</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rent Balance Owed</Text>
            <Text style={styles.amountText}>
              £
              {rentInfo.isPastDue
                ? rentInfo.monthly_rent.toFixed(2) * rentInfo.months_per_payment
                : 0}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Rent Due</Text>
            <Text
              style={[
                styles.dateText,
                rentInfo.isPastDue && styles.pastDueDate,
              ]}
            >
              {formatDate(new Date(rentInfo.next_payment))}
            </Text>
            <Text style={styles.frequencyText}>
              Paid every{" "}
              {rentInfo.months_per_payment === 1
                ? "month"
                : rentInfo.months_per_payment + " months"}
            </Text>
          </View>

          {/* Collapsible Contract Terms Section */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.contractHeader}
              onPress={() => setIsContractTermsExpanded(!isContractTermsExpanded)}
            >
              <Text style={styles.sectionTitle}>Contract Terms</Text>
              <Text style={styles.expandIcon}>
                {isContractTermsExpanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            
            {isContractTermsExpanded && (
              <>
                {/* Late Fees Section */}
                <View style={styles.contractSubsection}>
                  <Text style={styles.subsectionTitle}>Late Payment Fees</Text>
                  <View style={styles.contractDetailRow}>
                    <Text style={styles.contractDetailLabel}>Daily Rate:</Text>
                    <Text style={styles.contractDetailValue}>£{lateFees.dailyRate.toFixed(2)}</Text>
                  </View>
                  <View style={styles.contractDetailRow}>
                    <Text style={styles.contractDetailLabel}>Grace Period:</Text>
                    <Text style={styles.contractDetailValue}>{lateFees.gracePeriod} days</Text>
                  </View>
                  <View style={styles.contractDetailRow}>
                    <Text style={styles.contractDetailLabel}>Maximum Fee:</Text>
                    <Text style={styles.contractDetailValue}>£{lateFees.maxFee.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Escalation Clause Section */}
                <View style={styles.contractSubsection}>
                  <Text style={styles.subsectionTitle}>Rent Review</Text>
                  <View style={styles.contractDetailRow}>
                    <Text style={styles.contractDetailLabel}>Annual Increase:</Text>
                    <Text style={styles.contractDetailValue}>{escalationClause.annualIncrease}%</Text>
                  </View>
                  <View style={styles.contractDetailRow}>
                    <Text style={styles.contractDetailLabel}>Next Review:</Text>
                    <Text style={styles.contractDetailValue}>
                      {escalationClause.nextReviewDate ? formatDate(new Date(escalationClause.nextReviewDate)) : 'Not scheduled'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {!rentInfo.isPaid && (
            <TouchableOpacity style={styles.button} onPress={handleRentPaid}>
              <Text style={styles.buttonText}>Rent Paid</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenDelayModal}
          >
            <Text style={styles.secondaryButtonText}>Request Rent Delay</Text>
          </TouchableOpacity>

          {/* Delay Request Log Section */}
          <View style={styles.logContainer}>
            <Text style={styles.logTitle}>Delay Request History</Text>
            {rentExtensions.length > 0 ? (
              rentExtensions.map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={styles.logItem}
                  onPress={() => handleOpenReasonModal(request)}
                >
                  {getStatusIcon(request.status)}
                  <View style={styles.logItemTextContainer}>
                    <Text style={styles.logItemTextPrimary}>
                      {request.days} day(s) delay requested on{" "}
                      {formatDate(new Date(request.created_at))}
                    </Text>
                    <Text style={styles.logItemTextSecondary}>
                      Status:{" "}
                      {request.status.charAt(0).toUpperCase() +
                        request.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.logItemChevron}>›</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noRequestsText}>
                No delay requests found.
              </Text>
            )}
          </View>

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  frequencyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
    textAlign: "center",
  },
  section: {
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  amountText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2c3e50",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#2c3e50",
  },
  pastDueDate: {
    color: "#e74c3c",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10, // Adjusted margin
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 15,
    width: "100%",
    alignItems: "center",
    marginBottom: 20, // Added margin before log
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 25,
    alignItems: "stretch",
    shadowColor: "#000",
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
    color: "#333",
  },
  inputLabel: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: "#fff",
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
    backgroundColor: "#6c757d",
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: "#007bff",
    marginLeft: 8,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  // Styles for Delay Request Log
  logContainer: {
    width: "100%",
    marginTop: 10, // Space above the log section
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  logItemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  logItemTextPrimary: {
    fontSize: 15,
    color: "#333",
    marginBottom: 2,
  },
  logItemTextSecondary: {
    fontSize: 13,
    color: "#666",
  },
  logItemChevron: {
    fontSize: 20,
    color: "#ccc",
  },
  statusIcon: {
    fontSize: 20,
    width: 24, // Ensure consistent width for alignment
    textAlign: "center",
  },
  statusIconAccepted: {
    color: "#28a745", // Green
  },
  statusIconOpen: {
    color: "#fd7e14", // Orange
  },
  statusIconDenied: {
    color: "#dc3545", // Red
  },
  noRequestsText: {
    textAlign: "center",
    color: "#777",
    paddingVertical: 10,
    fontSize: 15,
  },
  // Styles for Reason Display Modal
  reasonModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Slightly darker overlay
  },
  reasonModalView: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 25,
    alignItems: "stretch", // Changed from 'center' to 'stretch' for text alignment
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  reasonModalTitle: {
    fontSize: 20, // Slightly smaller than main modal title
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  reasonModalDetail: {
    fontSize: 16,
    color: "#444",
    marginBottom: 10,
  },
  reasonModalDetailLabel: {
    fontWeight: "bold",
    color: "#333",
  },
  reasonModalReasonText: {
    fontSize: 15,
    color: "#555",
    marginTop: 5,
    marginBottom: 25,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#eee",
    minHeight: 60,
    textAlignVertical: "top",
  },
  reasonModalCloseButton: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  contractSubsection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
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
    color: '#666',
  },
  contractDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
  },
});

export default RentScreen;
