import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image, // Added for displaying selected image (optional)
} from "react-native";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker

export default function Contact() {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState(-1);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // State for selected image URI

  const reasons = [
    { label: "General Inquiry", value: "general" },
    { label: "Maintenance request", value: "maintenance" },
  ];

  const priorities = [
    { label: "Low", value: 0, color: "#4CAF50" },
    { label: "Medium", value: 1, color: "#FF9800" },
    { label: "High", value: 2, color: "#F44336" },
  ];

  const handleSend = async () => {
    // Dismiss keyboard before showing alert
    Keyboard.dismiss();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const requestData = {
      user_id: user.id,
      reason: reason,
      priority: priority,
      description: message,
      // You might want to include image information here if you upload it
    };

    const { error } = await supabase.from("requests").insert(requestData);

    if (error) {
      console.error("Error adding request:", error);
      Alert.alert("Error", "Failed to send message.");
      return;
    }

    // Clear form
    setReason("");
    setPriority(-1);
    setMessage("");
    setAttachments([]);
    setSelectedImage(null); // Clear selected image
    Alert.alert("Success", "Message sent successfully!");
  };

  const handleImage = (imageAsset) => {
    // This function will receive the image asset.
    // For now, it just logs the URI and sets it to state for display.
    console.log("Selected image asset:", imageAsset);
    if (imageAsset && imageAsset.uri) {
      setSelectedImage(imageAsset.uri);
      // Here you would typically prepare the image for upload or add it to your attachments array
      // For example: setAttachments(prev => [...prev, imageAsset]);
    }
  };

  const handleAttachPicture = async () => {
    Keyboard.dismiss();

    // Request permission to access media library
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You've refused to allow this app to access your photos."
      );
      return;
    }

    // Launch image library
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only allow images
      allowsEditing: true, // Optional: allow editing
      aspect: [4, 3], // Optional: aspect ratio for editing
      quality: 1, // Optional: image quality (0 to 1)
    });

    if (pickerResult.canceled === true) {
      return;
    }

    // Pass the first selected asset to handleImage
    if (pickerResult.assets && pickerResult.assets.length > 0) {
      handleImage(pickerResult.assets[0]);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const getPriorityColor = () => {
    const selectedPriority = priorities.find((p) => p.value === priority);
    return selectedPriority ? selectedPriority.color : "#666";
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Contact your landlord</Text>
          <View style={styles.section}>
            <Text style={styles.label}>Reason for Contact</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                Keyboard.dismiss();
                setShowReasonDropdown(true);
              }}
            >
              <Text style={styles.dropdownText}>
                {reason
                  ? reasons.find((r) => r.value === reason)?.label
                  : "Select a reason..."}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Priority Level</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                Keyboard.dismiss();
                setShowPriorityDropdown(true);
              }}
            >
              <View style={styles.priorityContainer}>
                {priority >= 0 && (
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: getPriorityColor() },
                    ]}
                  />
                )}
                <Text style={styles.dropdownText}>
                  {priority >= 0
                    ? priorities.find((p) => p.value === priority)?.label
                    : "Select priority..."}
                </Text>
              </View>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Reason Dropdown Modal */}
          <Modal
            visible={showReasonDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowReasonDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={() => setShowReasonDropdown(false)}
            >
              <View style={styles.dropdownModal}>
                <FlatList
                  data={reasons}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setReason(item.value);
                        setShowReasonDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Priority Dropdown Modal */}
          <Modal
            visible={showPriorityDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowPriorityDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={() => setShowPriorityDropdown(false)}
            >
              <View style={styles.dropdownModal}>
                <FlatList
                  data={priorities}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setPriority(item.value);
                        setShowPriorityDropdown(false);
                      }}
                    >
                      <View style={styles.priorityItemContainer}>
                        <View
                          style={[
                            styles.priorityDot,
                            { backgroundColor: item.color },
                          ]}
                        />
                        <Text style={styles.dropdownItemText}>
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          <View style={styles.section}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={6}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter your message here..."
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={dismissKeyboard}
            />
          </View>

          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageButton}>
                <Text style={styles.removeImageButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttachPicture}
          >
            <Text style={styles.attachButtonText}>📎 Attach Picture</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 50,
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityItemContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "80%",
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    minHeight: 120,
  },
  attachButton: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  attachButtonText: {
    fontSize: 16,
    color: "#666",
  },
  sendButton: {
    backgroundColor: "#000000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  removeImageButton: {
    backgroundColor: "#F44336",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  removeImageButtonText: {
    color: "#fff",
    fontSize: 14,
  },
});
