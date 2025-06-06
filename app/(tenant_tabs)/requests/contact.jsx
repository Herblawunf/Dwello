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
  Image,
  ActivityIndicator, // Added for loading indicator
} from "react-native";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";

export default function Contact() {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState(-1);
  const [message, setMessage] = useState("");
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null); // URI for local preview
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // URL from Supabase storage for DB
  const [isUploading, setIsUploading] = useState(false); // To show loading state

  const reasons = [
    { label: "General Inquiry", value: "general" },
    { label: "Maintenance request", value: "maintenance" },
  ];

  const priorities = [
    { label: "Low", value: 0, color: "#4CAF50" },
    { label: "Medium", value: 1, color: "#FF9800" },
    { label: "High", value: 2, color: "#F44336" },
  ];

  const uploadImage = async (asset) => {
    if (!asset || !asset.uri) {
      Alert.alert("Error", "No image asset provided for upload.");
      return null;
    }
    setIsUploading(true);
    setUploadedFileUrl(null); // Clear previous URL

    try {
      const uri = asset.uri;
      // Extract filename and extension more robustly
      const fileNameWithExtension = uri.substring(uri.lastIndexOf('/') + 1);
      const fileExt = fileNameWithExtension.includes('.') ? fileNameWithExtension.split('.').pop().toLowerCase() : 'jpg'; // Default to jpg if no extension
      const fileNameWithoutExtension = fileNameWithExtension.includes('.') ? fileNameWithExtension.substring(0, fileNameWithExtension.lastIndexOf('.')) : fileNameWithExtension;
      
      // Sanitize filename (optional, but good practice)
      const sanitizedFileName = fileNameWithoutExtension.replace(/[^a-zA-Z0-9_-]/g, '_');

      const filePath = `public/${Date.now()}_${sanitizedFileName}.${fileExt}`;

      // Fetch the image data as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('requests') // Your bucket name
        .upload(filePath, blob, {
          contentType: asset.mimeType || `image/${fileExt}`,
          upsert: false, // Set to true if you want to overwrite
        });

      if (uploadError) {
        console.error('Error uploading image to Supabase:', uploadError);
        Alert.alert('Upload Error', `Failed to upload image: ${uploadError.message}`);
        setIsUploading(false);
        setSelectedImageUri(null); // Clear preview if upload fails
        return null;
      }

      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('requests')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('Error getting public URL from Supabase.');
        Alert.alert('Error', 'Failed to get image URL after upload.');
        setIsUploading(false);
        setSelectedImageUri(null); // Clear preview
        return null;
      }
      
      console.log('Successfully uploaded image. Public URL:', publicUrlData.publicUrl);
      setUploadedFileUrl(publicUrlData.publicUrl); // Store the public URL
      setIsUploading(false);
      return publicUrlData.publicUrl;

    } catch (e) {
      console.error("Upload process error:", e);
      Alert.alert("Upload Error", "An unexpected error occurred during upload.");
      setSelectedImageUri(null); 
      setUploadedFileUrl(null);
      setIsUploading(false);
      return null;
    }
  };

  const handleAttachPicture = async () => {
    Keyboard.dismiss();

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You've refused to allow this app to access your photos."
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (pickerResult.canceled === true) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];
      setSelectedImageUri(asset.uri); // Set for preview immediately
      await uploadImage(asset); // Upload and set uploadedFileUrl
    }
  };

  const handleSend = async () => {
    Keyboard.dismiss();

    if (isUploading) {
        Alert.alert("Please wait", "Image is still uploading.");
        return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        Alert.alert("Authentication Error", "Could not find user. Please log in again.");
        return;
    }

    const requestData = {
      user_id: user.id,
      reason: reason,
      priority: priority,
      description: message,
      image: uploadedFileUrl, // Use the URL from Supabase storage
    };

    const { error } = await supabase.from("requests").insert([requestData]); // insert expects an array

    if (error) {
      console.error("Error adding request:", error);
      Alert.alert("Error", `Failed to send message: ${error.message}`);
      return;
    }

    setReason("");
    setPriority(-1);
    setMessage("");
    setSelectedImageUri(null);
    setUploadedFileUrl(null);
    Alert.alert("Success", "Message sent successfully!");
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const getPriorityColor = () => {
    const selectedPriority = priorities.find((p) => p.value === priority);
    return selectedPriority ? selectedPriority.color : "#666";
  };

  const removeSelectedImage = () => {
    setSelectedImageUri(null);
    setUploadedFileUrl(null); // Also clear the uploaded URL
    // If there was an ongoing upload, you might want to cancel it
    // For simplicity, we're not implementing cancellation here
    if (isUploading) {
        setIsUploading(false); // Reset uploading state if image is removed
    }
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

          {selectedImageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
              <TouchableOpacity onPress={removeSelectedImage} style={styles.removeImageButton}>
                <Text style={styles.removeImageButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.attachButton, isUploading && styles.disabledButton]}
            onPress={handleAttachPicture}
            disabled={isUploading}
          >
            {isUploading ? (
                <View style={styles.attachButtonContent}>
                    <ActivityIndicator size="small" color="#666" style={{marginRight: 8}} />
                    <Text style={styles.attachButtonText}>Uploading...</Text>
                </View>
            ) : (
                <Text style={styles.attachButtonText}>📎 Attach Picture</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.sendButton, isUploading && styles.disabledButton]} 
            onPress={handleSend}
            disabled={isUploading}
          >
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
    paddingHorizontal: 20, // Changed from 'padding: 20'
    paddingTop: 60,
    paddingBottom: 60, // Increased paddingBottom
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
  attachButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  disabledButton: {
    opacity: 0.7, // Style for disabled buttons
  },
});

