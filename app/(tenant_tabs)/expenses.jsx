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
} from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";
import { Picker } from "@react-native-picker/picker";
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

  useFocusEffect(
    useCallback(() => {
      getBalances();
    }, [])
  );

  const getBalances = async () => {
    try {
      console.log(userId);
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
  };

  // Helper function to format balance display and text
  const formatBalanceText = (balance) => {
    if (balance > 0) {
      return `Owes you: $${balance.toFixed(2)}`;
    } else if (balance < 0) {
      return `You owe: $${Math.abs(balance).toFixed(2)}`;
    } else {
      return `Settled up: $0.00`;
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
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={paidBy}
                  style={styles.picker}
                  itemStyle={
                    Platform.OS === "ios" ? styles.pickerItem : undefined
                  }
                  onValueChange={(itemValue) => setPaidBy(itemValue)}
                  mode="dropdown"
                >
                  {userOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
              <Text style={styles.splitText}>and split</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={splitMethod}
                  style={styles.picker}
                  itemStyle={
                    Platform.OS === "ios" ? styles.pickerItem : undefined
                  }
                  onValueChange={(itemValue) => setSplitMethod(itemValue)}
                  mode="dropdown"
                >
                  {splitOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
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
                <View key={hm.id} style={styles.balanceItem}>
                  <Text style={styles.housemateName}>{hm.first_name}</Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      hm.balance > 0
                        ? styles.positiveBalance
                        : hm.balance < 0
                        ? styles.negativeBalance
                        : styles.neutralBalance,
                    ]}
                  >
                    {formatBalanceText(hm.balance)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noBalancesText}>
                No housemate balances to show yet.
              </Text>
            )}
          </ScrollView>
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
  pickerContainer: {
    marginHorizontal: 4,
    ...(Platform.OS === "ios" && {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 6,
      overflow: "hidden",
      backgroundColor: "#fff",
    }),
  },
  picker: {
    width: 75,
    height: Platform.OS === "ios" ? 32 : 36,
    backgroundColor: Platform.OS === "android" ? "#fff" : "transparent",
    borderRadius: Platform.OS === "android" ? 6 : 0,
  },
  pickerItem: {
    fontSize: 11,
    height: 32,
    color: "#333",
    paddingHorizontal: 0,
    paddingVertical: 0,
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
  noBalancesText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 10,
  },
});

export default ExpensesScreen;
