import React, { useState, useRef, useCallback, useContext } from "react"; // Removed useEffect as it's not used in the final version of this change
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
  FlatList, // Import FlatList
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

  // State for past expenses
  const [pastExpenses, setPastExpenses] = useState([]);

  const deleteExpense = () => {
    // Empty function to be implemented later
    console.log("Deleting expense");
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

  // Function to fetch past expenses
  const getPastExpenses = useCallback(async () => {
    if (!userId) return;

    try {
      const housemateIds = await getHousemates(); // from @/context/utils
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
                .from('profiles')
                .select('first_name')
                .eq('id', userId)
                .single();
            if (currentUserProfile) {
                localUserNamesMap[userId] = currentUserProfile.first_name;
            } else {
                localUserNamesMap[userId] = "You"; // Fallback
                if (profileError) console.warn("Error fetching current user's name for past expenses:", profileError.message);
            }
        }
      }

      const { data: allExpenseSplits, error: splitsError } = await supabase
        .from("expenses")
        .select("expense_id, payer_id, amount, description, created_at")
        .in("payer_id", allUserIdsInHouse) // Assumes payer is always in the house for house expenses
        .order("created_at", { ascending: false });

      if (splitsError) {
        console.error("Error fetching expense splits for past expenses:", splitsError.message);
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
            existing.date = split.created_at; // Use the earliest date for the expense
          }
        }
        return acc;
      }, {});

      const formattedExpenses = Object.values(grouped)
        .map(exp => ({
          ...exp,
          payerName: exp.payerId === userId ? "You" : (localUserNamesMap[exp.payerId] || "A housemate"),
          paidByCurrentUser: exp.payerId === userId,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Ensure final sort by date

      setPastExpenses(formattedExpenses);

    } catch (error) {
      console.error("Error in getPastExpenses:", error.message);
      setPastExpenses([]);
    }
  }, [userId, housemateBalances, authState.user]);


  useFocusEffect(
    useCallback(() => {
      getBalances();
      getPastExpenses(); // Call fetch past expenses
    }, [getBalances, getPastExpenses])
  );

  const handlePaymentConfirmation = (confirmed, id) => {
    setShowPaymentModal(false);
    if (confirmed) {
      markExpenses(id);
      getBalances();
      // Optionally refresh past expenses if marking paid changes their display:
      // getPastExpenses(); 
    }
    setSelectedHousemate(null);
  };

  const markExpenses = async (otherId) => {
    try {
      const { data, error } = await supabase.rpc("mark_expenses_paid", {
        p_user1: userId,
        p_user2: otherId,
      });
      // console.log(data); // Keep for debugging if needed
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
      paidBy === "you" ? user.id : housemates.find((h) => h.id === paidBy); // Assuming housemates from getHousemates are objects with id

    const uid = uuid.v4();

    // The total number of people involved in the split, including the payer
    const totalPeopleInSplit = housemates.length + 1;

    for (const housemate_id of housemates) { // Assuming housemates from getHousemates are just IDs
      // If payer is one of the housemates in the loop, they don't owe themselves for this split part
      // This logic might need refinement based on how `getHousemates` and splits are structured.
      // The current logic implies the expense is split among all housemates + current user.
      // If payer is user.id, then all housemates owe their share.
      // If payer is a housemate, then user.id and other housemates owe their share.

      // For simplicity, assuming the original split logic is what's intended:
      // each of the `housemates` array gets an entry, and if the payer is not one of them,
      // an implicit share is for the payer or needs to be handled.
      // The original code creates an expense entry for each housemate in the `housemates` array.
      // The total amount is `parseFloat(amount)`.
      // If split equally, each of the (housemates.length + 1) people involved pays `parseFloat(amount) / (housemates.length + 1)`.
      // The `expenses` table stores these individual obligations.

      const splitAmount =
        splitMethod === "equally"
          ? parseFloat(amount) / totalPeopleInSplit
          : parseFloat(amount); // This 'else' case for splitMethod needs clarification if not 'equally'

      const expenseData = {
        expense_id: uid,
        payer_id: payer, // This should be the actual ID of the payer
        housemate_id: housemate_id, // The ID of the person who owes this part of the expense
        is_paid: false,
        amount: splitAmount,
        description: description || "No description",
      };
      
      // Also add an entry for the current user if they are not the payer and are part of the split
      // This part of the logic is complex and depends on the exact definition of `housemates` from `getHousemates()`
      // and who is included in the split. The original code iterates `for (const housemate of housemates)`
      // which implies `housemates` are the *other* members.

      // To ensure the sum of `amount` in `expenses` table for an `expense_id` equals the total expense:
      // The current loop creates `housemates.length` entries.
      // If the expense is £100, 3 housemates (A, B, C), payer is User (U). Total 4 people.
      // Each owes £25. Entries: (Payer:U, Debtor:A, Amt:25), (Payer:U, Debtor:B, Amt:25), (Payer:U, Debtor:C, Amt:25).
      // The sum of these is £75. The payer's "share" of £25 is implicit.
      // The `getPastExpenses` sums these `amount` fields. So it would show £75.
      // This needs to be consistent. If `totalAmount` in past expenses should be the full £100,
      // then the `expenses` table should store splits that sum to the total.
      // One way: if payer is X, and N people (incl X) split, create N-1 entries for those who owe X.
      // The sum of these entries is (N-1)/N * Total.
      // Or, store all N entries, including one for the payer (amount could be negative or handled differently).

      // For now, sticking to the sum of positive obligations as "totalAmount" as per current `getPastExpenses`
      const { error } = await supabase.from("expenses").insert(expenseData);

      if (error) {
        console.error("Error adding expense:", error);
        // Potentially roll back or handle partial insert
        return; // Stop if one insert fails
      }
    }
    
    // If the payer is the current user, and the split is "equally",
    // an entry for the current user owing themselves isn't typically made.
    // The sum of `amount` in `expenses` table for an `expense_id` will be the total amount others owe to the payer.
    // If the user wants "totalAmount" in past expenses to be the original expense sum (e.g. £100 receipt),
    // the `addExpense` and `getPastExpenses` logic for `totalAmount` needs to align.
    // A common way is to store the original total amount separately or ensure splits sum to it.
    // The current `getPastExpenses` sums `split.amount`. So if `addExpense` creates splits that represent
    // portions owed, their sum is the total amount changing hands.

    setAmount("");
    setDescription("");
    getBalances();
    getPastExpenses(); // Refresh past expenses feed
  };

  const userOptions = [{ label: "You", value: "you" }];
  const splitOptions = [{ label: "Equally", value: "equally" }];

  // Helper to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { month: 'short', day: 'numeric' }; // e.g., "Oct 26"
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render item for FlatList
  const renderPastExpenseItem = ({ item }) => (
    <View style={styles.pastExpenseItem}>
      <View style={styles.pastExpenseDetails}>
        <Text style={styles.pastExpenseDescription} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.pastExpenseSubText}>
          Paid by {item.payerName} on {formatDate(item.date)}
        </Text>
      </View>
      <View style={styles.pastExpenseRightSection}>
        <Text style={[
          styles.pastExpenseAmount,
          item.paidByCurrentUser ? styles.amountPositive : styles.amountNegative
        ]}>
          £{item.totalAmount.toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteExpense()}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
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
            showsVerticalScrollIndicator={false} // Added to hide scrollbar if not desired
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
        </View>
        
        {/* Past Expenses Feed Section */}
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
              // nestedScrollEnabled={true} // Uncomment if scroll issues on Android
            />
          ) : (
            <Text style={styles.noPastExpensesText}>
              No recent activity to show.
            </Text>
          )}
        </View>

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
              {/* Ensure this View doesn't get pressed, or handle press on items only */}
              <View style={[styles.dropdownList, styles.paidByDropdownPositioning]}> 
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
              <View style={[styles.dropdownList, styles.splitDropdownPositioning]}>
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
    fontSize: 10, // Adjusted for potentially smaller available space
    color: "#666",
    marginHorizontal: 2, // Reduced margin
    fontWeight: "500",
    lineHeight: 24,
  },
  dropdownButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 10, // Adjusted padding
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 60, // Adjusted minWidth
    marginHorizontal: 2, // Added margin for spacing
  },
  dropdownButtonText: {
    fontSize: 12, // Consistent size
    color: "#333",
    textAlign: "center",
  },
  // Positioning for dropdowns - adjust these as needed based on your layout
  paidByDropdownPositioning: {
    // Example: position near the "Paid by" button
    // You might need to calculate this dynamically or use a library for robust dropdowns
    top: '40%', // Placeholder, adjust
    left: '10%', // Placeholder, adjust
  },
  splitDropdownPositioning: {
    // Example: position near the "split" button
    top: '40%', // Placeholder, adjust
    right: '10%', // Placeholder, adjust
  },
  dropdownList: {
    position: "absolute", // Keep absolute for overlay effect
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    width: 150, // Increased width for better readability
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    // Remove fixed top/left from here, apply dynamically or via specific style objects
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 10, // Added horizontal padding
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
  dropdownModal: { // For payment confirmation modal
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
  modalButtonText: { // Text for Yes/No buttons
    fontSize: 16,
    fontWeight: "500",
    color: "#fff", // Default for confirm button
  },
  // Ensure cancel button text is visible
  cancelButtonText: { // Specific style for cancel button text if needed
    color: "#333", // Darker text for light background
  },
  // Styles for Past Expenses Feed
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
    maxHeight: responsiveFontSize(65) * 4, // Approx 4 items, each ~65px high
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
    minHeight: responsiveFontSize(60), // Minimum height for items
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
  amountPositive: { // Paid by you - green
    color: "#28a745",
  },
  amountNegative: { // Paid by someone else - red
    color: "#dc3545",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#fff",
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
