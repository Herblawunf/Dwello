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
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
// FileSystem might not be needed if FormData handles URI directly
import * as FileSystem from "expo-file-system";


export default function Contact() {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState(-1);
  const [message, setMessage] = useState("");
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

    if (typeof asset.fileSize === 'number' && asset.fileSize === 0) {
        Alert.alert("Upload Error", "The selected image file is empty.");
        // No need to setIsUploading(true) if we return early
        setSelectedImageUri(null); 
        return null;
    }

    setIsUploading(true);
    setUploadedFileUrl(null);

    try {
      const uri = asset.uri;

      // 1. Determine Content-Type (primary source: asset.mimeType)
      let determinedContentType = asset.mimeType;
      if (!determinedContentType || !determinedContentType.startsWith('image/')) {
          const extensionFromUri = uri.includes('.') ? uri.split('.').pop().toLowerCase() : null;
          if (extensionFromUri && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extensionFromUri)) {
              determinedContentType = `image/${extensionFromUri === 'jpeg' ? 'jpg' : extensionFromUri}`;
          } else {
              determinedContentType = 'image/jpeg'; // Ultimate fallback if type is unknown
          }
      }
      
      // 2. Determine File Extension (from determinedContentType)
      let fileExt = determinedContentType.split('/')[1];
      if (fileExt === 'jpeg') fileExt = 'jpg'; // Normalize for consistency


      // 3. Determine Base Filename (primary source: asset.fileName, fallback to URI parsing)
      let baseFileName;
      if (asset.fileName) {
          baseFileName = asset.fileName.includes('.') ? asset.fileName.substring(0, asset.fileName.lastIndexOf('.')) : asset.fileName;
      } else {
          // Fallback to deriving from URI if asset.fileName is not available
          const uriPathName = uri.substring(uri.lastIndexOf('/') + 1);
          baseFileName = uriPathName.includes('.') ? uriPathName.substring(0, uriPathName.lastIndexOf('.')) : uriPathName;
      }
      const sanitizedBaseFileName = baseFileName.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const filePath = `public/${Date.now()}_${sanitizedBaseFileName}.${fileExt}`;

      // Read the file content using expo-file-system as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const fileNameForFormData = `${sanitizedBaseFileName}.${fileExt}`;

      // Use FormData for uploading in React Native
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: fileNameForFormData,
        type: determinedContentType,
      });

      // console.log('Uploading with FormData. Path:', filePath, 'File details:', { uri: asset.uri, name: fileNameForFormData, type: determinedContentType });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('requests')
        .upload(filePath, formData, {
          // contentType is automatically set to multipart/form-data when FormData is used
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        Alert.alert("Upload Error", `Failed to upload image: ${uploadError.message}`);
        setIsUploading(false);
        setSelectedImageUri(null); 
        return null;
      }

      // If upload was successful, get the public URL
      const { data: publicUrlData, error: getUrlError } = await supabase.storage
        .from('requests')
        .getPublicUrl(filePath);

      if (getUrlError) {
        console.error('Error getting public URL from Supabase:', getUrlError);
        Alert.alert('Error', `Failed to get image URL after upload: ${getUrlError.message}`);
        setIsUploading(false);
        setSelectedImageUri(null); 
        return null;
      }
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('Error getting public URL from Supabase: No public URL in data.');
        Alert.alert('Error', 'Failed to get image URL after upload.');
        setIsUploading(false);
        setSelectedImageUri(null);
        return null;
      }

      console.log('Successfully uploaded image. Public URL:', publicUrlData.publicUrl);
      setUploadedFileUrl(publicUrlData.publicUrl);
      setIsUploading(false);
      return publicUrlData.publicUrl;

    } catch (e) {
      console.error("Upload process error:", e);
      Alert.alert("Upload Error", `An unexpected error occurred during upload: ${e.message}`);
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
      quality: 1, // Quality 1 means no compression (highest quality)
    });

    if (pickerResult.canceled === true) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];
      setSelectedImageUri(asset.uri);
      await uploadImage(asset);
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
      image: uploadedFileUrl,
    };

    const { error } = await supabase.from("requests").insert([requestData]);

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
    setUploadedFileUrl(null);
    if (isUploading) {
        // Note: Actual cancellation of an ongoing upload is complex and not implemented here.
        // This just resets the UI state.
        setIsUploading(false); 
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
            style={[styles.sendButton, (isUploading || !reason || priority < 0 || !message.trim()) && styles.disabledButton]} 
            onPress={handleSend}
            disabled={isUploading || !reason || priority < 0 || !message.trim()}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 60,
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
    opacity: 0.7,
  },
});
