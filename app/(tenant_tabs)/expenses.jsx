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
  FlatList,
  Alert,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const [pastExpenses, setPastExpenses] = useState([]);

  const deleteExpense = async (expenseId) => {
    console.log("Deleting expense:", expenseId);
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("expense_id", expenseId);
      if (error) {
        console.error("Error deleting expense:", error);
      } else {
        // refresh list
        console.log("Deleted successfully");
        getPastExpenses();
        getBalances();
      }
    } catch (err) {
      console.error("Catch deleteExpense:", err);
    }
  };

  const handleDeletePress = (expense) => {
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmation = (confirmed, id) => {
    setShowDeleteModal(false);
    if (confirmed && id) {
      deleteExpense(id);
    }
    setExpenseToDelete(null);
  };

  const getBalances = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.rpc("get_housemate_balances", {
        p_user_id: userId,
      });
      if (data) {
        setHousemateBalances(data);
        return;
      }
      if (error) console.log("Error getBalances:", error);
    } catch (error) {
      console.log("Catch getBalances:", error);
    }
  }, [userId]);

  const getPastExpenses = useCallback(async () => {
    if (!userId) return;
    try {
      const housemateIds = await getHousemates();
      const allUserIdsInHouse = [userId, ...housemateIds];
      let localUserNamesMap = housemateBalances.reduce((acc, hm) => {
        acc[hm.id] = hm.first_name;
        return acc;
      }, {});
      if (!localUserNamesMap[userId]) {
        const authUserName = authState.user?.user_metadata?.first_name;
        if (authUserName) {
          localUserNamesMap[userId] = authUserName;
        } else {
          const { data: currentUserProfile, error: profileError } = await supabase
            .from("profiles")
            .select("first_name")
            .eq("id", userId)
            .single();
          if (currentUserProfile) {
            localUserNamesMap[userId] = currentUserProfile.first_name;
          } else {
            localUserNamesMap[userId] = "You";
            if (profileError)
              console.warn(
                "Error fetching current user's name for past expenses:",
                profileError.message
              );
          }
        }
      }
      const { data: allExpenseSplits, error: splitsError } = await supabase
        .from("expenses")
        .select("expense_id, payer_id, amount, description, created_at")
        .in("payer_id", allUserIdsInHouse)
        .order("created_at", { ascending: false });
      if (splitsError) {
        console.error(
          "Error fetching expense splits for past expenses:",
          splitsError.message
        );
        setPastExpenses([]);
        return;
      }
      if (!allExpenseSplits || allExpenseSplits.length === 0) {
        setPastExpenses([]);
        return;
      }
      const grouped = allExpenseSplits.reduce((acc, split) => {
        const existing = acc[split.expense_id];
        if (!existing) {
          acc[split.expense_id] = {
            id: split.expense_id,
            payerId: split.payer_id,
            description: split.description || "No description",
            date: split.created_at,
            totalAmount: parseFloat(split.amount) || 0,
          };
        } else {
          existing.totalAmount += parseFloat(split.amount) || 0;
          if (new Date(split.created_at) < new Date(existing.date)) {
            existing.date = split.created_at;
          }
        }
        return acc;
      }, {});
      const formattedExpenses = Object.values(grouped)
        .map((exp) => ({
          ...exp,
          payerName:
            exp.payerId === userId
              ? "You"
              : localUserNamesMap[exp.payerId] || "A housemate",
          paidByCurrentUser: exp.payerId === userId,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setPastExpenses(formattedExpenses);
    } catch (error) {
      console.error("Error in getPastExpenses:", error.message);
      setPastExpenses([]);
    }
  }, [userId, housemateBalances, authState.user]);

  useFocusEffect(
    useCallback(() => {
      getBalances();
      getPastExpenses();
    }, [getBalances, getPastExpenses])
  );

  const handlePaymentConfirmation = (confirmed, id) => {
    setShowPaymentModal(false);
    if (confirmed) {
      markExpenses(id);
      getBalances();
    }
    setSelectedHousemate(null);
  };

  const markExpenses = async (otherId) => {
    try {
      const { data, error } = await supabase.rpc("mark_expenses_paid", {
        p_user1: userId,
        p_user2: otherId,
      });
      if (error) {
        console.log("Error markExpenses:", error);
      }
    } catch (error) {
      console.log("Catch markExpenses:", error);
    }
  };

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
    let housemates = await getHousemates();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let payer =
      paidBy === "you" ? user.id : housemates.find((h) => h.id === paidBy);
    const uid = uuid.v4();
    const totalPeopleInSplit = housemates.length + 1;
    for (const housemate_id of housemates) {
      const splitAmount =
        splitMethod === "equally"
          ? parseFloat(amount) / totalPeopleInSplit
          : parseFloat(amount);
      const expenseData = {
        expense_id: uid,
        payer_id: payer,
        housemate_id: housemate_id,
        is_paid: false,
        amount: splitAmount,
        description: description || "No description",
      };
      const { error } = await supabase.from("expenses").insert(expenseData);
      if (error) {
        console.error("Error adding expense:", error);
        return;
      }
    }
    setAmount("");
    setDescription("");
    getBalances();
    getPastExpenses();
  };

  const userOptions = [{ label: "You", value: "you" }];
  const splitOptions = [{ label: "Equally", value: "equally" }];

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderPastExpenseItem = ({ item }) => (
    <View style={styles.pastExpenseItem}>
      <View style={styles.pastExpenseDetails}>
        <Text style={styles.pastExpenseDescription} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.pastExpenseSubText}>
          Paid by {item.payerName} on {formatDate(item.date)}
        </Text>
      </View>
      <View style={styles.pastExpenseRightSection}>
        <Text
          style={[
            styles.pastExpenseAmount,
            item.paidByCurrentUser
              ? styles.amountPositive
              : styles.amountNegative,
          ]}
        >
          £{item.totalAmount.toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePress(item)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <View style={styles.splitAndButtonContainer}>
            <View style={styles.splitDetailsContainer}>
              <Text style={styles.splitText}>Paid by</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowPaidByDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {userOptions.find((opt) => opt.value === paidBy)?.label ||
                    "You"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.splitText}>and split</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSplitDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {splitOptions.find((opt) => opt.value === splitMethod)
                    ?.label || "Equally"}
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
        <View style={styles.balancesSection}>
          <Text style={styles.balancesTitle}>Housemate Balances</Text>
          <ScrollView
            style={styles.balancesScrollView}
            contentContainerStyle={styles.balancesScrollContent}
            showsVerticalScrollIndicator={false}
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
                  <Text style={styles.housemateName}>
                    {hm.first_name}
                  </Text>
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
        </View>
        <View style={styles.pastExpensesSection}>
          <Text style={styles.pastExpensesTitle}>Recent Activity</Text>
          {pastExpenses.length > 0 ? (
            <FlatList
              data={pastExpenses}
              renderItem={renderPastExpenseItem}
              keyExtractor={(item) => item.id}
              style={styles.pastExpensesList}
              contentContainerStyle={styles.pastExpensesListContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noPastExpensesText}>
              No recent activity to show.
            </Text>
          )}
        </View>
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
              <Text style={styles.modalText}>
                Have you paid £
                {Math.abs(selectedHousemate?.balance).toFixed(2)} to{" "}
                {selectedHousemate?.first_name}?
              </Text>
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
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowDeleteModal(false)}
            activeOpacity={1}
          >
            <View style={styles.dropdownModal}>
              <Text style={styles.modalText}>
                Are you sure you want to delete this expense?
              </Text>
              <Text style={styles.modalSubText}>
                {expenseToDelete?.description} - £
                {expenseToDelete?.totalAmount.toFixed(2)}
              </Text>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() =>
                    handleDeleteConfirmation(true, expenseToDelete?.id)
                  }
                >
                  <Text style={styles.modalButtonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => handleDeleteConfirmation(false, null)}
                >
                  <Text style={styles.modalButtonText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
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
            <View
              style={[styles.dropdownList, styles.paidByDropdownPositioning]}
            >
              {userOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setPaidBy(option.value);
                    setShowPaidByDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
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
            <View
              style={[styles.dropdownList, styles.splitDropdownPositioning]}
            >
              {splitOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSplitMethod(option.value);
                    setShowSplitDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
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
    paddingBottom: 40,
    alignItems: "center",
  },
  pressableWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
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
    paddingHorizontal: 5,
  },
  splitDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    backgroundColor: "#f8f9fa",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  splitText: {
    fontSize: 10,
    color: "#666",
    marginHorizontal: 2,
    fontWeight: "500",
    lineHeight: 24,
  },
  dropdownButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 60,
    marginHorizontal: 2,
  },
  dropdownButtonText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  paidByDropdownPositioning: {
    top: "40%",
    left: "10%",
  },
  splitDropdownPositioning: {
    top: "40%",
    right: "10%",
  },
  dropdownList: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    width: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
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
    paddingHorizontal: 10,
  },
  balancesSection: {
    width: "100%",
    marginTop: 30,
    paddingHorizontal: 5,
  },
  balancesTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  balanceItem: {
    height: responsiveFontSize(50),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  housemateName: {
    fontSize: 15,
    color: "#555",
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: "500",
  },
  positiveBalance: {
    color: "#28a745",
  },
  negativeBalance: {
    color: "#dc3545",
  },
  neutralBalance: {
    color: "#6c757d",
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
  modalSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
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
    color: "#fff",
  },
  pastExpensesSection: {
    width: "100%",
    marginTop: 30,
    paddingHorizontal: 5,
  },
  pastExpensesTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  pastExpensesList: {
    maxHeight: responsiveFontSize(65) * 4,
  },
  pastExpensesListContent: {
    paddingBottom: 10,
  },
  pastExpenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    minHeight: responsiveFontSize(60),
  },
  pastExpenseDetails: {
    flex: 1,
    marginRight: 10,
  },
  pastExpenseRightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pastExpenseDescription: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 3,
  },
  pastExpenseSubText: {
    fontSize: 12,
    color: "#777",
  },
  pastExpenseAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  amountPositive: {
    color: "#28a745",
  },
  amountNegative: {
    color: "#dc3545",
  },
  deleteButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e74c3c",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    fontSize: 18,
    color: "#e74c3c",
    fontWeight: "500",
    lineHeight: 18,
  },
  noPastExpensesText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 20,
    paddingBottom: 20,
  },
});

export default ExpensesScreen;
