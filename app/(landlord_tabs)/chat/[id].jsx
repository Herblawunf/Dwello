import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Context as AuthContext } from "@/context/AuthContext";
import { useContext } from "react";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/context/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Calendar } from "react-native-calendars";

const MessageBubble = ({ message, isOwnMessage }) => {
  const theme = useTheme();

  const hasPollOptions = message.poll_option_1 && message.poll_option_2;

  return (
    <View
      style={[
        styles.messageBubble,
        isOwnMessage
          ? [styles.ownMessage, { backgroundColor: theme.colors.primary }]
          : [styles.otherMessage, { backgroundColor: theme.colors.surface }],
      ]}
    >
      {!isOwnMessage && (
        <ThemedText
          style={[styles.senderName, { color: theme.colors.primary }]}
        >
          {message.sender_name || "Unknown User"}
        </ThemedText>
      )}
      {message.attachment && (
        <Image
          source={{ uri: message.attachment }}
          style={styles.messageImage}
          resizeMode="cover"
        />
      )}
      {message.content && (
        <ThemedText
          style={[
            styles.messageText,
            isOwnMessage
              ? { color: "#FFFFFF" }
              : { color: theme.colors.onSurface },
          ]}
        >
          {message.content}
        </ThemedText>
      )}
      {hasPollOptions && (
        <View style={styles.pollContainer}>
          <ThemedText
            style={[
              styles.pollTitle,
              isOwnMessage
                ? { color: "#FFFFFF" }
                : { color: theme.colors.onSurface },
            ]}
          >
            Available dates:
          </ThemedText>
          {[message.poll_option_1, message.poll_option_2, message.poll_option_3]
            .filter(Boolean)
            .map((option, index) => (
              <View
                key={index}
                style={[
                  styles.pollOption,
                  {
                    backgroundColor: isOwnMessage
                      ? "rgba(255,255,255,0.2)"
                      : theme.colors.border,
                  },
                  message.poll_vote === index + 1 && styles.pollOptionSelected,
                ]}
              >
                <ThemedText
                  style={[
                    styles.pollOptionText,
                    isOwnMessage
                      ? { color: "#FFFFFF" }
                      : { color: theme.colors.onSurface },
                  ]}
                >
                  {new Date(option).toLocaleDateString()}
                </ThemedText>
                {message.poll_vote === index + 1 && (
                  <View style={styles.voteIndicator}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={isOwnMessage ? "#FFFFFF" : theme.colors.primary}
                    />
                  </View>
                )}
              </View>
            ))}
        </View>
      )}
      <ThemedText
        style={[
          styles.messageTime,
          isOwnMessage
            ? { color: "rgba(255, 255, 255, 0.7)" }
            : { color: theme.colors.placeholder },
        ]}
      >
        {new Date(message.sent).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </ThemedText>
    </View>
  );
};

const ChatHeader = ({ group }) => {
  const router = useRouter();
  const theme = useTheme();

  if (!group) {
    return (
      <ThemedView
        style={[styles.header, { borderBottomColor: theme.colors.border }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.onBackground}
          />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <ThemedText type="defaultSemiBold" style={styles.groupName}>
            Loading...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[styles.header, { borderBottomColor: theme.colors.border }]}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={theme.colors.onBackground}
        />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <ThemedText type="defaultSemiBold" style={styles.groupName}>
          {group.name}
        </ThemedText>
        <ThemedText
          type="default"
          style={[styles.memberCount, { color: theme.colors.placeholder }]}
        >
          {group.members?.length || 0} members
        </ThemedText>
      </View>
      <TouchableOpacity style={styles.settingsButton}>
        <Ionicons
          name="settings-outline"
          size={24}
          color={theme.colors.onBackground}
        />
      </TouchableOpacity>
    </ThemedView>
  );
};

const InputArea = ({
  onSend,
  onAttach,
  selectedImage,
  onRemoveImage,
  isUploading,
}) => {
  const [message, setMessage] = useState("");
  const [isPollMode, setIsPollMode] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const theme = useTheme();

  const handleSend = () => {
    if (
      message.trim() ||
      selectedImage ||
      (isPollMode && selectedDates.length)
    ) {
      if (isPollMode) {
        onSend(message, null, selectedDates);
        setSelectedDates([]);
        setIsPollMode(false);
      } else {
        onSend(message, selectedImage);
      }
      setMessage("");
    }
  };

  const handleDayPress = (day) => {
    const { dateString } = day;
    const date = new Date(dateString);

    if (selectedDates.length < 3) {
      setSelectedDates([...selectedDates, date]);
      setMarkedDates(prev => ({
        ...prev,
        [dateString]: { selected: true, selectedColor: theme.colors.primary }
      }));
    }
  };

  return (
    <ThemedView
      style={[styles.inputContainer, { borderTopColor: theme.colors.border }]}
    >
      {!isPollMode ? (
        <>
          <TouchableOpacity onPress={onAttach} style={styles.attachButton}>
            <Ionicons
              name="attach"
              size={24}
              color={theme.colors.placeholder}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsPollMode(true)}
            style={styles.attachButton}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={theme.colors.placeholder}
            />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.pollCreationContainer}>
          <ThemedText>Selected Dates:</ThemedText>
          {selectedDates.map((date, index) => (
            <View key={index} style={styles.selectedDateItem}>
              <ThemedText>{date.toLocaleDateString()}</ThemedText>
              <TouchableOpacity
                onPress={() => {
                  const dateString = date.toISOString().split('T')[0];
                  setSelectedDates(selectedDates.filter((_, i) => i !== index));
                  setMarkedDates(prev => {
                    const newMarkedDates = { ...prev };
                    delete newMarkedDates[dateString];
                    return newMarkedDates;
                  });
                }}
              >
                <Ionicons name="close" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {selectedDates.length < 3 && (
            <TouchableOpacity
              style={styles.addDateButton}
              onPress={() => setCalendarVisible(true)}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={theme.colors.primary}
              />
              <ThemedText style={{ color: theme.colors.primary }}>
                Add Date
              </ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelPollButton}
            onPress={() => {
              setIsPollMode(false);
              setSelectedDates([]);
              setMarkedDates({});
            }}
          >
            <ThemedText style={{ color: theme.colors.error }}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={[styles.input, { color: theme.colors.onBackground }]}
        value={message}
        onChangeText={setMessage}
        placeholder={
          isPollMode ? "Add a message for your poll..." : "Type a message..."
        }
        placeholderTextColor={theme.colors.placeholder}
        multiline
        maxLength={1000}
      />

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
                markedDates={markedDates}
                markingType="simple"
                minDate={new Date().toISOString().split('T')[0]}
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

      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <TouchableOpacity
            onPress={onRemoveImage}
            style={styles.removeImageButton}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        onPress={handleSend}
        style={[
          styles.sendButton,
          !message.trim() &&
            !selectedImage &&
            (!isPollMode || !selectedDates.length) &&
            styles.sendButtonDisabled,
        ]}
        disabled={
          (!message.trim() &&
            !selectedImage &&
            (!isPollMode || !selectedDates.length)) ||
          isUploading
        }
      >
        {isUploading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Ionicons
            name="send"
            size={24}
            color={
              message.trim() ||
              selectedImage ||
              (isPollMode && selectedDates.length)
                ? theme.colors.primary
                : theme.colors.placeholder
            }
          />
        )}
      </TouchableOpacity>
    </ThemedView>
  );
};

export default function ChatWindow() {
  const params = useLocalSearchParams();
  const id = params?.id;
  const [messages, setMessages] = useState([]);
  const [group, setGroup] = useState(null);
  const flatListRef = useRef(null);
  const channelRef = useRef(null);
  const { state: authState } = useContext(AuthContext);
  const userId = authState.userId;
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  const markMessagesAsRead = useCallback(async () => {
    if (!id || !userId) return;

    try {
      // Get all unread messages in this chat
      const { data: unreadMessages, error: unreadError } = await supabase
        .from("messages")
        .select("message_id")
        .eq("group_id", id)
        .not("sender", "eq", userId);

      if (unreadError) throw unreadError;
      if (!unreadMessages?.length) return;

      // Get already read messages
      const { data: readMessages, error: readError } = await supabase
        .from("read_message")
        .select("message_id")
        .eq("user_id", userId)
        .in(
          "message_id",
          unreadMessages.map((msg) => msg.message_id)
        );

      if (readError) throw readError;

      const readMessageIds = new Set(readMessages.map((msg) => msg.message_id));
      const messagesToMarkAsRead = unreadMessages
        .filter((msg) => !readMessageIds.has(msg.message_id))
        .map((msg) => ({
          message_id: msg.message_id,
          user_id: userId,
        }));

      if (messagesToMarkAsRead.length > 0) {
        const { error: insertError } = await supabase
          .from("read_message")
          .insert(messagesToMarkAsRead);

        if (insertError) throw insertError;

        // Refresh the chat list screen to update unread counts
        router.setParams({ refresh: Date.now().toString() });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [id, userId, router]);

  // Add real-time subscription
  useEffect(() => {
    if (!id) return;

    const setupSubscription = async () => {
      try {
        // Mark existing messages as read when opening chat
        await markMessagesAsRead();

        // Clean up any existing subscription
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Create new channel
        const channel = supabase
          .channel(`chat-${id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "messages",
              filter: `group_id=eq.${id}`,
            },
            async (payload) => {
              console.log("Real-time update:", payload);

              if (payload.eventType === "INSERT") {
                // Fetch user information for the new message
                const { data: userData, error: userError } = await supabase
                  .from("users")
                  .select("first_name, last_name")
                  .eq("id", payload.new.sender)
                  .single();

                const newMessage = {
                  ...payload.new,
                  sender_name: userData
                    ? `${userData.first_name} ${userData.last_name}`.trim()
                    : "Unknown User",
                };

                setMessages((prev) => [newMessage, ...prev]);

                // Mark new message as read if it's not from the current user
                if (payload.new.sender !== userId) {
                  await supabase.from("read_message").insert({
                    message_id: payload.new.message_id,
                    user_id: userId,
                  });
                }
              } else if (payload.eventType === "UPDATE") {
                // Handle message updates (e.g., poll votes)
                setMessages((prev) => {
                  const updatedMessages = [...prev];
                  const messageIndex = updatedMessages.findIndex(
                    (msg) => msg.message_id === payload.new.message_id
                  );
                  if (messageIndex !== -1) {
                    // Preserve sender_name while updating other fields
                    updatedMessages[messageIndex] = {
                      ...payload.new,
                      sender_name: updatedMessages[messageIndex].sender_name,
                    };
                  }
                  return updatedMessages;
                });
              }
            }
          )
          .subscribe();

        channelRef.current = channel;
      } catch (error) {
        console.error("Error setting up subscription:", error);
      }
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [id, userId, markMessagesAsRead]);

  const fetchMessages = useCallback(async () => {
    if (!id) return;

    try {
      console.log("Fetching messages for group:", id);
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("group_id", id)
        .order("sent", { ascending: false });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        throw messagesError;
      }

      console.log("Messages fetched:", messagesData?.length || 0);

      // Get user information for each message
      const messagesWithUsers = await Promise.all(
        (messagesData || []).map(async (message) => {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("id", message.sender)
            .single();

          if (userError) {
            console.error("Error fetching user:", userError);
            return {
              ...message,
              sender_name: "Unknown User",
            };
          }

          return {
            ...message,
            sender_name: userData
              ? `${userData.first_name} ${userData.last_name}`.trim()
              : "Unknown User",
          };
        })
      );

      console.log("Messages with users:", messagesWithUsers.length);
      setMessages(messagesWithUsers);
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      Alert.alert("Error", "Failed to load messages");
    }
  }, [id]);

  const fetchGroupInfo = useCallback(async () => {
    if (!id) return;

    try {
      console.log("Fetching group info for:", id);
      const { data: groupData, error: groupError } = await supabase
        .from("chats")
        .select(
          `
          *,
          houses (
            street_address,
            postcode
          )
        `
        )
        .eq("group_id", id)
        .single();

      if (groupError) {
        console.error("Error fetching group:", groupError);
        throw groupError;
      }

      // Get members of the chat
      const { data: membersData, error: membersError } = await supabase
        .from("tenants")
        .select("tenant_id")
        .eq("house_id", groupData.house_id);

      if (membersError) {
        console.error("Error fetching members:", membersError);
        throw membersError;
      }

      console.log("Group info fetched:", groupData);
      setGroup({
        ...groupData,
        name: groupData.houses?.street_address || "Chat",
        members: [...(membersData?.map((m) => m.tenant_id) || []), userId],
      });
    } catch (error) {
      console.error("Error in fetchGroupInfo:", error);
      Alert.alert("Error", "Failed to load chat information");
    }
  }, [id, userId]);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    console.log("Starting to fetch data for chat:", id);
    fetchGroupInfo();
    fetchMessages();
  }, [fetchGroupInfo, fetchMessages, id, router]);

  const uploadImage = async (asset) => {
    if (!asset || !asset.uri) {
      Alert.alert("Error", "No image selected");
      return null;
    }

    setIsUploading(true);

    try {
      const uri = asset.uri;
      const fileExt = uri.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `chats/${fileName}`;

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: fileName,
        type: `image/${fileExt}`,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("chats")
        .upload(filePath, formData, {
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = await supabase.storage
        .from("chats")
        .getPublicUrl(filePath);

      setIsUploading(false);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image");
      setIsUploading(false);
      return null;
    }
  };

  const handleAttach = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSend = async (content, imageUri, pollDates = null) => {
    if (!id) return;

    try {
      let attachment = null;
      if (imageUri) {
        attachment = await uploadImage({ uri: imageUri });
      }

      const messageData = {
        group_id: id,
        sender: userId,
        content: content,
        attachment: attachment,
        sent: new Date().toISOString(),
      };

      if (pollDates) {
        messageData.poll_option_1 = pollDates[0].toISOString();
        messageData.poll_option_2 = pollDates[1]?.toISOString();
        messageData.poll_option_3 = pollDates[2]?.toISOString();
      }

      const { error } = await supabase.from("messages").insert(messageData);

      if (error) throw error;

      setSelectedImage(null);
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    }
  };

  const renderMessage = useCallback(
    ({ item }) => (
      <MessageBubble
        key={item.message_id}
        message={item}
        isOwnMessage={item.sender === userId}
      />
    ),
    [userId]
  );

  if (!id) {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ChatHeader group={group} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
      >
        <View style={styles.mainContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) =>
              item.message_id?.toString() || Math.random().toString()
            }
            inverted
            contentContainerStyle={[
              styles.messagesList,
              { paddingBottom: 100 },
            ]}
          />
          <View style={styles.inputWrapper}>
            <InputArea
              onSend={handleSend}
              onAttach={handleAttach}
              selectedImage={selectedImage}
              onRemoveImage={() => setSelectedImage(null)}
              isUploading={isUploading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  inputWrapper: {
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
  },
  memberCount: {
    fontSize: 12,
  },
  settingsButton: {
    marginLeft: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  ownMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    padding: 8,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  imagePreviewContainer: {
    position: "relative",
    marginRight: 8,
  },
  imagePreview: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  pollContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    paddingTop: 8,
  },
  pollTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  pollOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  pollOptionText: {
    fontSize: 16,
  },
  voteIndicator: {
    marginLeft: 8,
  },
  pollOptionSelected: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  pollCreationContainer: {
    flex: 1,
    padding: 8,
  },
  selectedDateItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    marginVertical: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 4,
  },
  addDateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginTop: 8,
  },
  cancelPollButton: {
    padding: 8,
    alignItems: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    padding: 10,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
