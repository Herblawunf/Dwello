import React, { useState, useRef, useCallback, useContext } from "react";
import {
  View,
  Pressable,
  TextInput,
  Text,
  StyleSheet,
  Platform,
  Keyboard,
  ScrollView,
  Animated,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";
import { getHousemates } from "@/context/utils";
import { supabase } from "../../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { responsiveFontSize } from "@/tools/fontscaling";
import uuid from "react-native-uuid";

const ExpensesScreen = () => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState("you");
  const [splitMethod, setSplitMethod] = useState("equally");
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { state: authState } = useContext(AuthContext);
  const userId = authState.userId;
  const [housemateBalances, setHousemateBalances] = useState([]);
  const [selectedHousemate, setSelectedHousemate] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);
  const [showSplitDropdown, setShowSplitDropdown] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getBalances();
    }, [getBalances])
  );

  const handlePaymentConfirmation = (confirmed, id) => {
    setShowPaymentModal(false);
    if (confirmed) {
      markExpenses(id);
      getBalances();
    }
    setSelectedHousemate(null);
  };

  const getBalances = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_housemate_balances", {
        p_user_id: userId,
      });
      if (data) {
        setHousemateBalances(data);
        return;
      }
      console.log(error);
    } catch (error) {
      console.log(error);
    }
  }, [userId]);

  const markExpenses = async (otherId) => {
    try {
      const { data, error } = await supabase.rpc("mark_expenses_paid", {
        p_user1: userId,
        p_user2: otherId,
      });
      console.log(data);
      if (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Helper function to format balance display and text
  const formatBalanceText = (balance) => {
    if (balance > 0) {
      return `Owes you: £${balance.toFixed(2)}`;
    } else if (balance < 0) {
      return `You owe: £${Math.abs(balance).toFixed(2)}`;
    } else {
      return `Settled up: £0.00`;
    }
  };

  const handleAmountChange = (text) => {
    const regex = /^\d*(\.\d{0,2})?$/;
    if (regex.test(text) || text === "") {
      setAmount(text);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const addExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    animateButton();

    console.log("Adding expense");
    let housemates = await getHousemates();
    console.log(housemates);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    let payer =
      paidBy === "you" ? user.id : housemates.find((h) => h === paidBy);

    const uid = uuid.v4();

    for (const housemate of housemates) {
      const splitAmount =
        splitMethod === "equally"
          ? parseFloat(amount) / (housemates.length + 1)
          : parseFloat(amount);
      const expenseData = {
        expense_id: uid,
        payer_id: payer,
        housemate_id: housemate,
        is_paid: false,
        amount: splitAmount,
        description: description || "No description",
      };

      const { error } = await supabase.from("expenses").insert(expenseData);

      if (error) {
        console.error("Error adding expense:", error);
      }
    }

    setAmount("");
    setDescription("");
    getBalances();
  };

  const userOptions = [{ label: "You", value: "you" }];

  const splitOptions = [{ label: "Equally", value: "equally" }];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={Keyboard.dismiss} style={styles.pressableWrapper}>
          <Text style={styles.title}>Add expense</Text>
          {/* Top Inputs */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={handleAmountChange}
              textAlign="center"
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add a note"
              value={description}
              onChangeText={setDescription}
              textAlign="center"
              placeholderTextColor="#aaa"
            />
          </View>

          {/* Split-By + Add Button Inline */}
          <View style={styles.splitAndButtonContainer}>
            <View style={styles.splitDetailsContainer}>
              <Text style={styles.splitText}>Paid by</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowPaidByDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {userOptions.find((opt) => opt.value === paidBy)?.label || "You"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.splitText}>and split</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSplitDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {
                    splitOptions.find((opt) => opt.value === splitMethod)
                      ?.label || "Equally"
                  }
                </Text>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable style={styles.addButton} onPress={addExpense}>
                <Text style={styles.addButtonText}>＋</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Pressable>

        {/* Housemate Balances Section */}
        <View style={styles.balancesSection}>
          <Text style={styles.balancesTitle}>Housemate Balances</Text>
          <ScrollView
            style={styles.balancesScrollView}
            contentContainerStyle={styles.balancesScrollContent}
          >
            {housemateBalances.length > 0 ? (
              housemateBalances.map((hm) => (
                <TouchableOpacity
                  key={hm.id}
                  style={styles.balanceItem}
                  onPress={() => {
                    if (hm.balance < 0) {
                      setSelectedHousemate(hm);
                      setShowPaymentModal(true);
                    }
                  }}
                  disabled={hm.balance >= 0}
                >
                  <Text style={styles.housemateName}>{hm.first_name}</Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      hm.balance > 0
                        ? styles.positiveBalance
                        : hm.balance < 0
                        ? styles.negativeBalance
                        : styles.neutralBalance,
                      hm.balance < 0 && styles.clickableBalance,
                    ]}
                  >
                    {formatBalanceText(hm.balance)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noBalancesText}>
                No housemate balances to show yet.
              </Text>
            )}
          </ScrollView>

          {/* Payment Confirmation Modal */}
          <Modal
            visible={showPaymentModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowPaymentModal(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={() => setShowPaymentModal(false)}
              activeOpacity={1}
            >
              <View style={styles.dropdownModal}>
                {/* Text at the top */}
                <Text style={styles.modalText}>
                  Have you paid £
                  {Math.abs(selectedHousemate?.balance).toFixed(2)} to{" "}
                  {selectedHousemate?.first_name}?
                </Text>

                {/* Two button options */}
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() =>
                      handlePaymentConfirmation(true, selectedHousemate?.id)
                    }
                  >
                    <Text style={styles.modalButtonText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() =>
                      handlePaymentConfirmation(false, selectedHousemate?.id)
                    }
                  >
                    <Text style={styles.modalButtonText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Paid By Dropdown Modal */}
          <Modal
            visible={showPaidByDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowPaidByDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowPaidByDropdown(false)}
            >
              <View style={styles.dropdownList}>
                {userOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setPaidBy(option.value);
                      setShowPaidByDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Split Method Dropdown Modal */}
          <Modal
            visible={showSplitDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowSplitDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowSplitDropdown(false)}
            >
              <View style={styles.dropdownList}>
                {splitOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSplitMethod(option.value);
                      setShowSplitDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 40, // Ensure space at the bottom for scroll
    alignItems: "center", // This centers children like pressableWrapper and balancesSection
    // minHeight: '100%', // Can be removed if content naturally fills height or scrolling is desired
    // justifyContent: 'flex-start', // Default, good
  },
  pressableWrapper: {
    width: "100%", // Takes full width available from scrollContent's padding
    alignItems: "center", // Centers its own children if they don't have full width
    marginBottom: 20, // Add some space before the balances section
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 30,
    alignSelf: "flex-start",
    paddingHorizontal: 5,
  },
  inputSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "600",
    color: "#333",
    borderBottomWidth: Platform.OS === "ios" ? 1 : 0,
    borderColor: "#e0e0e0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    width: "80%",
    minHeight: 60,
    alignSelf: "center",
  },
  descriptionInput: {
    fontSize: 20,
    fontWeight: "500",
    color: "#555",
    borderBottomWidth: Platform.OS === "ios" ? 1 : 0,
    borderColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "80%",
    minHeight: 50,
    alignSelf: "center",
  },
  splitAndButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    paddingHorizontal: 5, // Align with title if it has padding
  },
  splitDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    backgroundColor: "#f8f9fa",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1, // Takes available space
  },
  splitText: {
    fontSize: 10,
    color: "#666",
    marginHorizontal: 4,
    fontWeight: "500",
    lineHeight: 24,
  },
  dropdownButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 75,
  },
  dropdownButtonText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  dropdownList: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    width: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    marginLeft: 12,
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: "500",
    color: "#fff",
    lineHeight: 24,
  },
  balancesScrollView: {
    maxHeight: responsiveFontSize(50) * 4,
  },
  balancesScrollContent: {
    paddingHorizontal: 10, // optional padding
  },
  balancesSection: {
    width: "100%", // Takes full width available from scrollContent's padding
    marginTop: 30, // Space above the balances section
    paddingHorizontal: 5, // Consistent padding with title
  },
  balancesTitle: {
    fontSize: 20, // Slightly smaller than main title
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    alignSelf: "flex-start", // Align to the left
  },
  balanceItem: {
    height: responsiveFontSize(50),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0", // Lighter border color
  },
  housemateName: {
    fontSize: 15,
    color: "#555", // Slightly lighter text color
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: "500",
  },
  positiveBalance: {
    color: "#28a745", // Green
  },
  negativeBalance: {
    color: "#dc3545", // Red
  },
  neutralBalance: {
    color: "#6c757d", // Gray
  },
  clickableBalance: {
    textDecorationLine: "underline",
  },
  noBalancesText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "85%",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ExpensesScreen;
