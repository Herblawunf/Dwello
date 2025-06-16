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
import { MaterialIcons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
// FileSystem is no longer needed as FormData handles URI directly for uploads
// import * as FileSystem from "expo-file-system";

export default function Contact() {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState(-1);
  const [message, setMessage] = useState("");
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null); // URI for selected image or video
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPriorityInfo, setShowPriorityInfo] = useState(false); // New state for info modal

  // ---------------- Availability calendar states ----------------
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [rangeStart, setRangeStart] = useState(null);
  const [alwaysAvailable, setAlwaysAvailable] = useState(false);

  // ---------------- Reason dropdown options ----------------
  const reasons = [
    { label: "General Inquiry", value: "general" },
    { label: "Plumbing Issue", value: "plumbing" },
    { label: "Electrical Issue", value: "electrical" },
    { label: "Heating/Cooling Issue", value: "hvac" },
    { label: "Appliance Repair", value: "appliance" },
    { label: "Pest Control", value: "pest" },
    { label: "Other Maintenance", value: "maintenance_other" },
  ];

  const priorities = [
    { label: "Minor", value: 0, color: "#4CAF50" },
    { label: "Routine", value: 1, color: "#FF9800" },
    { label: "Urgent", value: 2, color: "#F44336" },
  ];

  const priorityExamples = [
    {
      level: "Urgent",
      color: "#F44336",
      examples: [
        "No heat in winter",
        "Major water leaks",
        "No electricity",
        "Security/safety concerns",
      ],
    },
    {
      level: "Routine",
      color: "#FF9800",
      examples: [
        "Appliance not working properly",
        "Minor leaks",
        "Broken blinds/curtains",
        "Non-emergency electrical issues",
      ],
    },
    {
      level: "Minor",
      color: "#4CAF50",
      examples: [
        "Cosmetic repairs",
        "Small paint touch-ups",
        "Cabinet hardware replacement",
        "Light bulb replacement",
      ],
    },
  ];

  const uploadImage = async (asset) => {
    // Renaming to uploadMedia might be more accurate but keeping for consistency
    if (!asset || !asset.uri) {
      Alert.alert("Error", "No media asset provided for upload.");
      return null;
    }

    if (typeof asset.fileSize === "number" && asset.fileSize === 0) {
      Alert.alert("Upload Error", "The selected file is empty.");
      setSelectedImageUri(null);
      return null;
    }

    setIsUploading(true);
    setUploadedFileUrl(null);

    try {
      const uri = asset.uri;
      const isVideo = asset.mediaType === "video";

      // 1. Determine Content-Type
      let determinedContentType = asset.mimeType;
      if (
        !determinedContentType ||
        determinedContentType === "application/octet-stream" ||
        (!determinedContentType.startsWith("image/") &&
          !determinedContentType.startsWith("video/"))
      ) {
        const extensionFromUri = uri.includes(".")
          ? uri.split(".").pop().toLowerCase()
          : null;
        const fileNameExt =
          asset.fileName && asset.fileName.includes(".")
            ? asset.fileName.split(".").pop().toLowerCase()
            : null;
        const bestGuessExt = extensionFromUri || fileNameExt;

        if (isVideo) {
          if (bestGuessExt) {
            if (["mp4", "m4v"].includes(bestGuessExt))
              determinedContentType = "video/mp4";
            else if (["mov", "qt"].includes(bestGuessExt))
              determinedContentType = "video/quicktime";
            else if (["avi"].includes(bestGuessExt))
              determinedContentType = "video/x-msvideo";
            else if (["wmv"].includes(bestGuessExt))
              determinedContentType = "video/x-ms-wmv";
            else if (["mkv"].includes(bestGuessExt))
              determinedContentType = "video/x-matroska";
            else if (["webm"].includes(bestGuessExt))
              determinedContentType = "video/webm";
            else determinedContentType = "video/mp4"; // Default video fallback
          } else {
            determinedContentType = "video/mp4"; // Ultimate video fallback
          }
        } else {
          // It's an image
          if (bestGuessExt) {
            if (["jpg", "jpeg"].includes(bestGuessExt))
              determinedContentType = "image/jpeg";
            else if (["png"].includes(bestGuessExt))
              determinedContentType = "image/png";
            else if (["gif"].includes(bestGuessExt))
              determinedContentType = "image/gif";
            else if (["webp"].includes(bestGuessExt))
              determinedContentType = "image/webp";
            else if (["bmp"].includes(bestGuessExt))
              determinedContentType = "image/bmp";
            else determinedContentType = "image/jpeg"; // Default image fallback
          } else {
            determinedContentType = "image/jpeg"; // Ultimate image fallback
          }
        }
      }

      // 2. Determine File Extension
      let fileExt;
      if (determinedContentType && determinedContentType.includes("/")) {
        fileExt = determinedContentType.split("/")[1];
        if (fileExt === "jpeg") fileExt = "jpg";
        else if (fileExt === "quicktime") fileExt = "mov";
        else if (fileExt === "x-matroska") fileExt = "mkv";
        else if (fileExt === "x-msvideo") fileExt = "avi";
        else if (fileExt === "x-ms-wmv") fileExt = "wmv";
        // Add other normalizations if common, e.g., svg+xml -> svg
      }

      if (!fileExt || fileExt === "octet-stream" || fileExt.length > 5) {
        // Check for generic or complex subtypes
        if (asset.fileName && asset.fileName.includes(".")) {
          const extFromFilename = asset.fileName.split(".").pop().toLowerCase();
          if (
            extFromFilename.length > 0 &&
            extFromFilename.length <= 4 &&
            /^[a-z0-9]+$/.test(extFromFilename)
          ) {
            fileExt = extFromFilename;
          }
        }
      }
      if (!fileExt) {
        fileExt = isVideo ? "mp4" : "jpg"; // Final fallback extension
      }

      // 3. Determine Base Filename
      let baseFileName;
      if (asset.fileName) {
        baseFileName = asset.fileName.includes(".")
          ? asset.fileName.substring(0, asset.fileName.lastIndexOf("."))
          : asset.fileName;
      } else {
        const uriPathName = uri.substring(uri.lastIndexOf("/") + 1);
        baseFileName = uriPathName.includes(".")
          ? uriPathName.substring(0, uriPathName.lastIndexOf("."))
          : uriPathName;
      }
      const sanitizedBaseFileName = baseFileName.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

      const filePath = `public/${Date.now()}_${sanitizedBaseFileName}.${fileExt}`;
      const fileNameForFormData = `${sanitizedBaseFileName}.${fileExt}`;

      // FormData handles URI directly in React Native for network requests.
      // No need to read file as base64.
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: fileNameForFormData,
        type: determinedContentType,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("requests") // Same bucket for photos and videos
        .upload(filePath, formData, {
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        Alert.alert(
          "Upload Error",
          `Failed to upload media: ${uploadError.message}`
        );
        setIsUploading(false);
        setSelectedImageUri(null);
        return null;
      }

      const { data: publicUrlData, error: getUrlError } = await supabase.storage
        .from("requests")
        .getPublicUrl(filePath);

      if (getUrlError) {
        console.error("Error getting public URL from Supabase:", getUrlError);
        Alert.alert(
          "Error",
          `Failed to get media URL after upload: ${getUrlError.message}`
        );
        setIsUploading(false);
        setSelectedImageUri(null);
        return null;
      }

      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error(
          "Error getting public URL from Supabase: No public URL in data."
        );
        Alert.alert("Error", "Failed to get media URL after upload.");
        setIsUploading(false);
        setSelectedImageUri(null);
        return null;
      }

      console.log(
        "Successfully uploaded media. Public URL:",
        publicUrlData.publicUrl
      );
      setUploadedFileUrl(publicUrlData.publicUrl);
      setIsUploading(false);
      return publicUrlData.publicUrl;
    } catch (e) {
      console.error("Upload process error:", e);
      Alert.alert(
        "Upload Error",
        `An unexpected error occurred during upload: ${e.message}`
      );
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
        "You've refused to allow this app to access your photos/videos."
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
      allowsEditing: true, // Note: video editing might not be supported on all platforms or might be limited
      aspect: [4, 3], // Aspect ratio might apply mainly to image cropping
      quality: 1,
      // For videos, you might want to add videoExportPreset or videoQuality on iOS
    });

    if (pickerResult.canceled === true) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];
      // asset object contains 'mediaType' ('image' or 'video'), 'mimeType', 'uri', 'fileName', 'fileSize' etc.
      setSelectedImageUri(asset.uri); // This URI will be used for preview (Image component might not show video thumbnail)
      await uploadImage(asset); // Pass the full asset object
    }
  };

  const handleSend = async () => {
    Keyboard.dismiss();

    if (isUploading) {
      Alert.alert("Please wait", "Media is still uploading.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert(
        "Authentication Error",
        "Could not find user. Please log in again."
      );
      return;
    }

    // Get tenant's house information
    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .select("house_id")
      .eq("tenant_id", user.id)
      .single();

    if (tenantError) {
      console.error("Error getting tenant's house:", tenantError);
      Alert.alert("Error", "Could not find your housing information");
      return;
    }

    // Create the maintenance request
    const requestData = {
      user_id: user.id,
      reason: reason,
      priority: priority,
      description: message,
      image: uploadedFileUrl,
    };

    const { data: requestResult, error: requestError } = await supabase
      .from("requests")
      .insert([requestData])
      .select()
      .single();

    if (requestError) {
      console.error("Error adding request:", requestError);
      Alert.alert("Error", `Failed to send message: ${requestError.message}`);
      return;
    }
    console.log(requestData);
    // Create a group chat for this maintenance request
    const chatData = {
      house_id: tenantData.house_id,
      group_id: requestResult.request_id,
      tenants_only: false,
    };

    const { data: chatResult, error: chatError } = await supabase
      .from("chats")
      .insert([chatData])
      .select()
      .single();

    if (chatError) {
      console.error("Error creating chat:", chatError);
      // Don't alert the user since the request was still created successfully
    } else {
      // Send initial message in the chat
      const initialMessage = {
        group_id: chatResult.group_id,
        sender: user.id,
        content: `Maintenance request submitted:\n\nReason: ${
          reasons.find((r) => r.value === reason)?.label
        }\nPriority: ${
          priorities.find((p) => p.value === priority)?.label
        }\n\n${message}`,
        attachment: uploadedFileUrl,
        sent: new Date().toISOString(),
      };

      const { error: messageError } = await supabase
        .from("messages")
        .insert([initialMessage]);

      if (messageError) {
        console.error("Error sending initial message:", messageError);
      }
    }

    setReason("");
    setPriority(-1);
    setMessage("");
    setSelectedImageUri(null);
    setUploadedFileUrl(null);
    Alert.alert(
      "Success",
      "Maintenance request submitted successfully! A chat group has been created for this request."
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const getPriorityColor = () => {
    const selectedPriority = priorities.find((p) => p.value === priority);
    return selectedPriority ? selectedPriority.color : "#666";
  };

  const removeSelectedImage = () => {
    // Name kept for simplicity, handles selected media
    setSelectedImageUri(null);
    setUploadedFileUrl(null);
    if (isUploading) {
      setIsUploading(false);
    }
  };

  // ---------------- Helpers for availability selection ----------------

  const getDatesBetween = (startDateStr, endDateStr) => {
    const dates = {};
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    // Ensure chronological order
    if (start > end) {
      return getDatesBetween(endDateStr, startDateStr);
    }

    const current = new Date(start);
    while (current <= end) {
      const dateString = current.toISOString().split("T")[0];
      dates[dateString] = {
        selected: true,
        selectedColor: "#4CAF50",
      };
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handleDayPress = (day) => {
    if (alwaysAvailable) return; // Skip if always available selected

    const { dateString } = day;

    if (rangeStart) {
      // Range end selected – mark entire span
      const range = getDatesBetween(rangeStart, dateString);
      setMarkedDates((prev) => ({ ...prev, ...range }));
      setRangeStart(null);
    } else if (markedDates[dateString]) {
      // Toggle off existing mark
      const updated = { ...markedDates };
      delete updated[dateString];
      setMarkedDates(updated);
    } else {
      // Single-day toggle on
      setMarkedDates((prev) => ({
        ...prev,
        [dateString]: { selected: true, selectedColor: "#4CAF50" },
      }));
    }
  };

  const handleDayLongPress = (day) => {
    if (alwaysAvailable) return;
    setRangeStart(day.dateString);
  };

  const toggleAlwaysAvailable = () => {
    setAlwaysAvailable((prev) => !prev);
    if (!alwaysAvailable) {
      // When switching to always available, clear specific selections
      setMarkedDates({});
      setRangeStart(null);
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
            <View style={styles.labelRow}>
              <Text style={styles.label}>Priority Level</Text>
              <TouchableOpacity
                onPress={() => setShowPriorityInfo(true)}
                style={styles.infoButton}
              >
                <MaterialIcons name="info" size={20} color="#666" />
              </TouchableOpacity>
            </View>
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

          {/* ---------------- Availability Section ---------------- */}
          <View style={styles.section}>
            <Text style={styles.label}>Availability for Maintenance</Text>

            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setCalendarVisible(true)}
              disabled={alwaysAvailable}
            >
              <Text style={styles.dropdownText}>
                {alwaysAvailable
                  ? "Always available"
                  : Object.keys(markedDates).length > 0
                  ? `${Object.keys(markedDates).length} day(s) selected`
                  : "Select available days..."}
              </Text>
              {!alwaysAvailable && <Text style={styles.dropdownArrow}>▼</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={toggleAlwaysAvailable}
            >
              <MaterialIcons
                name={alwaysAvailable ? "check-box" : "check-box-outline-blank"}
                size={24}
                color="#000"
              />
              <Text style={[styles.dropdownText, { marginLeft: 8 }]}>
                Always available
              </Text>
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

          {/* Add the priority info modal */}
          <Modal
            visible={showPriorityInfo}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowPriorityInfo(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowPriorityInfo(false)}
            >
              <View style={styles.priorityInfoModal}>
                <Text style={styles.priorityInfoTitle}>
                  Priority Levels Guide
                </Text>
                {priorityExamples.map((priority) => (
                  <View key={priority.level} style={styles.priorityInfoSection}>
                    <View style={styles.priorityInfoHeader}>
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: priority.color },
                        ]}
                      />
                      <Text style={styles.priorityInfoLevel}>
                        {priority.level}
                      </Text>
                    </View>
                    <View style={styles.examplesList}>
                      {priority.examples.map((example, index) => (
                        <Text key={index} style={styles.exampleItem}>
                          • {example}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
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
              {/* Image component might not display video previews. 
                  For video previews, expo-av Video component would be needed.
                  This will show image previews and potentially a placeholder/first frame for videos. */}
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                onPress={removeSelectedImage}
                style={styles.removeImageButton}
              >
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
                <ActivityIndicator
                  size="small"
                  color="#666"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.attachButtonText}>Uploading...</Text>
              </View>
            ) : (
              <Text style={styles.attachButtonText}>📎 Attach Media</Text>
            )}
          </TouchableOpacity>

          {/* Calendar Modal */}
          <Modal
            visible={calendarVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setCalendarVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setCalendarVisible(false)}
            >
              <TouchableWithoutFeedback>
                <View style={styles.calendarModal}>
                  <Calendar
                    onDayPress={handleDayPress}
                    onDayLongPress={handleDayLongPress}
                    markedDates={markedDates}
                    markingType="simple"
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setCalendarVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </TouchableOpacity>
          </Modal>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (isUploading || !reason || priority < 0 || !message.trim()) &&
                styles.disabledButton,
            ]}
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
    flexDirection: "row",
    alignItems: "center",
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
    // Name kept for simplicity
    alignItems: "center",
    marginBottom: 20,
  },
  imagePreview: {
    // Name kept for simplicity
    width: 150,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  removeImageButton: {
    // Name kept for simplicity
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoButton: {
    marginLeft: 4,
    marginBottom: 5, // Adjust vertical alignment
    padding: 0, // Remove padding to better align with text
  },
  priorityInfoModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  priorityInfoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  priorityInfoSection: {
    marginBottom: 20,
  },
  priorityInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  priorityInfoLevel: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  examplesList: {
    paddingLeft: 20,
  },
  exampleItem: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  closeButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  calendarModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    padding: 10,
    alignItems: "center",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
});
