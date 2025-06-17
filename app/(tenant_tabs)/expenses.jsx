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
  Alert,
} from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";
import { getHousemates } from "@/context/utils";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { responsiveFontSize } from "@/tools/fontscaling";
import { useTheme } from "@/context/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
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
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 60 : 20,
      paddingBottom: 100,
    },
    pressableWrapper: {
      width: "100%",
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 20,
      alignSelf: "flex-start",
      paddingHorizontal: 10,
    },
    inputSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      ...theme.elevation.sm,
    },
    amountInput: {
      fontSize: 32,
      color: theme.colors.onSurface,
      textAlign: "center",
      marginBottom: 15,
      fontFamily: theme.typography.fontFamily.medium,
    },
    descriptionInput: {
      fontSize: 16,
      color: theme.colors.onSurface,
      textAlign: "center",
      fontFamily: theme.typography.fontFamily.regular,
    },
    splitAndButtonContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 15,
    },
    splitDetailsContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    splitText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontWeight: "500",
      lineHeight: 24,
    },
    dropdownButton: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    dropdownButtonText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.medium,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      ...theme.elevation.sm,
    },
    addButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 32,
      fontFamily: theme.typography.fontFamily.medium,
      textAlign: "center",
      lineHeight: 32,
      height: 32,
      width: 32,
      textAlignVertical: "center",
    },
    balancesSection: {
      width: "100%",
      marginBottom: 20,
    },
    balancesScrollView: {
      maxHeight: 200,
    },
    balancesScrollContent: {
      paddingHorizontal: 15,
    },
    balancesTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 8,
      alignSelf: "flex-start",
    },
    balanceItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginBottom: 8,
      ...theme.elevation.sm,
    },
    housemateName: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.medium,
    },
    balanceAmount: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.medium,
    },
    positiveBalance: {
      color: theme.colors.success,
    },
    negativeBalance: {
      color: theme.colors.error,
    },
    neutralBalance: {
      color: theme.colors.onSurface,
    },
    clickableBalance: {
      textDecorationLine: "underline",
    },
    noBalancesText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      textAlign: "center",
      marginTop: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    dropdownModal: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      width: "80%",
      maxWidth: 400,
      ...theme.elevation.md,
    },
    modalText: {
      fontSize: 18,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.medium,
      textAlign: "center",
      marginBottom: 15,
    },
    modalSubText: {
      fontSize: 16,
      color: theme.colors.placeholder,
      fontFamily: theme.typography.fontFamily.regular,
      textAlign: "center",
      marginBottom: 20,
    },
    modalButtonContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 15,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelButton: {
      backgroundColor: theme.colors.error,
    },
    modalButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.medium,
    },
    dropdownList: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 8,
      width: 200,
      ...theme.elevation.md,
    },
    dropdownItem: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 6,
    },
    dropdownItemText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.regular,
    },
    paidByDropdownPositioning: {
      position: "absolute",
      top: 200,
      left: 20,
    },
    splitDropdownPositioning: {
      position: "absolute",
      top: 200,
      left: 120,
    },
    pastExpensesSection: {
      width: "100%",
      marginBottom: 150,
    },
    pastExpensesTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 8,
      alignSelf: "flex-start",
    },
    pastExpensesList: {
      maxHeight: responsiveFontSize(65) * 4,
    },
    pastExpensesListContent: {
      paddingBottom: 8,
    },
    pastExpenseItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginBottom: 8,
      ...theme.elevation.sm,
    },
    pastExpenseDetails: {
      flex: 1,
      marginRight: 15,
    },
    pastExpenseRightSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pastExpenseDescription: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.fontFamily.medium,
      marginBottom: 4,
    },
    pastExpenseSubText: {
      fontSize: 14,
      color: theme.colors.placeholder,
      fontFamily: theme.typography.fontFamily.regular,
    },
    pastExpenseAmount: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.medium,
    },
    amountPositive: {
      color: theme.colors.success,
    },
    amountNegative: {
      color: theme.colors.error,
    },
    deleteButton: {
      padding: 4,
    },
    deleteButtonText: {
      color: theme.colors.error,
      fontSize: 20,
      fontFamily: theme.typography.fontFamily.medium,
    },
    noPastExpensesText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      textAlign: "center",
      marginTop: 8,
      paddingBottom: 8,
    },
  });

  const deleteExpense = async (expenseId) => {
    console.log("Deleting expense:", expenseId);
    try {
      // Get all expenses with this expense_id
      const { data: expenseDetails, error: fetchError } = await supabase
        .from("expenses")
        .select("*")
        .eq("expense_id", expenseId);

      if (fetchError) {
        console.error("Error fetching expense details:", fetchError);
        return;
      }

      console.log("Found expenses:", expenseDetails);

      // Check if any of these expenses were paid
      const wasPaid = expenseDetails.some(expense => expense.is_paid);
      console.log("Was any expense paid?", wasPaid);

      if (wasPaid) {
        // Get the first expense to get the original payer and amount
        const originalExpense = expenseDetails[0];
        const totalAmount = expenseDetails.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

        // Find the expense that was paid to get who paid it
        const paidExpense = expenseDetails.find(expense => expense.is_paid);
        
        // Create reimbursement expense
        const newExpenseId = uuid.v4();
        const newExpenseData = {
          expense_id: newExpenseId,
          payer_id: paidExpense.housemate_id, // Original payer now owes the money
          housemate_id: paidExpense.payer_id, // Person who paid gets reimbursed
          is_paid: false,
          amount: originalExpense.amount,
          description: `Reimbursement for deleted expense: ${originalExpense.description || "No description"}`,
          deletable: false,
        };

        console.log("Creating reimbursement:", newExpenseData);

        const { error: insertError } = await supabase
          .from("expenses")
          .insert(newExpenseData);

        if (insertError) {
          console.error("Error creating reimbursement:", insertError);
          return;
        }
      }

      // Delete the original expense
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("expense_id", expenseId);

      if (error) {
        console.error("Error deleting expense:", error);
      } else {
        console.log("Deleted successfully");
        getBalances();
        getPastExpenses();
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
        .select("expense_id, payer_id, amount, description, created_at, deletable")
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
            deletable: split.deletable,
          };
        } else {
          existing.totalAmount += parseFloat(split.amount) || 0;
          if (new Date(split.created_at) < new Date(existing.date)) {
            existing.date = split.created_at;
          }
          // If any split is not deletable, the whole expense is not deletable
          if (split.deletable === false) {
            existing.deletable = false;
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
        {item.paidByCurrentUser && item.deletable !== false && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePress(item)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        )}
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
          <ThemedText type="title" style={styles.title}>Add expense</ThemedText>
          <ThemedView style={styles.inputSection}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={handleAmountChange}
              textAlign="center"
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add a note"
              value={description}
              onChangeText={setDescription}
              textAlign="center"
              placeholderTextColor={theme.colors.placeholder}
            />
          </ThemedView>
          <View style={styles.splitAndButtonContainer}>
            <View style={styles.splitDetailsContainer}>
              <ThemedText type="default">Paid by</ThemedText>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowPaidByDropdown(true)}
              >
                <ThemedText type="default">
                  {userOptions.find((opt) => opt.value === paidBy)?.label || "You"}
                </ThemedText>
              </TouchableOpacity>
              <ThemedText type="default">and split</ThemedText>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSplitDropdown(true)}
              >
                <ThemedText type="default">
                  {splitOptions.find((opt) => opt.value === splitMethod)?.label || "Equally"}
                </ThemedText>
              </TouchableOpacity>
            </View>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity style={styles.addButton} onPress={addExpense}>
                <ThemedText type="default" style={styles.addButtonText}>+</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Pressable>
        <ThemedView style={styles.balancesSection}>
          <ThemedText type="subtitle" style={styles.balancesTitle}>Housemate Balances</ThemedText>
          <ScrollView
            style={styles.balancesScrollView}
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
                  <ThemedText type="default">{hm.first_name}</ThemedText>
                  <ThemedText
                    type="default"
                    style={[
                      hm.balance > 0
                        ? styles.positiveBalance
                        : hm.balance < 0
                        ? styles.negativeBalance
                        : styles.neutralBalance,
                      hm.balance < 0 && styles.clickableBalance,
                    ]}
                  >
                    {formatBalanceText(hm.balance)}
                  </ThemedText>
                </TouchableOpacity>
              ))
            ) : (
              <ThemedText type="default" style={styles.noBalancesText}>
                No housemate balances to show yet.
              </ThemedText>
            )}
          </ScrollView>
        </ThemedView>
        <ThemedView style={styles.pastExpensesSection}>
          <ThemedText type="subtitle" style={styles.pastExpensesTitle}>Recent Activity</ThemedText>
          {pastExpenses.length > 0 ? (
            pastExpenses.map((item) => (
              <View key={item.id}>{renderPastExpenseItem({ item })}</View>
            ))
          ) : (
            <ThemedText type="default" style={styles.noPastExpensesText}>
              No recent activity to show.
            </ThemedText>
          )}
        </ThemedView>
      </ScrollView>
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
          <ThemedView style={styles.dropdownModal}>
            <ThemedText type="subtitle" style={styles.modalText}>
              Have you paid £{Math.abs(selectedHousemate?.balance).toFixed(2)} to {selectedHousemate?.first_name}?
            </ThemedText>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => handlePaymentConfirmation(true, selectedHousemate?.id)}
              >
                <ThemedText type="default" style={styles.modalButtonText}>Yes</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => handlePaymentConfirmation(false, selectedHousemate?.id)}
              >
                <ThemedText type="default" style={styles.modalButtonText}>No</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
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
          <ThemedView style={styles.dropdownModal}>
            <ThemedText type="subtitle" style={styles.modalText}>
              Are you sure you want to delete this expense?
            </ThemedText>
            <ThemedText type="default" style={styles.modalSubText}>
              {expenseToDelete?.description} - £{expenseToDelete?.totalAmount.toFixed(2)}
            </ThemedText>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => handleDeleteConfirmation(true, expenseToDelete?.id)}
              >
                <ThemedText type="default" style={styles.modalButtonText}>Yes</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => handleDeleteConfirmation(false, null)}
              >
                <ThemedText type="default" style={styles.modalButtonText}>No</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
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
          <ThemedView style={[styles.dropdownList, styles.paidByDropdownPositioning]}>
            {userOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.dropdownItem}
                onPress={() => {
                  setPaidBy(option.value);
                  setShowPaidByDropdown(false);
                }}
              >
                <ThemedText type="default">{option.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
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
          <ThemedView style={[styles.dropdownList, styles.splitDropdownPositioning]}>
            {splitOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.dropdownItem}
                onPress={() => {
                  setSplitMethod(option.value);
                  setShowSplitDropdown(false);
                }}
              >
                <ThemedText type="default">{option.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ExpensesScreen;
